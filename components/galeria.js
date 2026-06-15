'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const Placeholder = ({ caption, style = {} }) => (
  <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, ...style }}>
    <div style={{ fontSize: 42, opacity: 0.4 }}>⚽</div>
    {caption && <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '0 12px', maxWidth: 200 }}>{caption}</div>}
  </div>
);

const AlbumCard = ({ album, onClick }) => {
  const photos = Array.isArray(album.photos) ? album.photos : [];
  return (
    <div
      onClick={onClick}
      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
    >
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        {album.thumbnail
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={album.thumbnail} alt={album.tytul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Placeholder caption={album.tytul} style={{ height: '100%' }} />
        }
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#94a3b8', fontSize: 10, padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
          {photos.length} zdjęć
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{album.tytul}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#475569' }}>{album.date}</span>
          {(album.tags || []).map((tag) => (
            <span key={tag} style={{ fontSize: 9, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.1em' }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Lightbox = ({ album, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const photos = Array.isArray(album.photos) ? album.photos : [];
  const stripRef = useRef(null);
  const touchStartX = useRef(null);

  const prev = useCallback(() => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1)), [photos.length]);
  const next = useCallback(() => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1)), [photos.length]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, prev, next]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.children[current];
    if (!thumb) return;
    strip.scrollTo({ left: thumb.offsetLeft - strip.offsetWidth / 2 + thumb.offsetWidth / 2, behavior: 'smooth' });
  }, [current]);

  const photo = photos[current];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{album.tytul}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{current + 1} / {photos.length}{photo?.caption ? ` · ${photo.caption}` : ''}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', color: '#fff', width: 40, height: 40, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (touchStartX.current === null) return; const dx = e.changedTouches[0].clientX - touchStartX.current; touchStartX.current = null; if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); } }}
        style={{ maxWidth: '90vw', maxHeight: '70vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {photo?.src
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={photo.src} alt={photo.caption || ''} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
          : <Placeholder caption={photo?.caption} style={{ width: '100%', height: '60vh', borderRadius: 8 }} />
        }
      </div>

      {album.author && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
          foto: {album.hrefAuthor
            ? <a href={album.hrefAuthor} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{album.author} · zobacz więcej na profilu</a>
            : <span style={{ color: '#94a3b8' }}>{album.author}</span>
          }
        </div>
      )}

      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', color: '#fff', width: 48, height: 48, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', color: '#fff', width: 48, height: 48, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>›</button>
          <div ref={stripRef} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.6)', borderRadius: 12, backdropFilter: 'blur(8px)', maxWidth: '90vw', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {photos.map((p, i) => (
              <div key={i} onClick={() => setCurrent(i)} style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: i === current ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)', opacity: i === current ? 1 : 0.6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.src ? <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚽</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function Galeria({ SectionLabel }) {
  const [albumy, setAlumy] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch('/api/galeria')
      .then(r => r.json())
      .then(d => setAlumy(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const activeAlbum = lightbox ? albumy.find((a) => a.id === lightbox.albumId) : null;

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Galeria</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          {albumy.length > 0 ? `${albumy.length} albumów` : ''}
        </div>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {albumy.map((album) => (
            <AlbumCard key={album.id} album={album} onClick={() => setLightbox({ albumId: album.id, photoIndex: 0 })} />
          ))}
        </div>
      </div>
      {activeAlbum && <Lightbox album={activeAlbum} startIndex={lightbox.photoIndex} onClose={() => setLightbox(null)} />}
    </section>
  );
}
