'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState('closed'); // closed → opening → fading → done

  useEffect(() => {
    // Stage 1: Closed for 1.5s
    const openTimer = setTimeout(() => setPhase('opening'), 1500);
    // Stage 2: Door opens, light pours out for 2s
    const fadeTimer = setTimeout(() => setPhase('fading'), 3500);
    // Stage 3: Fade out the whole screen
    const doneTimer = setTimeout(() => setPhase('done'), 4500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  const isOpening = phase === 'opening' || phase === 'fading';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#050505', // Very dark background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 1s ease-in-out',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Subtle vertical center line */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: '1px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0) 100%)',
        transform: 'translateX(-50%)',
        zIndex: 0,
      }} />

      {/* The Glow behind the door */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '140px',
        height: '200px',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(22, 163, 74, 0.4)', // Green glow
        filter: isOpening ? 'blur(50px)' : 'blur(25px)',
        opacity: isOpening ? 1 : 0.5,
        transition: 'all 2s ease-out',
        zIndex: 0,
      }} />

      {/* The Door Icon Container */}
      <div style={{
        position: 'relative',
        width: '76px',
        height: '120px',
        marginBottom: '32px',
        perspective: '600px',
        zIndex: 1,
      }}>
        {/* Door Frame */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '6px',
          background: '#111',
          boxShadow: '0 0 20px rgba(22, 163, 74, 0.2)',
        }} />
        
        {/* Glowing interior (revealed when door opens) */}
        <div style={{
          position: 'absolute',
          inset: '3px',
          background: 'linear-gradient(to right, #4ade80, #dcfce7)', // Green light
          borderRadius: '3px',
          opacity: isOpening ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          boxShadow: isOpening ? '0 0 40px #4ade80' : 'none',
        }} />

        {/* The Door Panel */}
        <div style={{
          position: 'absolute',
          top: '3px',
          bottom: '3px',
          left: '3px',
          right: '3px',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '3px',
          transformOrigin: 'left center',
          transform: isOpening ? 'rotateY(-105deg)' : 'rotateY(0deg)',
          transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '6px',
        }}>
          {/* Door Handle */}
          <div style={{
            width: '3px',
            height: '14px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '1.5px',
          }} />
        </div>
      </div>

      {/* Main Text */}
      <h1 style={{
        color: '#e5e5e5',
        fontSize: '22px',
        fontWeight: 500,
        letterSpacing: '-0.5px',
        margin: '0 0 8px 0',
        zIndex: 1,
      }}>
        7am gradebook
      </h1>

      {/* Subtext */}
      <p style={{
        color: 'rgba(255,255,255,0.2)',
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '3px',
        textTransform: 'uppercase',
        margin: 0,
        zIndex: 1,
      }}>
        enter the classroom
      </p>
    </div>
  );
}
