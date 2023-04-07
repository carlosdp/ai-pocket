import { Button, Flex, Text } from '@chakra-ui/react';
import { useCallback } from 'react';

export const ExtensionLogin = () => {
  const onLogin = useCallback(() => {
    chrome.tabs.create({ url: `${import.meta.env.URL}/extension/login` });
  }, []);

  return (
    <Flex alignItems="center" justifyContent="center" flexDirection="column" gap="22px" height="100%">
      <Text fontSize="xl" fontWeight="bold" textAlign="center">
        You must login before you can save bookmarks
      </Text>
      <Button onClick={onLogin}>Login</Button>
    </Flex>
  );
};
