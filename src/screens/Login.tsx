import { Box, Card } from '@chakra-ui/react';
import { Auth, ThemeSupa } from '@supabase/auth-ui-react';
import { Navigate, useLocation } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

export const Login = () => {
  const { client, user } = useSupabase();
  const { state } = useLocation();

  if (user) {
    return <Navigate to={state?.forward ?? '/'} replace={true} />;
  }

  return (
    <PageContainer>
      <Box justifyContent="center" display="flex">
        <Card width="100%" maxWidth="500px">
          <Auth
            supabaseClient={client}
            providers={['google']}
            appearance={{
              theme: ThemeSupa,
              style: {
                button: {
                  background: `var(--chakra-colors-purple-500)`,
                  boxShadow: `0px 5px 0px var(--chakra-colors-purple-600)`,
                  border: 'none',
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                },
              },
            }}
          />
        </Card>
      </Box>
    </PageContainer>
  );
};
