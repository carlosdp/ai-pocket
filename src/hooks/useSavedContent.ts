// react component that uses the useSupabase hook and react-query to fetch a row from the saved_contents table using the "url"
import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useSavedContent = (url?: string | null) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['savedContent', url],
    queryFn: async () => {
      const { data, error } = await client.from('saved_contents').select('*').eq('url', url).single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!url,
  });
};
