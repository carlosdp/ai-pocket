import { Box, BoxProps } from '@chakra-ui/react';
import { useRef, useEffect } from 'react';
import videojs, { VideoJsPlayer } from 'video.js';
import 'video.js/dist/video-js.css';

export type VideoPlayerProps = {
  src: string | Blob;
} & BoxProps;

export const VideoPlayer = ({ src, ...divProps }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null!);
  const playerRef = useRef<VideoJsPlayer>(null!);

  useEffect(() => {
    const videoSrc = typeof src === 'string' ? src : URL.createObjectURL(src);

    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement('video-js');

      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.append(videoElement);

      playerRef.current = videojs(
        videoElement,
        {
          responsive: true,
          controls: true,
          fluid: true,
          autoplay: false,
          sources: [{ src: videoSrc, type: 'video/mp4' }],
        },
        () => {
          videojs.log('player is ready');
        }
      );

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current;

      player.autoplay(false);
      player.src([{ src: videoSrc, type: 'video/mp4' }]);
    }
  }, [videoRef, src]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        // @ts-ignore
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <Box data-vjs-player {...divProps}>
      <Box ref={videoRef} {...divProps} />
    </Box>
  );
};
