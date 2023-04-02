import { Center } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PlaybackControl } from '../components/PlaybackControl';
import { Timeline, Sequence } from '../sequencer';

export const WatchBriefing = () => {
  const { id } = useParams<{ id: string }>();
  const { client } = useSupabase();
  const timeline = useRef<Timeline | null>();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: briefing, error: briefingError } = await client.from('briefings').select('*').eq('id', id).single();

      if (briefingError) {
        console.error(briefingError);
        return;
      }

      const { data: bookmarks } = await client
        .from('bookmarks')
        .select('*')
        .in(
          'id',
          // @ts-ignore
          briefing.contents.map(c => c.id)
        );

      if (bookmarks) {
        const sequences = [];

        for (const savedContent of bookmarks) {
          if (savedContent.story) {
            // @ts-ignore
            for (const block of savedContent.story.blocks) {
              if (block.speech) {
                const { data: speechUrl } = await client.storage
                  .from('assets')
                  .createSignedUrl(block.speech.asset.key, 60 * 60 * 24);

                if (speechUrl) {
                  sequences.push(new Sequence(speechUrl.signedUrl));
                }
              }
            }
          }
        }

        timeline.current = new Timeline(sequences);
      }
    })();
  }, [id, client]);

  const togglePlay = useCallback(async () => {
    if (timeline.current) {
      if (timeline.current.isPlaying()) {
        timeline.current.pause();
      } else {
        await timeline.current.load();
        setDuration(timeline.current.duration);
        const onProgress = ({
          currentFrameIndex,
          currentTime: newTime,
        }: {
          currentFrameIndex: number;
          currentTime: number;
        }) => {
          setCurrentTime(newTime);
        };
        timeline.current.on('progress', onProgress);

        timeline.current.on('playing', () => setIsPlaying(true));
        timeline.current.on('paused', () => setIsPlaying(false));
        timeline.current.on('ended', () => setIsPlaying(false));

        timeline.current.play();

        return () => {
          timeline.current?.off('progress', onProgress);
        };
      }
    }
  }, []);

  const onSeek = useCallback((value: number) => {
    if (timeline.current) {
      timeline.current.seek(value);
    }
  }, []);

  return (
    <Center width="100%">
      <PlaybackControl
        duration={duration}
        currentTime={currentTime}
        onPlayPauseClick={togglePlay}
        isPlaying={isPlaying}
        onSeek={onSeek}
      />
    </Center>
  );
};
