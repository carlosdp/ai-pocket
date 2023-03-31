import { Box, Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';

export const AddContent = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const { user } = useSupabase();

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  }, []);

  const submit = useCallback(async () => {
    if (user) {
      const res = await fetch('/.netlify/functions/add-content-background', {
        method: 'POST',
        body: JSON.stringify({ url, user_id: user.id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error('Error adding content');
      }

      navigate('/');
    }
  }, [url, navigate, user]);

  return (
    <Box>
      <FormControl>
        <FormLabel>URL</FormLabel>
        <Input onChange={onChange} />
      </FormControl>
      <Button onClick={submit}>Add</Button>
    </Box>
  );
};
