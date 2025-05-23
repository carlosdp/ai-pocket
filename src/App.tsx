import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useSupabase } from './SupabaseProvider';
import { AuthenticatedRoutes } from './components/AuthenticatedRoutes';
import { Brand } from './components/Brand';
import { AddContent } from './screens/AddContent';
import { Admin } from './screens/Admin';
import { Bookmarks } from './screens/Bookmarks';
import { Briefings } from './screens/Briefings';
import { ExtensionLogin } from './screens/ExtensionLogin';
import { Login } from './screens/Login';
import { WatchBriefing } from './screens/WatchBriefing';

function App() {
  const { client, user } = useSupabase();

  useEffect(() => {
    if (user) {
      (async () => {
        const sessionRes = await client.auth.getSession();
        const session = sessionRes.data.session;

        if (session && chrome !== undefined && chrome.runtime) {
          chrome.runtime.sendMessage(import.meta.env.VITE_EXTENSION_ID, {
            session: { access_token: session.access_token, refresh_token: session.refresh_token },
          });
        }
      })();
    }
  }, [client, user]);

  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%">
      <Box justifyContent="center" display="flex" width="100%" padding="40px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="1690px">
          <Brand />
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthenticatedRoutes />}>
          <Route path="/" element={<Briefings />} />
          <Route path="/extension/login" element={<ExtensionLogin />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/add" element={<AddContent />} />
          <Route path="/briefings/:id" element={<WatchBriefing />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
