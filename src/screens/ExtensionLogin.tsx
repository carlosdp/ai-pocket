import { Center, Heading, Text } from '@chakra-ui/react';

import { PageContainer } from '../components/PageContainer';

export const ExtensionLogin = () => {
  return (
    <PageContainer>
      <Center flexDirection="column" gap="32px">
        <Heading as="h2" size="2xl">
          You are now logged in!
        </Heading>
        <Text fontSize="xl">You can close this tab</Text>
      </Center>
    </PageContainer>
  );
};
