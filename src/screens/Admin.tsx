import { Button } from '@chakra-ui/react';
import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

export const Admin = () => {
  const { user } = useSupabase();

  const render = useCallback(async () => {
    if (user) {
      const res = await fetch('/.netlify/functions/send-video-background', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error('Error adding content');
      }
    }
  }, [user]);

  return (
    <PageContainer>
      <Button onClick={render}>Render Video</Button>
    </PageContainer>
  );
};
