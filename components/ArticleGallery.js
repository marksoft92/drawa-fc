'use client';

import { useState } from 'react';

export default function ArticleGallery({ photos }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      {/* Miniaturki */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', marginBottom: 12 }}>
          GALERIA ({photos.length} zdjęć)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 6,
          }}
        >
          {photos.map((p, i) => (
            <div
              key={i}
              onClick={() => { setActive(i); setLightbox(true); }}
              style={{
                aspectRatio: '1',
                borderRadius: 6,
                overflow: 'hidden',
                cursor: 'pointer',
                border: i === active ? '2px solid #3b82f6' : '2px solid transparent',
                opacity: i === active ? 1 : 0.7,
                transition: 'opacity 0.15s, border-color 0.15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Strzałka wstecz */}
          {active > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActive(active - 1); }}
              style={arrowStyle('left')}
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[active].src}
            alt={photos[active].caption || ''}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '88vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />

          {/* Strzałka wprzód */}
          {active < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActive(active + 1); }}
              style={arrowStyle('right')}
            >
              ›
            </button>
          )}

          {/* Zamknij */}
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              color: '#fff',
              width: 40,
              height: 40,
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Licznik */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            fontSize: 12,
            color: '#64748b',
            letterSpacing: '0.1em',
          }}>
            {active + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}

const arrowStyle = (side) => ({
  position: 'absolute',
  [side]: 16,
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '50%',
  color: '#fff',
  width: 48,
  height: 48,
  fontSize: 28,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
});
