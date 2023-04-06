import { Button, Center, Flex, Heading, Spinner, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { useBookmarkByUrl } from '../hooks/useBookmarkByUrl';

const OUR_HOSTS = new Set(['localhost', 'briefer.carlosdp.xyz']);

export const Popup = () => {
  const [title, setTitle] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const { client, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removed, setRemoved] = useState(false);
  const saving = useRef(false);
  const { data: bookmark, isLoading: bookmarkLoading } = useBookmarkByUrl(url);

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
        chrome.runtime.sendMessage({ data: { url: contentUrl, user_id: user.id } }, res => {
          saving.current = false;
          setLoading(false);
          setSaved(res);
        });
      }
    },
    [user]
  );

  const remove = useCallback(async () => {
    if (url) {
      const { error } = await client.rpc('delete_bookmark_by_url', { url_to_remove: url });
      if (error) {
        console.error(error);
      }
      setRemoved(true);
    }
  }, [client, url]);

  const onLogin = useCallback(() => {
    chrome.tabs.create({ url: `${import.meta.env.URL}/extension/login` });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      const tab = tabs[0];

      if (tab) {
        setTitle(tab.title ?? null);
        setUrl(tab.url ?? null);
      }
    });
  }, [submit]);

  useEffect(() => {
    if (url && !bookmarkLoading && !bookmark) {
      if (OUR_HOSTS.has(new URL(url).host)) {
        return;
      }
      submit(url);
    }
  }, [bookmark, bookmarkLoading, submit, url]);

  let content = null;

  if (user !== undefined) {
    content = !user ? (
      <Flex alignItems="center" justifyContent="center">
        <Text fontSize="xl">You must login before you can save bookmarks</Text>
        <Button colorScheme="white" onClick={onLogin} variant="ghost">
          Login
        </Button>
      </Flex>
    ) : (
      <>
        <Heading as="h2" fontSize="lg" textAlign="center">
          {title}
        </Heading>
        <Center>
          {loading || bookmarkLoading ? (
            <>
              <Spinner color="white" />
              <Text fontSize="2xl" fontWeight="bold">
                Saving...
              </Text>
            </>
          ) : (saved || !!bookmark) && !removed ? (
            <Flex alignItems="center" flexDirection="column" gap="12px">
              <Text fontSize="2xl" fontWeight="bold">
                Saved!
              </Text>
              <Text fontSize="md" textAlign="center">
                This bookmark will be included in tomorrow's briefing
              </Text>
              <Button colorScheme="red" onClick={remove} size="sm" variant="ghost">
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
                Error
              </Text>
              <Text>Could not save this bookmark</Text>
            </Flex>
          )}
        </Center>
      </>
    );
  }

  return (
    <Flex
      flexDirection="column"
      gap="22px"
      width="350px"
      height="600px"
      padding="16px"
      color="white"
      background="green.300"
    >
      {content}
    </Flex>
  );
};
