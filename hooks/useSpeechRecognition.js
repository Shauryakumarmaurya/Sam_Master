'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook wrapping the browser's Web Speech API (SpeechRecognition).
 *
 * Returns:
 *  - transcript: the last recognized speech text
 *  - isListening: whether the mic is currently active
 *  - isSupported: whether the browser supports SpeechRecognition
 *  - startListening: function to start recognition
 *  - stopListening: function to stop recognition
 *  - error: any error message
 */
export default function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechRecognition] Error:', event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      // Already started — ignore
      console.warn('[SpeechRecognition] Start error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      // Already stopped — ignore
    }
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  };
}
