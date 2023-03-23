import { Box, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

import { useSupabase } from '../SupabaseProvider';

export const Popup = () => {
  const [url, setUrl] = useState<string | null>(null);
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

  const submit = useCallback(
    async (contentUrl: string) => {
      if (user) {
        chrome.runtime.sendMessage({ url: contentUrl, user_id: user.id });
      }
    },
    [user]
  );

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      setUrl(tabs[0].url ?? null);
      if (tabs[0].url) {
        submit(tabs[0].url);
      }
    });
  }, [submit]);

  return (
    <Box minWidth="300px">
      <Text>Current: {url}</Text>
    </Box>
  );
};
