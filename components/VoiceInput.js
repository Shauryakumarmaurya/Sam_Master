'use client';

import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { useEffect } from 'react';

export default function VoiceInput({ onResult }) {
  const {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onResult(transcript);
    }
  }, [transcript, onResult]);

  if (!isSupported) {
    return (
      <button
        disabled
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
        title="Voice input not supported in this browser"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        id="btn-voice-input"
        onClick={isListening ? stopListening : startListening}
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-all ${
          isListening
            ? 'border-red-300 bg-red-50 text-red-600'
            : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-foreground)]'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {/* Pulsating ring when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-md border-2 border-red-400 animate-ping opacity-40" />
        )}

        <svg
          className="relative h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
          />
        </svg>
      </button>

      {isListening && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-red-500">
          Listening…
        </span>
      )}

      {error && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-red-500">
          Error: {error}
        </span>
      )}
    </div>
  );
}
