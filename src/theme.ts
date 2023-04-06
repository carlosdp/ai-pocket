import { defineStyleConfig, extendTheme, withDefaultColorScheme } from '@chakra-ui/react';

export const theme = extendTheme(
  {
    config: {
      initialColorMode: 'system',
    },
  },
  withDefaultColorScheme({ colorScheme: 'green' }),
  {
    components: {
      PageContainer: defineStyleConfig({
        baseStyle: {
          maxWidth: '1690px',
        },
        variants: {
          'full-bleed': {
            maxWidth: '2200px',
          },
        },
      }),
    },
  }
);
