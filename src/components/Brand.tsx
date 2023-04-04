import { Flex, Image, LinkBox, LinkOverlay } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export const Brand = () => {
  return (
    <LinkBox as={Flex} alignItems="center" gap="12px" fontSize="xl" fontWeight="bold">
      <Image width="32px" height="32px" src="/favicon-32x32.png" />
      <LinkOverlay as={Link} to="/">
        Briefer
      </LinkOverlay>
    </LinkBox>
  );
};
