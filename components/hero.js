'use client';

import Image from 'next/image';

import DRAWA_HERB from '@/public/drawa-herb.png';

export default function Hero({ tabela }) {
  const stats = [
    { label: 'PKTÓW',   value: tabela?.punkty  || 0 },
    { label: 'MECZÓW',  value: tabela?.mecze   || 0 },
    { label: 'GOLI',    value: tabela?.gole    || 0 },
    { label: 'POZYCJA', value: `#${tabela?.pozycja || '-'}` },
  ];

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#030712',
      }}
    >
      <Image
        src={DRAWA_HERB}
        alt=""
        fill
        priority
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.18,
          filter: 'saturate(1.3)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(3,7,18,0.5) 0%, rgba(3,7,18,0.75) 60%, #030712 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: '0 20px',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            letterSpacing: '0.08em',
            lineHeight: 1,
            color: '#fff',
            textShadow: '0 0 60px rgba(59,130,246,0.5)',
          }}
        >
          MKS DRAWA
        </div>

        <div
          style={{
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            letterSpacing: '0.25em',
            color: '#3b82f6',
            marginTop: 4,
            textShadow: '0 0 30px rgba(59,130,246,0.6)',
          }}
        >
          DRAWNO
        </div>

        <div
          className="hero-subtitle"
          style={{
            marginTop: 16,
            fontSize: 13,
            letterSpacing: '0.3em',
            color: '#64748b',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}
        >
          Klasa B · Zachodniopomorskie · Sezon 2025/26
        </div>

        <div
          className="hero-stats"
          style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            marginTop: 48,
            flexWrap: 'wrap',
          }}
        >
          {stats.map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 'clamp(32px, 6vw, 48px)',
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  color: '#3b82f6',
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#475569',
                  letterSpacing: '0.2em',
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
