import { Button, Flex, Heading, Spinner, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { useBookmarkByUrl } from '../hooks/useBookmarkByUrl';

const OUR_HOSTS = new Set(['localhost', 'pouch.website', 'app.pouch.website']);

export type SaveBookmarkProps = {
  tab: chrome.tabs.Tab;
};

export const SaveBookmark = ({ tab }: SaveBookmarkProps) => {
  const { client, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removed, setRemoved] = useState(false);
  const saving = useRef(false);
  const { data: bookmark, isLoading: bookmarkLoading } = useBookmarkByUrl(tab?.url);

  useEffect(() => {
    if (!user) {
      chrome.storage.local.get(['session'], result => {
        if (result.session) {
          client.auth.refreshSession(result.session);
        }
      });
    }
  }, [client, user]);

  const submit = useCallback(
    async (contentUrl: string) => {
      if (user && !saving.current) {
        saving.current = true;
        setLoading(true);
        chrome.runtime.sendMessage({ type: 'save_url', data: { url: contentUrl, user_id: user.id } }, res => {
          saving.current = false;
          setLoading(false);
          setSaved(res);
        });
      }
    },
    [user]
  );

  const remove = useCallback(async () => {
    if (tab?.url) {
      const { error } = await client.rpc('delete_bookmark_by_url', { url_to_remove: tab.url });
      if (error) {
        console.error(error);
      }
      setRemoved(true);
    }
  }, [client, tab]);

  useEffect(() => {
    if (tab && tab.url && !bookmarkLoading && !bookmark) {
      if (OUR_HOSTS.has(new URL(tab.url).host)) {
        return;
      }
      submit(tab.url);
    }
  }, [tab, bookmark, bookmarkLoading, submit]);

  return (
    <Flex flexDirection="column" gap="18px" height="100%">
      <Heading as="h2" fontSize="lg" fontWeight="bold" textAlign="center" noOfLines={1}>
        {tab.title}
      </Heading>
      <Flex alignItems="center" justifyContent="center" flexDirection="column" flex={1}>
        {loading || bookmarkLoading ? (
          <Flex alignItems="center" justifyContent="center" flexDirection="column">
            <Spinner color="white" size="xl" />
            <Text fontSize="2xl" fontWeight="bold">
              Saving...
            </Text>
          </Flex>
        ) : (saved || !!bookmark) && !removed ? (
          <Flex alignItems="center" flexDirection="column" gap="12px">
            <Text fontSize="2xl" fontWeight="bold">
              Saved!
            </Text>
            <Text fontSize="md" textAlign="center">
              This bookmark will be included in tomorrow's briefing
            </Text>
            <Button colorScheme="red" onClick={remove} size="sm" variant="solid">
              Remove
            </Button>
          </Flex>
        ) : removed ? (
          <Flex alignItems="center" flexDirection="column" gap="12px">
            <Text fontSize="2xl" fontWeight="bold">
              Removed
            </Text>
            <Text>This bookmark will not be included in tomorrow's briefing</Text>
          </Flex>
        ) : (
          <Flex alignItems="center" flexDirection="column">
            <Text fontSize="2xl" fontWeight="bold">
              Error!
            </Text>
            <Text>Could not save this bookmark</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};
