import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useBookmarkByUrl = (url?: string | null) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['bookmark_by_url', url],
    queryFn: async () => {
      const { data, error } = await client.from('queued_bookmarks').select('*').eq('url', url);

      if (error) {
        throw new Error(error.message);
      }

      return data.length > 0 ? data[0] : null;
    },
    enabled: !!url,
  });
};
