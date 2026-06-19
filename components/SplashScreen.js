'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState('closed'); // closed → opening → fading → done

  useEffect(() => {
    // Stage 1: Show closed doors with logo for 0.8s
    const openTimer = setTimeout(() => setPhase('opening'), 800);
    // Stage 2: Doors swing open for 1s, then start fading
    const fadeTimer = setTimeout(() => setPhase('fading'), 1800);
    // Stage 3: Fully gone after 2.5s
    const doneTimer = setTimeout(() => setPhase('done'), 2500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className="splash-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.7s ease-in-out',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 30%, #047857 60%, #059669 100%)',
      }} />

      {/* Sparkle particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="splash-sparkle"
          style={{
            position: 'absolute',
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            left: `${15 + Math.random() * 70}%`,
            top: `${20 + Math.random() * 50}%`,
            animation: `splashSparkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}

      {/* Light burst behind the door gap */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: phase === 'opening' || phase === 'fading' ? '200vmax' : '4px',
        height: phase === 'opening' || phase === 'fading' ? '200vmax' : '100%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 30%, transparent 70%)',
        opacity: phase === 'opening' || phase === 'fading' ? 1 : 0.3,
        transition: 'all 1s ease-out',
        borderRadius: '50%',
        zIndex: 0,
      }} />

      {/* Door container with 3D perspective */}
      <div style={{
        position: 'absolute',
        inset: 0,
        perspective: '1200px',
        display: 'flex',
        zIndex: 1,
      }}>
        {/* LEFT DOOR */}
        <div
          className="splash-door-left"
          style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(180deg, #065f46 0%, #047857 40%, #059669 100%)',
            transformOrigin: 'left center',
            transform: phase === 'opening' || phase === 'fading' ? 'rotateY(-95deg)' : 'rotateY(0deg)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'inset -2px 0 15px rgba(0,0,0,0.3), 4px 0 20px rgba(0,0,0,0.2)',
            position: 'relative',
            willChange: 'transform',
          }}
        >
          {/* Door panel details */}
          <div style={{
            position: 'absolute',
            top: '15%',
            left: '15%',
            right: '10%',
            bottom: '15%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            right: '15%',
            height: '25%',
            border: '1.5px solid rgba(255,255,255,0.06)',
            borderRadius: '4px',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '20%',
            right: '15%',
            height: '25%',
            border: '1.5px solid rgba(255,255,255,0.06)',
            borderRadius: '4px',
          }} />
          {/* Door handle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '12%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '40px',
            background: 'linear-gradient(180deg, #fbbf24, #d97706, #b45309)',
            borderRadius: '4px',
            boxShadow: '0 0 12px rgba(251,191,36,0.4)',
          }} />
        </div>

        {/* RIGHT DOOR */}
        <div
          className="splash-door-right"
          style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(180deg, #065f46 0%, #047857 40%, #059669 100%)',
            transformOrigin: 'right center',
            transform: phase === 'opening' || phase === 'fading' ? 'rotateY(95deg)' : 'rotateY(0deg)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'inset 2px 0 15px rgba(0,0,0,0.3), -4px 0 20px rgba(0,0,0,0.2)',
            position: 'relative',
            willChange: 'transform',
          }}
        >
          {/* Door panel details */}
          <div style={{
            position: 'absolute',
            top: '15%',
            right: '15%',
            left: '10%',
            bottom: '15%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            right: '20%',
            left: '15%',
            height: '25%',
            border: '1.5px solid rgba(255,255,255,0.06)',
            borderRadius: '4px',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            left: '15%',
            height: '25%',
            border: '1.5px solid rgba(255,255,255,0.06)',
            borderRadius: '4px',
          }} />
          {/* Door handle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '12%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '40px',
            background: 'linear-gradient(180deg, #fbbf24, #d97706, #b45309)',
            borderRadius: '4px',
            boxShadow: '0 0 12px rgba(251,191,36,0.4)',
          }} />
        </div>
      </div>

      {/* Center logo + text overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        zIndex: 2,
        opacity: phase === 'opening' || phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      }}>
        {/* Logo with glow */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(16,185,129,0.4)',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'splashLogoGlow 2s ease-in-out infinite',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="7AM Gradebook"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* App name */}
        <h1 style={{
          color: 'white',
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          margin: 0,
          opacity: 0,
          animation: 'splashTextFadeIn 0.6s ease-out 0.3s forwards',
        }}>
          7AM Gradebook
        </h1>

        {/* Tagline */}
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0,
          opacity: 0,
          animation: 'splashTextFadeIn 0.6s ease-out 0.5s forwards',
        }}>
          Welcome Back, Teacher
        </p>
      </div>
    </div>
  );
}
