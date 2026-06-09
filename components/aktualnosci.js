'use client';

import { useState, useEffect } from 'react';
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

// ── Modal artykułu ────────────────────────────────────────────

const ArticleModal = ({ artykul, onClose }) => {
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const paragraphs = artykul.content.split('\n\n').filter(Boolean);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '40px 16px 60px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          maxWidth: 900,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Główne zdjęcie */}
        {(() => {
          const hasRealPhotos = artykul.photos.length > 1 || (artykul.photos[0]?.src && !artykul.photos[0].src.includes('logo.png'));
          return (
        <div style={{ position: 'relative', background: '#000' }}>
          {artykul.photos[activePhoto]?.src ? (
            <img
              src={artykul.photos[activePhoto].src}
              alt={artykul.photos[activePhoto].caption || ''}
              style={{
                display: 'block',
                width: '100%',
                maxHeight: hasRealPhotos ? 'min(75vh, 680px)' : '200px',
                objectFit: hasRealPhotos ? 'contain' : 'contain',
                background: hasRealPhotos ? '#000' : '#0f172a',
              }}
            />
          ) : (
            <Placeholder style={{ height: 220 }} />
          )}

          {/* Zamknij */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              color: '#fff',
              width: 36,
              height: 36,
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
          );
        })()}

        {/* Miniaturki zdjęć */}
        {artykul.photos.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 20px',
              background: '#0a0f1e',
              overflowX: 'auto',
            }}
          >
            {artykul.photos.map((p, i) => (
              <div
                key={i}
                onClick={() => setActivePhoto(i)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 6,
                  overflow: 'hidden',
                  flexShrink: 0,
                  cursor: 'pointer',
                  border: i === activePhoto
                    ? '2px solid #3b82f6'
                    : '2px solid rgba(255,255,255,0.08)',
                  opacity: i === activePhoto ? 1 : 0.55,
                  transition: 'opacity 0.15s, border-color 0.15s',
                }}
              >
                {p.src ? (
                  <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    ⚽
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Treść */}
        <div style={{ padding: '24px 28px 32px' }}>
          {/* Tagi i data */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            {artykul.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 9,
                  color: artykul.kolor || '#3b82f6',
                  background: `${artykul.kolor || '#3b82f6'}18`,
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                }}
              >
                {tag.toUpperCase()}
              </span>
            ))}
            <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{artykul.date}</span>
          </div>

          {/* Tytuł */}
          <h2
            style={{
              fontSize: 'clamp(18px, 3vw, 24px)',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              letterSpacing: '0.06em',
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {artykul.title}
          </h2>

          {/* Akapity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.75, margin: 0 }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Karta aktualności ─────────────────────────────────────────

const NewsCard = ({ artykul, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: `3px solid ${artykul.kolor || '#3b82f6'}`,
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
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
);

// ── Główny komponent ──────────────────────────────────────────

export default function Aktualnosci({ SectionLabel, showAll = false }) {
  const [modalArtykul, setModalArtykul] = useState(null);

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
            <NewsCard key={a.id} artykul={a} onClick={() => setModalArtykul(a)} />
          ))}
        </div>

        {!showAll && artykuly.length > 3 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a
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
            </a>
          </div>
        )}
      </div>

      {modalArtykul && (
        <ArticleModal artykul={modalArtykul} onClose={() => setModalArtykul(null)} />
      )}
    </section>
  );
}
