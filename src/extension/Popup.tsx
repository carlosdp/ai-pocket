import { Button, Center, Flex, Heading, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { useBookmarkByUrl } from '../hooks/useBookmarkByUrl';

export const Popup = () => {
  const [url, setUrl] = useState<string | null>(null);
  const { client, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const onLogin = useCallback(() => {
    chrome.tabs.create({ url: `${import.meta.env.URL}/login` });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      setUrl(tabs[0].url ?? null);
    });
  }, [submit]);

  useEffect(() => {
    if (url && !bookmarkLoading && !bookmark) {
      submit(url);
    }
  }, [bookmark, bookmarkLoading, submit, url]);

  let content = null;

  if (user !== undefined) {
    content = !user ? (
      <Center>
        <Button onClick={onLogin}>Login</Button>
      </Center>
    ) : (
      <>
        <Heading>Briefing</Heading>
        <Center>
          {loading || bookmarkLoading ? (
            <Text fontSize="2xl" fontWeight="bold">
              Saving...
            </Text>
          ) : saved || !!bookmark ? (
            <Text fontSize="2xl" fontWeight="bold">
              Saved!
            </Text>
          ) : (
            <Text fontSize="2xl" fontWeight="bold">
              Not saved
            </Text>
          )}
        </Center>
        <Center>
          <Text fontSize="md">{url}</Text>
        </Center>
      </>
    );
  }

  return (
    <Flex flexDirection="column" gap="22px" minWidth="400px" minHeight="200px" padding="16px">
      {content}
    </Flex>
  );
};
