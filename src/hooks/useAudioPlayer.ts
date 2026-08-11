import { useState, useRef, useCallback } from 'react';
import { apiService } from '../services/apiService';

export function useAudioPlayer() {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveMessageId(null);
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isPaused]);

  const playTTS = useCallback(
    async (messageId: string, text: string, voiceName: string = 'Kore') => {
      // If clicking same active playing message, pause/resume
      if (activeMessageId === messageId) {
        if (isPlaying) {
          pauseAudio();
          return;
        } else if (isPaused) {
          resumeAudio();
          return;
        }
      }

      // Stop previous playing audio
      stopAudio();

      setActiveMessageId(messageId);
      setIsLoadingAudio(true);

      try {
        let base64Data = audioCacheRef.current.get(messageId);
        let mimeType = 'audio/wav';

        if (!base64Data) {
          const res = await apiService.generateTTS(text, voiceName);
          base64Data = res.audio;
          mimeType = res.mimeType || 'audio/wav';
          audioCacheRef.current.set(messageId, base64Data);
        }

        const dataUrl = base64Data.startsWith('data:')
          ? base64Data
          : `data:${mimeType};base64,${base64Data}`;

        const audio = new Audio(dataUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setActiveMessageId(null);
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          stopAudio();
        };

        await audio.play();
        setIsPlaying(true);
        setIsPaused(false);
      } catch (err) {
        console.error('Failed to play TTS audio:', err);
        stopAudio();
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [activeMessageId, isPlaying, isPaused, pauseAudio, resumeAudio, stopAudio]
  );

  return {
    activeMessageId,
    isPlaying,
    isPaused,
    isLoadingAudio,
    playTTS,
    pauseAudio,
    resumeAudio,
    stopAudio,
  };
}
