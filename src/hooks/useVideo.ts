// react hook that uses useSupabase hook and react-query to fetch a video by id from supabase
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useVideo = (id: string) => {
  const { client } = useSupabase();
  const res = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const { data, error } = await client.from('videos').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = res.data?.storage_key;
    if (storageKey) {
      (async () => {
        const { data } = await client.storage.from('assets').getPublicUrl(storageKey);

        if (data.publicUrl) {
          setVideoUrl(data.publicUrl);
        }
      })();
    }
  }, [client, res]);

  return { ...res, videoUrl };
};
