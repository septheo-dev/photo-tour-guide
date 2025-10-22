import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon } from './Icons';
import { decode, decodeAudioData } from '../utils/audio';


interface AudioPlayerProps {
  audioData: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef(0);
  const playbackOffsetRef = useRef(0); // <-- ADD THIS to track pause position

  const loadAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const decodedBytes = decode(audioData);
      const buffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
    } catch (error) {
      console.error("Failed to decode audio data", error);
    }
  }, [audioData]);

  useEffect(() => {
    loadAudio();
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null; // Prevent re-use of closed context
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioData]);

  const updateProgress = useCallback(() => {
    if (isPlaying && audioContextRef.current) {
      const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
      // FIX: Calculate new time based on the offset when playback started
      const newCurrentTime = playbackOffsetRef.current + elapsedTime;

      if (newCurrentTime < duration) {
        setCurrentTime(newCurrentTime);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Audio has finished playing
        setCurrentTime(duration);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, duration]);

  const play = () => {
    if (!audioContextRef.current || !audioBufferRef.current || isPlaying) return;
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    sourceRef.current = audioContextRef.current.createBufferSource();
    sourceRef.current.buffer = audioBufferRef.current;
    sourceRef.current.connect(audioContextRef.current.destination);
    
    // FIX: Store the current time as an offset for progress calculation
    playbackOffsetRef.current = currentTime;
    startTimeRef.current = audioContextRef.current.currentTime;
    sourceRef.current.start(0, currentTime); // Start from the correct offset
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    sourceRef.current.onended = () => {
      // This is called on both stop() and natural end.
      // updateProgress loop handles the state change on natural end.
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameRef.current);
    };
  };

  const pause = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
    }
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameRef.current);
  };
  
  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      // If audio finished, reset to 0 before playing
      if(currentTime >= duration) {
        setCurrentTime(0);
        // Timeout allows React to re-render with currentTime=0 before we call play,
        // which needs the correct starting offset.
        setTimeout(() => play(), 0);
      } else {
        play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600">
      <button
        onClick={togglePlayPause}
        className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-800"
        aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
      >
        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
      </button>
      <div className="flex-grow mx-4">
        <div className="relative h-2 bg-slate-600 rounded-full">
          <div
            className="absolute top-0 left-0 h-full bg-sky-400 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="text-sm text-slate-400 font-mono w-24 text-center">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default AudioPlayer;