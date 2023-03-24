import { AspectRatio, Center, Spinner } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

import { VideoPlayer } from '../components/VideoPlayer';
import { useVideo } from '../hooks/useVideo';

export const WatchVideo = () => {
  const { id } = useParams<{ id: string }>();
  const { videoUrl } = useVideo(id!);

  return (
    <Center width="100%">
      {videoUrl ? (
        <AspectRatio width="100%" maxWidth="600px" ratio={9 / 16}>
          <VideoPlayer src={videoUrl} width="100%" height="100%" />
        </AspectRatio>
      ) : (
        <Spinner />
      )}
    </Center>
  );
};
