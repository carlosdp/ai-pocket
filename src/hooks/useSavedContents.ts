import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useSavedContents = () => {
  const { client, user } = useSupabase();

  return useQuery({
    queryKey: ['savedContents'],
    queryFn: async () => {
      const { data, error } = await client.from('saved_contents').select('*').eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user,
  });
};
