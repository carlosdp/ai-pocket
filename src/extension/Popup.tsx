import { Box, Button, Center, Flex, Heading, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';

export const Popup = () => {
  const [url, setUrl] = useState<string | null>(null);
  const { client, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);

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
    chrome.tabs.create({ url: `${import.meta.env.VITE_URL}/login` });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      setUrl(tabs[0].url ?? null);
      if (tabs[0].url) {
        submit(tabs[0].url);
      }
    });
  }, [submit]);

  if (!user) {
    return (
      <Box minWidth="300px">
        <Button onClick={onLogin}>Login</Button>
      </Box>
    );
  }

  return (
    <Flex flexDirection="column" gap="22px" minWidth="400px" minHeight="200px" padding="16px">
      <Heading>AI Pocket</Heading>
      <Center>
        {loading ? (
          <Text fontSize="2xl" fontWeight="bold">
            Saving...
          </Text>
        ) : saved ? (
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
    </Flex>
  );
};
