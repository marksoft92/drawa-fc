'use client';

import { useState, useEffect, useCallback } from 'react';
import albumy from '@/content/galeria/index';

// ── Placeholder gdy brak zdjęcia ─────────────────────────────

const Placeholder = ({ caption, style = {} }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      ...style,
    }}
  >
    <div style={{ fontSize: 42, opacity: 0.4 }}>⚽</div>
    {caption && (
      <div
        style={{
          fontSize: 11,
          color: '#475569',
          textAlign: 'center',
          padding: '0 12px',
          maxWidth: 200,
        }}
      >
        {caption}
      </div>
    )}
  </div>
);

// ── Miniaturka albumu ─────────────────────────────────────────

const AlbumCard = ({ album, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.2s, border-color 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
    }}
  >
    {/* Thumbnail */}
    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      {album.thumbnail ? (
        <img
          src={album.thumbnail}
          alt={album.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Placeholder caption={album.title} style={{ height: '100%' }} />
      )}
      {/* Liczba zdjęć */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          background: 'rgba(0,0,0,0.7)',
          color: '#94a3b8',
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 20,
          backdropFilter: 'blur(4px)',
        }}
      >
        {album.photos.length} zdjęć
      </div>
    </div>

    {/* Info */}
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
        {album.title}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#475569' }}>{album.date}</span>
        {album.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 9,
              color: '#3b82f6',
              background: 'rgba(59,130,246,0.1)',
              padding: '1px 6px',
              borderRadius: 4,
              letterSpacing: '0.1em',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// ── Lightbox modal ────────────────────────────────────────────

const Lightbox = ({ album, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const photos = album.photos;

  const prev = useCallback(() => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1)), [photos.length]);
  const next = useCallback(() => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1)), [photos.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const photo = photos[current];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{album.title}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {current + 1} / {photos.length}
            {photo.caption ? ` · ${photo.caption}` : ''}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%',
            color: '#fff',
            width: 40,
            height: 40,
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Główne zdjęcie */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '70vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {photo.src ? (
          <img
            src={photo.src}
            alt={photo.caption || ''}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
        ) : (
          <Placeholder
            caption={photo.caption}
            style={{ width: '100%', height: '60vh', borderRadius: 8 }}
          />
        )}
      </div>

      {/* Autor zdjęć */}
      {album.author && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          foto: {album.href_author ? (
            <a
              href={album.href_author}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              {album.author} · zobacz więcej na profilu
            </a>
          ) : (
            <span style={{ color: '#94a3b8' }}>{album.author}</span>
          )}
        </div>
      )}

      {/* Strzałki */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              color: '#fff',
              width: 48,
              height: 48,
              cursor: 'pointer',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              color: '#fff',
              width: 48,
              height: 48,
              cursor: 'pointer',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            ›
          </button>
        </>
      )}

      {/* Strip miniaturek */}
      {photos.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
            maxWidth: '90vw',
            overflowX: 'auto',
          }}
        >
          {photos.map((p, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
                border: i === current
                  ? '2px solid #3b82f6'
                  : '2px solid rgba(255,255,255,0.1)',
                transition: 'border-color 0.15s',
                opacity: i === current ? 1 : 0.6,
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
                    fontSize: 16,
                  }}
                >
                  ⚽
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Główny komponent ──────────────────────────────────────────

export default function Galeria({ SectionLabel }) {
  const [lightbox, setLightbox] = useState(null); // { albumId, photoIndex }

  const activeAlbum = lightbox
    ? albumy.find((a) => a.id === lightbox.albumId)
    : null;

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Galeria</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          Sezon 2025/26 · {albumy.length} albumów
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {albumy.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => setLightbox({ albumId: album.id, photoIndex: 0 })}
            />
          ))}
        </div>
      </div>

      {activeAlbum && (
        <Lightbox
          album={activeAlbum}
          startIndex={lightbox.photoIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
