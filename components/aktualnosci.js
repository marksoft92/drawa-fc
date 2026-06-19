'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Placeholder = ({ style = {} }) => (
  <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <span style={{ fontSize: 36, opacity: 0.3 }}>⚽</span>
  </div>
);

const NewsCard = ({ artykul }) => (
  <Link href={`/aktualnosci/${artykul.slug}`} style={{ textDecoration: 'none' }}>
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
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9' }}>
        {artykul.thumbnail ? (
          <Image src={artykul.thumbnail} alt={artykul.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 400px" />
        ) : (
          <Placeholder style={{ height: '100%' }} />
        )}
      </div>
      <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {artykul.tags.map((tag) => (
              <span key={tag} style={{ fontSize: 9, color: artykul.kolor || '#3b82f6', background: `${artykul.kolor || '#3b82f6'}18`, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.1em', fontWeight: 700 }}>{tag.toUpperCase()}</span>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#334155' }}>{artykul.date}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35 }}>{artykul.title}</div>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, flex: 1 }}>{artykul.excerpt}</div>
        <div style={{ fontSize: 11, color: artykul.kolor || '#3b82f6', letterSpacing: '0.1em', marginTop: 4, fontWeight: 600 }}>CZYTAJ WIĘCEJ →</div>
      </div>
    </div>
  </Link>
);

const PinnedCard = ({ artykul }) => (
  <Link href={`/aktualnosci/${artykul.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 8px 40px rgba(59,130,246,0.08), 0 4px 20px rgba(0,0,0,0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(59,130,246,0.08), 0 4px 20px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', minHeight: 200 }} className="pinned-inner">
        <style>{`.pinned-inner { flex-direction: row; } @media (max-width: 640px) { .pinned-inner { flex-direction: column !important; } }`}</style>
        <div style={{ position: 'relative', width: '45%', minHeight: 200, flexShrink: 0 }} className="pinned-img">
          <style>{`@media (max-width: 640px) { .pinned-img { width: 100% !important; height: 200px !important; } }`}</style>
          {artykul.thumbnail ? (
            <Image src={artykul.thumbnail} alt={artykul.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 45vw" />
          ) : (
            <Placeholder style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #0f172a 100%)' }} className="pinned-gradient" />
          <style>{`@media (max-width: 640px) { .pinned-gradient { background: linear-gradient(to bottom, transparent 60%, #0f172a 100%) !important; } }`}</style>
        </div>

        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', padding: '3px 10px', borderRadius: 20 }}>PRZYPIĘTE</span>
            {artykul.tags.map((tag) => (
              <span key={tag} style={{ fontSize: 9, color: artykul.kolor || '#3b82f6', background: `${artykul.kolor || '#3b82f6'}18`, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.1em', fontWeight: 700 }}>{tag.toUpperCase()}</span>
            ))}
            <span style={{ fontSize: 11, color: '#334155', marginLeft: 'auto' }}>{artykul.date}</span>
          </div>

          <div style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#fff', lineHeight: 1.3, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
            {artykul.title}
          </div>

          <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
            {artykul.excerpt}
          </div>

          <div style={{ fontSize: 12, color: '#3b82f6', letterSpacing: '0.12em', fontWeight: 600, marginTop: 4 }}>
            CZYTAJ WIĘCEJ →
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${artykul.kolor || '#3b82f6'}, transparent)` }} />
    </div>
  </Link>
);

export default function Aktualnosci({ SectionLabel, showAll = false, data }) {
  const [artykuly, setArtykuly] = useState(data || []);

  useEffect(() => {
    if (data) return;
    fetch('/api/aktualnosci')
      .then(r => r.json())
      .then(d => setArtykuly(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [data]);

  const pinned = artykuly.filter(a => a.pinned);
  const regular = artykuly.filter(a => !a.pinned);
  const visible = showAll ? regular : regular.slice(0, 3);

  return (
    <section className="mob-py" style={{ padding: '80px 20px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Aktualności</SectionLabel>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
          {artykuly.length > 0 ? `${artykuly.length} aktualności` : ''}
        </div>

        {pinned.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pinned.map((a) => <PinnedCard key={a.id} artykul={a} />)}
          </div>
        )}

        {visible.length > 0 && (
          <div style={{ marginTop: pinned.length > 0 ? 20 : 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {visible.map((a) => <NewsCard key={a.id} artykul={a} />)}
          </div>
        )}

        {!showAll && regular.length > 3 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/aktualnosci"
              style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 12, letterSpacing: '0.14em', textDecoration: 'none', fontWeight: 600, transition: 'background 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
            >
              WSZYSTKIE AKTUALNOŚCI ({regular.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
