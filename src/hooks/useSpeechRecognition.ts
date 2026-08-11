import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const hasSupport = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!hasSupport) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      // Ignore 'no-speech' or benign errors gracefully
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
        setError(`Voice input error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [hasSupport]);

  const startListening = useCallback(() => {
    if (!hasSupport) {
      setError('Browser does not support voice speech recognition');
      return;
    }
    setError(null);
    setTranscript('');
    try {
      if (recognitionRef.current) {
        // Try stopping any active session first before starting
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (e: any) {
      console.warn('Speech recognition start note:', e.message || e);
      setIsListening(true);
    }
  }, [hasSupport]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    hasSupport,
    startListening,
    stopListening,
    resetTranscript,
  };
}
