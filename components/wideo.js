'use client';

import { useState, useEffect, useCallback } from 'react';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoModal({ film, onClose }) {
  const ytId = getYouTubeId(film.url);
  const isShort = film.typ === 'short';

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!ytId) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, cursor: 'pointer',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 20,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isShort ? 'min(360px, 90vw)' : 'min(960px, 95vw)',
          aspectRatio: isShort ? '9/16' : '16/9',
          maxHeight: '85vh',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div style={{ marginTop: 16, fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 600 }}>
        {film.tytul}
      </div>
    </div>
  );
}

function VideoCard({ film, onPlay }) {
  const ytId = getYouTubeId(film.url);
  const isShort = film.typ === 'short';

  if (!ytId) return null;

  return (
    <div
      onClick={() => onPlay(film)}
      style={{
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      className="wideo-card"
    >
      <div style={{ position: 'relative', aspectRatio: isShort ? '9/16' : '16/9', background: '#000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${ytId}/${isShort ? 'oar2' : 'maxresdefault'}.jpg`}
          alt={film.tytul}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(239,68,68,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 20,12 8,19" /></svg>
          </div>
        </div>
        {isShort && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(239,68,68,0.9)', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>
            SHORT
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.35 }}>{film.tytul}</div>
      </div>
    </div>
  );
}

export default function Wideo({ SectionLabel, data, limit, youtubeUrl }) {
  const [filmy, setFilmy] = useState(data || []);
  const [activeFilm, setActiveFilm] = useState(null);

  useEffect(() => {
    if (data) return;
    fetch('/api/wideo')
      .then(r => r.json())
      .then(d => setFilmy(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [data]);

  const shorts = filmy.filter(f => f.typ === 'short');
  const videos = filmy.filter(f => f.typ !== 'short');
  const visibleVideos = limit ? videos.slice(0, limit) : videos;
  const visibleShorts = limit ? shorts.slice(0, 3) : shorts;
  const hasMore = limit && filmy.length > (limit + 3);

  if (filmy.length === 0) return null;

  return (
    <section style={{ padding: '0 20px 80px', background: '#030712' }}>
      <style>{`.wideo-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-color: rgba(239,68,68,0.3) !important; }`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Wideo</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          {filmy.length} filmów{youtubeUrl && (
            <> · <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 600 }}>YouTube →</a></>
          )}
        </div>

        {visibleVideos.length > 0 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {visibleVideos.map(f => <VideoCard key={f.id} film={f} onPlay={setActiveFilm} />)}
          </div>
        )}

        {visibleShorts.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#475569', marginTop: 32, marginBottom: 12 }}>SHORTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {visibleShorts.map(f => <VideoCard key={f.id} film={f} onPlay={setActiveFilm} />)}
            </div>
          </>
        )}

        {hasMore && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a href="/wideo" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 12, letterSpacing: '0.14em', textDecoration: 'none', fontWeight: 600 }}>
              ZOBACZ WSZYSTKIE FILMY ({filmy.length}) →
            </a>
          </div>
        )}
      </div>

      {activeFilm && <VideoModal film={activeFilm} onClose={() => setActiveFilm(null)} />}
    </section>
  );
}
