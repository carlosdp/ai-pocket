import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useQueuedBookmarks = () => {
  const { client, user } = useSupabase();

  return useQuery({
    queryKey: ['queued_bookmarks'],
    queryFn: async () => {
      const { data, error } = await client.from('queued_bookmarks').select('*').eq('user_id', user?.id);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user,
  });
};
