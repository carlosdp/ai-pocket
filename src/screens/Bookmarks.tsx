import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
  Skeleton,
  Spinner,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';
import { useAsyncMemo } from '../hooks/useAsyncMemo';
import { useBookmarks } from '../hooks/useBookmarks';
import { Database } from '../supabaseTypes';

type BookmarkProps = {
  bookmark: Database['public']['Tables']['bookmarks']['Row'];
};

const Bookmark = ({ bookmark }: BookmarkProps) => {
  const { client } = useSupabase();
  const [screenshotUrl] = useAsyncMemo(async () => {
    if (bookmark.screenshot_key) {
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
      <LinkOverlay as={Link} fontWeight="bold" href={bookmark.url} noOfLines={2}>
        {bookmark.title ?? bookmark.url}
      </LinkOverlay>
    </LinkBox>
  );
};

export const Bookmarks = () => {
  const { data: contents, isLoading } = useBookmarks();

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="22px">
        <Heading>Bookmarks</Heading>
        <Flex gap="12px">
          <Button as={RouterLink} to="/add">
            Add
          </Button>
        </Flex>
        <Box>
          {isLoading ? (
            <Center>
              <Spinner />
            </Center>
          ) : (
            <Flex flexWrap="wrap" gap="16px">
              {contents?.map(content => (
                <Bookmark key={content.id} bookmark={content} />
              ))}
            </Flex>
          )}
        </Box>
      </Flex>
    </PageContainer>
  );
};
