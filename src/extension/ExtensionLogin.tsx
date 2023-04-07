import { Button, Flex, Text } from '@chakra-ui/react';
import { useCallback } from 'react';

export const ExtensionLogin = () => {
  const onLogin = useCallback(() => {
    chrome.tabs.create({ url: `${import.meta.env.URL}/extension/login` });
  }, []);

  return (
    <Flex alignItems="center" justifyContent="center" height="100%">
      <Text fontSize="xl" fontWeight="bold">
        You must login before you can save bookmarks
      </Text>
      <Button colorScheme="white" onClick={onLogin} variant="ghost">
        Login
      </Button>
    </Flex>
  );
};
