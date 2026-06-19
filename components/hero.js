'use client';

import Image from 'next/image';
import Link from 'next/link';
import DRAWA_HERB from '@/public/drawa-herb_awans.png';

export default function Hero({ tabela, allTimeStats, ustawienia }) {
  const stats = [
    { label: 'PKTÓW',   value: tabela?.punkty  || 0 },
    { label: 'MECZÓW',  value: tabela?.mecze   || 0 },
    { label: 'GOLI',    value: tabela?.gole    || 0 },
    { label: 'POZYCJA', value: `#${tabela?.pozycja || '-'}` },
  ];

  const allTime = allTimeStats ? [
    { label: 'ROK ZAŁOŻENIA', value: 1947 },
    { label: 'MECZÓW', value: allTimeStats.mecze || 0 },
    { label: 'GOLI', value: allTimeStats.gole || 0 },
    { label: 'ZWYCIĘSTW', value: allTimeStats.wygrane || 0 },
  ] : null;

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
        alt="MKS Drawa Drawno"
        fill
        priority
        style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.18, filter: 'saturate(1.3)' }}
      />

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(3,7,18,0.5) 0%, rgba(3,7,18,0.75) 60%, #030712 100%)' }} />

      <div style={{ position: 'relative', textAlign: 'center', padding: '0 20px', zIndex: 2 }}>
        <h1 style={{ margin: 0 }}>
          <span style={{ display: 'block', fontSize: 'clamp(48px, 10vw, 96px)', fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.08em', lineHeight: 1, color: '#fff', textShadow: '0 0 60px rgba(59,130,246,0.5)' }}>
            MKS DRAWA
          </span>
          <span style={{ display: 'block', fontSize: 'clamp(28px, 5vw, 52px)', fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.25em', color: '#3b82f6', marginTop: 4, textShadow: '0 0 30px rgba(59,130,246,0.6)' }}>
            DRAWNO
          </span>
        </h1>

        <div className="hero-subtitle" style={{ marginTop: 16, fontSize: 13, letterSpacing: '0.3em', color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase' }}>
          {ustawienia?.aktywny_klasa || 'A klasa'} · Zachodniopomorskie · Sezon {ustawienia?.aktywny_sezon || '2025/26'}
        </div>

        <div className="hero-stats" style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontFamily: "'Bebas Neue', Impact, sans-serif", color: '#3b82f6', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.2em', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {allTime && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#334155', marginBottom: 16, textTransform: 'uppercase' }}>
              Gramy z pasją od 1947 roku
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {allTime.map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontFamily: "'Bebas Neue', Impact, sans-serif", color: '#1e3a5f', lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 8, color: '#334155', letterSpacing: '0.2em', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <Link
              href="/archiwum"
              style={{ display: 'inline-block', marginTop: 16, fontSize: 10, color: '#475569', letterSpacing: '0.15em', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              PEŁNE ARCHIWUM →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
