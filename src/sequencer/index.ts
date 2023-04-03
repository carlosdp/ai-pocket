// eslint-disable-next-line unicorn/prefer-node-protocol
import { EventEmitter } from 'events';

export class Sequence extends EventEmitter {
  private audioUrl: string;
  private audioContext: AudioContext | null;
  private audioBuffer: AudioBuffer | null;
  private audioNode: AudioBufferSourceNode | null;
  private startTime: number;
  private pauseTime: number;
  public isPlaying: boolean;
  public duration: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public story: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public storyBlock: any;
  public imageUrl?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(audioUrl: string, story: any, block: any, imageUrl?: string) {
    super();
    this.audioUrl = audioUrl;
    this.audioContext = null;
    this.audioBuffer = null;
    this.audioNode = null;
    this.startTime = 0;
    this.pauseTime = 0;
    this.isPlaying = false;
    this.duration = 0;
    this.story = story;
    this.storyBlock = block;
    this.imageUrl = imageUrl;
  }

  async load(): Promise<void> {
    this.audioContext = new AudioContext();
    const response = await fetch(this.audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;
  }

  play(): void {
    if (this.isPlaying) return;
    if (!this.audioContext) throw new Error('AudioContext is not initialized');

    this.audioNode = this.audioContext.createBufferSource();
    this.audioNode.buffer = this.audioBuffer;
    this.audioNode.connect(this.audioContext.destination);
    this.startTime = this.audioContext.currentTime - (this.pauseTime || 0);
    this.audioNode.start(this.audioContext.currentTime, this.pauseTime || 0);

    this.audioNode.addEventListener('ended', () => {
      if (!this.isPlaying) return;
      this.stop();
      this.emit('ended');
    });

    this.isPlaying = true;
    this.emit('playing');
  }

  pause(): void {
    if (!this.isPlaying) return;
    if (!this.audioContext) throw new Error('AudioContext is not initialized');
    if (!this.audioNode) return;

    this.isPlaying = false;
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.audioNode.stop();

    this.emit('paused');
  }

  stop(): void {
    if (!this.isPlaying) return;
    if (!this.audioNode) return;

    this.isPlaying = false;
    this.pauseTime = 0;
    this.audioNode.stop();
  }

  currentTime(): number {
    if (!this.audioContext) throw new Error('AudioContext is not initialized');
    if (!this.audioNode) return 0;

    return this.audioContext.currentTime - this.startTime;
  }

  setPauseTime(time: number): void {
    if (!this.audioNode) return;
    this.audioNode.stop();
    this.pauseTime = time;
  }
}

export class Timeline extends EventEmitter {
  private sequences: Sequence[];
  private currentSequenceIndex: number;
  public duration: number;
  public currentPosition: number;
  private loaded: boolean;

  constructor(sequences: Sequence[]) {
    super();
    this.sequences = sequences;
    this.currentSequenceIndex = 0;
    this.duration = 0;
    this.currentPosition = 0;
    this.loaded = false;

    this.updateDuration();
    this.attachSequenceListeners();
  }

  private updateDuration(): void {
    this.duration = this.sequences.reduce((acc, seq) => acc + seq.duration, 0);
  }

  private attachSequenceListeners(): void {
    this.sequences.forEach((seq, i) => {
      seq.on('ended', () => {
        if (i < this.sequences.length - 1) {
          setTimeout(() => {
            this.currentSequenceIndex++;
            this.play();
          }, 0);
        } else {
          this.emit('ended');
          this.currentSequenceIndex = 0;
        }
      });
    });
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    const loadPromises = this.sequences.map(sequence => sequence.load());
    await Promise.all(loadPromises);
    this.updateDuration();
    this.loaded = true;
  }

  play(): void {
    this.sequences[this.currentSequenceIndex].play();
    this.currentPosition = this.calculateCurrentPosition();
    this.emit('playing');
    this.updateCurrentPosition();
  }

  pause(): void {
    this.sequences[this.currentSequenceIndex].pause();
    this.currentPosition = this.calculateCurrentPosition();
    this.emit('paused');
  }

  stop(): void {
    this.sequences[this.currentSequenceIndex].stop();
    this.currentSequenceIndex = 0;
    this.currentPosition = 0;
    this.emit('ended');
  }

  seek(time: number): void {
    if (time < 0 || time > this.duration) {
      throw new Error('Invalid seek time.');
    }

    // Pause the current sequence.
    this.pause();

    let elapsedTime = 0;
    let seekIndex = 0;

    for (let i = 0; i < this.sequences.length; i++) {
      const sequenceDuration = this.sequences[i].duration;

      if (elapsedTime + sequenceDuration > time) {
        seekIndex = i;
        break;
      }

      elapsedTime += sequenceDuration;
    }

    this.currentSequenceIndex = seekIndex;
    const seekTimeInSequence = time - elapsedTime;

    // Update the playback position of the current sequence.
    this.sequences[this.currentSequenceIndex].setPauseTime(seekTimeInSequence);

    this.currentPosition = time;

    // Resume playback if any sequence was playing before seeking.
    if (this.isPlaying()) {
      this.play();
    }
  }

  private calculateCurrentPosition(): number {
    const playedSequences = this.sequences.slice(0, this.currentSequenceIndex);
    const playedTime = playedSequences.reduce((acc, seq) => acc + seq.duration, 0);
    const currentSequenceTime = this.sequences[this.currentSequenceIndex].currentTime();
    return playedTime + currentSequenceTime;
  }

  private updateCurrentPosition(): void {
    if (this.isPlaying()) {
      this.currentPosition = this.calculateCurrentPosition();
      this.emit('progress', {
        currentSequenceIndex: this.currentSequenceIndex,
        currentSequence: this.sequences[this.currentSequenceIndex],
        currentTime: this.currentPosition,
      });
      requestAnimationFrame(() => this.updateCurrentPosition());
    }
  }

  public isPlaying(): boolean {
    return this.sequences.some(seq => seq.isPlaying);
  }
}
