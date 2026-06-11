'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState('visible'); // visible → fading → gone

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), 1600);
    const t2 = setTimeout(() => setPhase('gone'), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <>
      <style>{`
        @keyframes splash-pulse {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 24px rgba(59,130,246,0.7)); }
          50% { opacity: 0.85; transform: scale(0.96); filter: drop-shadow(0 0 48px rgba(59,130,246,0.9)); }
        }
        @keyframes splash-bar {
          0% { width: 0%; }
          60% { width: 75%; }
          100% { width: 100%; }
        }
        @keyframes splash-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#030712',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}>
        {/* Herb */}
        <img
          src="/logo.png"
          alt="MKS Drawa"
          width={120}
          height={120}
          style={{
            objectFit: 'contain',
            animation: 'splash-pulse 2s ease-in-out infinite',
          }}
        />

        {/* Name */}
        <div style={{
          marginTop: 24,
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: 32,
          letterSpacing: '0.18em',
          color: '#fff',
          animation: 'splash-fadein 0.6s ease 0.3s both',
        }}>
          MKS DRAWA
        </div>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.35em',
          color: '#3b82f6',
          marginTop: 4,
          animation: 'splash-fadein 0.6s ease 0.5s both',
        }}>
          DRAWNO
        </div>

        {/* Loading bar */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          width: 160,
          height: 2,
          background: 'rgba(59,130,246,0.15)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
            borderRadius: 2,
            animation: 'splash-bar 1.5s ease forwards',
          }} />
        </div>
      </div>
    </>
  );
}
