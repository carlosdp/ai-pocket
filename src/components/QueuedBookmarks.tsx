import { Box, Button, Flex, Heading, Image, Link, LinkBox, LinkOverlay, Skeleton } from '@chakra-ui/react';
import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { useAsyncMemo } from '../hooks/useAsyncMemo';
import { useQueuedBookmarks } from '../hooks/useQueuedBookmarks';
import { Database } from '../supabaseTypes';

type BookmarkProps = {
  bookmark: Database['public']['Views']['queued_bookmarks']['Row'];
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
      <LinkOverlay as={Link} fontWeight="bold" href={bookmark.url ?? undefined} noOfLines={2}>
        {bookmark.title ?? bookmark.url}
      </LinkOverlay>
    </LinkBox>
  );
};

export const QueuedBookmarks = () => {
  const { user } = useSupabase();
  const { data: queuedBookmarks } = useQueuedBookmarks();

  const briefNow = useCallback(async () => {
    if (user) {
      const res = await fetch('/.netlify/functions/synthesize-story-background', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error('Error adding content');
      }
    }
  }, [user]);

  return (
    <Flex flexDirection="column" gap="30px" padding="25px" background="gray.50" borderRadius="12px">
      <Flex alignItems="center" justifyContent="space-between">
        <Heading as="h3" fontSize="lg" fontWeight="bold">
          Next Briefing
        </Heading>
        <Button onClick={briefNow} variant="ghost">
          Brief Now
        </Button>
      </Flex>
      <Flex flexWrap="wrap" gap="24px">
        {queuedBookmarks?.map(bookmark => (
          <Bookmark key={bookmark.id} bookmark={bookmark} />
        ))}
      </Flex>
    </Flex>
  );
};
