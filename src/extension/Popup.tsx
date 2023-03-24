import { Button, Center, Flex, Heading, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { useSavedContent } from '../hooks/useSavedContent';

export const Popup = () => {
  const [url, setUrl] = useState<string | null>(null);
  const { client, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const { data: savedContent, isLoading: savedContentLoading } = useSavedContent(url);

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
    chrome.tabs.create({ url: `${import.meta.env.BASE_URL}/login` });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      setUrl(tabs[0].url ?? null);
    });
  }, [submit]);

  useEffect(() => {
    if (url && !savedContentLoading && !savedContent) {
      submit(url);
    }
  }, [savedContent, savedContentLoading, submit, url]);

  let content = null;

  if (user !== undefined) {
    content = !user ? (
      <Center>
        <Button onClick={onLogin}>Login</Button>
      </Center>
    ) : (
      <>
        <Heading>Overload</Heading>
        <Center>
          {loading || savedContentLoading ? (
            <Text fontSize="2xl" fontWeight="bold">
              Saving...
            </Text>
          ) : saved || !!savedContent ? (
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
