import { AspectRatio, Box, Button, Center, Flex, Heading, Image } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AiFillCaretLeft } from 'react-icons/ai';
import { Link, useParams } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';
import { PlaybackControl } from '../components/PlaybackControl';
import { Timeline, Sequence } from '../sequencer';
import { Database } from '../supabaseTypes';

export const WatchBriefing = () => {
  const { id } = useParams<{ id: string }>();
  const { client } = useSupabase();
  const timeline = useRef<Timeline | null>();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentSequence, setCurrentSequence] = useState<Sequence | null>(null);

  useEffect(() => {
    (async () => {
      const { data: bookmarks } = await client.rpc('briefing_bookmarks', { briefing_id: id! });

      if (bookmarks) {
        const sequences = [];

        // carlos: type cast necessary cause supabase gen gets this type wrong
        for (const bookmark of bookmarks as unknown as Database['public']['Tables']['bookmarks']['Row'][]) {
          if (bookmark.story) {
            // @ts-ignore
            for (const block of bookmark.story.blocks) {
              if (block.speech) {
                const { data: speechUrl } = await client.storage
                  .from('assets')
                  .createSignedUrl(block.speech.asset.key, 60 * 60 * 24);

                if (speechUrl) {
                  const imageId = block.arguments.url_id;
                  let imageUrl: string | undefined = undefined;

                  if (imageId) {
                    // @ts-ignore
                    const imageKey = bookmark.story.assets[imageId].storage.key;
                    const { data: imageData } = await client.storage
                      .from('assets')
                      .createSignedUrl(imageKey, 60 * 60 * 24);
                    imageUrl = imageData?.signedUrl;
                  }

                  sequences.push(new Sequence(speechUrl.signedUrl, bookmark.story, block, imageUrl));
                }
              }
            }
          }
        }

        timeline.current = new Timeline(sequences);
        setCurrentSequence(sequences[0]);
        setCurrentImage(sequences[0].imageUrl ?? null);
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
          currentSequence: newCurrentSequence,
          currentTime: newTime,
        }: {
          currentSequence: Sequence;
          currentTime: number;
        }) => {
          setCurrentTime(newTime);
          setCurrentImage(newCurrentSequence.imageUrl ?? null);
          setCurrentSequence(newCurrentSequence);
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
    <PageContainer>
      <Box>
        <Button as={Link} leftIcon={<AiFillCaretLeft />} to="/" variant="ghost">
          Back
        </Button>
      </Box>
      <Center width="100%">
        <Flex alignItems="center" flexDirection="column" width="100%" maxWidth="1200px">
          <Heading as="h2" fontSize="lg" fontWeight="bold" paddingBottom="18px">
            {currentSequence?.story.metadata.title}
          </Heading>
          <AspectRatio width="100%" height="60vh" ratio={16 / 9}>
            <Box alignItems="center" justifyContent="center" display="flex" overflow="hidden">
              {currentImage ? (
                <Image
                  width="auto"
                  height="100%"
                  objectFit="cover"
                  objectPosition="center"
                  alt="Current Image"
                  src={currentImage}
                />
              ) : (
                <Box minWidth="1200px" height="100%" backgroundColor="white" />
              )}
            </Box>
          </AspectRatio>
          <PlaybackControl
            duration={duration}
            currentTime={currentTime}
            onPlayPauseClick={togglePlay}
            isPlaying={isPlaying}
            onSeek={onSeek}
          />
        </Flex>
      </Center>
    </PageContainer>
  );
};
