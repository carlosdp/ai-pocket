import { Box, Button, Center, Flex, Heading, Link, Spinner } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useSavedContents } from '../hooks/useSavedContents';

export const SavedContents = () => {
  const { data: contents, isLoading } = useSavedContents();

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="22px">
        <Heading>Saved Content</Heading>
        <Flex gap="12px">
          <Button as={RouterLink} to="/add">
            Add
          </Button>
        </Flex>
        <Box>
          {isLoading ? (
            <Center>
              <Spinner />
            </Center>
          ) : (
            <Flex flexDirection="column" gap="16px">
              {contents?.map(content => (
                <Link key={content.id} fontSize="lg" href={content.url}>
                  {content.id}
                </Link>
              ))}
            </Flex>
          )}
        </Box>
      </Flex>
    </PageContainer>
  );
};
