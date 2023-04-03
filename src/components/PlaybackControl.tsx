import { Box, Button, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { AiFillPauseCircle, AiFillPlayCircle } from 'react-icons/ai';

const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export interface PlaybackControlProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPauseClick?: () => void;
  onSeek?: (value: number) => void;
}

export const PlaybackControl = ({
  duration,
  currentTime,
  isPlaying,
  onPlayPauseClick,
  onSeek,
}: PlaybackControlProps) => {
  const [currentSliderValue, setCurrentSliderValue] = useState(currentTime);

  useEffect(() => {
    setCurrentSliderValue(currentTime);
  }, [currentTime]);

  const handlePlayPauseClick = useCallback(() => {
    onPlayPauseClick?.();
  }, [onPlayPauseClick]);

  const handleSeekBarChange = useCallback((value: number) => {
    setCurrentSliderValue(value);
  }, []);

  const finishSeek = useCallback(
    (value: number) => {
      onSeek?.(value);
    },
    [onSeek]
  );

  return (
    <Box alignItems="center" display="flex">
      <Button marginRight={4} onClick={handlePlayPauseClick} variant="solid">
        {isPlaying ? <AiFillPauseCircle size="18px" /> : <AiFillPlayCircle size="18px" />}
      </Button>
      <Slider
        width="300px"
        aria-label="seek-bar"
        max={duration}
        min={0}
        onChange={handleSeekBarChange}
        onChangeEnd={finishSeek}
        step={0.01}
        value={currentSliderValue}
      >
        <SliderMark value={0}>{formatTime(currentSliderValue)}</SliderMark>
        <SliderMark value={duration}>{formatTime(duration)}</SliderMark>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Box>
  );
};
