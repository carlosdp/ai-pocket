import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useBriefings = () => {
  const { client, user } = useSupabase();

  return useQuery({
    queryKey: ['briefings'],
    queryFn: async () => {
      const { data, error } = await client.from('briefings').select('*').eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user,
  });
};
