import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useBookmarks = () => {
  const { client, user } = useSupabase();

  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data, error } = await client.from('bookmarks').select('*').eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user,
  });
};
