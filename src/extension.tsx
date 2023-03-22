import { ChakraProvider, ColorModeScript, GlobalStyle } from '@chakra-ui/react';
import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { SupabaseProvider } from './SupabaseProvider';
import { Popup } from './extension/Popup';
import type { Database } from './supabaseTypes';
import { theme } from './theme';

const client = new SupabaseClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <GlobalStyle />
        <BrowserRouter>
          <SupabaseProvider client={client}>
            <Popup />
          </SupabaseProvider>
        </BrowserRouter>
      </ChakraProvider>
    </React.StrictMode>
  </>
);
