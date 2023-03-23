import { Box, Button, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import { useSupabase } from './SupabaseProvider';
import { AuthenticatedRoutes } from './components/AuthenticatedRoutes';
import { AddContent } from './screens/AddContent';
import { Login } from './screens/Login';

function Home() {
  return (
    <Box width="100%" maxWidth="936px">
      <Button as={Link} to="/add">
        Add
      </Button>
    </Box>
  );
}

function App() {
  const { client, user } = useSupabase();

  useEffect(() => {
    if (user) {
      (async () => {
        const sessionRes = await client.auth.getSession();
        const session = sessionRes.data.session;

        if (session) {
          chrome.runtime.sendMessage(import.meta.env.VITE_EXTENSION_ID, {
            session: { access_token: session.access_token, refresh_token: session.refresh_token },
          });
        }
      })();
    }
  }, [client, user]);

  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="936px">
          <Text>Starter</Text>
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthenticatedRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddContent />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
