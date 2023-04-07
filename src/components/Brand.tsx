import { Flex, Image, LinkBox, LinkOverlay } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export const Brand = () => {
  return (
    <LinkBox as={Flex} alignItems="center" gap="12px" fontSize="xl" fontWeight="bold">
      <Image width="36px" height="36px" src="/pouchlogo-small.png" />
      <LinkOverlay as={Link} to="/">
        Pouch
      </LinkOverlay>
    </LinkBox>
  );
};
