'use client';

import Link from 'next/link';
import artykuly from '@/content/aktualnosci/index';

// ── Placeholder zdjęcia ───────────────────────────────────────

const Placeholder = ({ style = {} }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    <span style={{ fontSize: 36, opacity: 0.3 }}>⚽</span>
  </div>
);

// ── Karta aktualności ─────────────────────────────────────────

const NewsCard = ({ artykul }) => (
  <Link
    href={`/aktualnosci/${artykul.slug}`}
    style={{ textDecoration: 'none' }}
  >
    <div
      style={{
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `3px solid ${artykul.kolor || '#3b82f6'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
    >
      {/* Miniaturka */}
      <div style={{ position: 'relative', aspectRatio: '16/9' }}>
        {artykul.thumbnail ? (
          <img
            src={artykul.thumbnail}
            alt={artykul.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Placeholder style={{ height: '100%' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {artykul.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 9,
                  color: artykul.kolor || '#3b82f6',
                  background: `${artykul.kolor || '#3b82f6'}18`,
                  padding: '2px 7px',
                  borderRadius: 4,
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                }}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#334155' }}>{artykul.date}</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35 }}>
          {artykul.title}
        </div>

        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, flex: 1 }}>
          {artykul.excerpt}
        </div>

        <div
          style={{
            fontSize: 11,
            color: artykul.kolor || '#3b82f6',
            letterSpacing: '0.1em',
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          CZYTAJ WIĘCEJ →
        </div>
      </div>
    </div>
  </Link>
);

// ── Główny komponent ──────────────────────────────────────────

export default function Aktualnosci({ SectionLabel, showAll = false }) {
  const visible = showAll ? artykuly : artykuly.slice(0, 3);

  return (
    <section className="mob-py" style={{ padding: '80px 20px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Aktualności</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          {artykuly.length} aktualności · sezon 2025/26
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {visible.map((a) => (
            <NewsCard key={a.id} artykul={a} />
          ))}
        </div>

        {!showAll && artykuly.length > 3 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/aktualnosci"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                borderRadius: 8,
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#3b82f6',
                fontSize: 12,
                letterSpacing: '0.14em',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
            >
              WSZYSTKIE AKTUALNOŚCI ({artykuly.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
