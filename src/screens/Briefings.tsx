import { Box, Center, Flex, Heading, Image, LinkBox, LinkOverlay, Skeleton, Spinner } from '@chakra-ui/react';
import moment from 'moment';
import { Link } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';
import { QueuedBookmarks } from '../components/QueuedBookmarks';
import { useAsyncMemo } from '../hooks/useAsyncMemo';
import { useBookmark } from '../hooks/useBookmark';
import { useBriefings } from '../hooks/useBriefings';
import { Database } from '../supabaseTypes';

type BriefingProps = {
  briefing: Database['public']['Tables']['briefings']['Row'];
};

const Briefing = ({ briefing }: BriefingProps) => {
  const { client } = useSupabase();
  // @ts-ignore
  const { data: bookmark } = useBookmark(briefing.contents[0]?.id);
  const [screenshotUrl] = useAsyncMemo(async () => {
    if (bookmark?.screenshot_key) {
      const { data: screenshot } = await client.storage
        .from('assets')
        .createSignedUrl(bookmark.screenshot_key, 60 * 60 * 24);

      return screenshot?.signedUrl ?? null;
    }

    return null;
  }, [client, bookmark]);

  return (
    <LinkBox as={Flex} flexDirection="column" gap="8px" width="150px">
      <Box width="150px" height="150px">
        {screenshotUrl ? (
          <Image width="auto" height="100%" objectFit="cover" objectPosition="center" src={screenshotUrl} />
        ) : (
          <Skeleton width="150px" height="150px" />
        )}
      </Box>
      <LinkOverlay as={Link} fontWeight="bold" textAlign="center" noOfLines={2} to={`/briefings/${briefing.id}`}>
        {moment(briefing.created_at).format('DD/MM/YYYY')}
      </LinkOverlay>
    </LinkBox>
  );
};

export const Briefings = () => {
  const { data: contents, isLoading } = useBriefings();

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="22px">
        <QueuedBookmarks />
        <Heading>Briefings</Heading>
        <Box>
          {isLoading ? (
            <Center>
              <Spinner />
            </Center>
          ) : (
            <Flex flexWrap="wrap" gap="16px">
              {contents?.map(content => (
                <Briefing key={content.id} briefing={content} />
              ))}
            </Flex>
          )}
        </Box>
      </Flex>
    </PageContainer>
  );
};
