import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useBookmark = (id?: string | null) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['bookmark', id],
    queryFn: async () => {
      const { data, error } = await client.rpc('bookmark_by_id', { id: id! }).single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!id,
  });
};
