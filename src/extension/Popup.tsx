import { Box, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

export const Popup = () => {
  const [url, setUrl] = useState<string | null>(null);

  const submit = useCallback(async (contentUrl: string) => {
    chrome.runtime.sendMessage({ contentUrl });
  }, []);

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
