import { Center, Flex, Spinner } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { ExtensionLogin } from './LoginRequest';
import { SaveBookmark } from './SaveBookmark';

export const Popup = () => {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const { client, user } = useSupabase();

  useEffect(() => {
    if (!user) {
      chrome.storage.local.get(['session'], result => {
        if (result.session) {
          client.auth.refreshSession(result.session);
        }
      });
    }
  }, [client, user]);

  useEffect(() => {
    (async () => {
      const [newTab] = await chrome.tabs.query({ currentWindow: true, active: true });
      setTab(newTab ?? null);
    })();
  }, []);

  let content = null;

  if (!tab || user === undefined) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  content = !user ? <ExtensionLogin /> : <SaveBookmark tab={tab} />;

  return (
    <Flex
      flexDirection="column"
      gap="22px"
      width="350px"
      height="600px"
      padding="16px"
      color="white"
      background="green.400"
    >
      {content}
    </Flex>
  );
};
