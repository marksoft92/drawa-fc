'use client';

import { useState } from 'react';

export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const twUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    }
  }

  const btn = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    letterSpacing: '0.06em', textDecoration: 'none', cursor: 'pointer',
    border: 'none', transition: 'opacity 0.2s',
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.12em', marginRight: 4 }}>UDOSTĘPNIJ</span>

      <a href={fbUrl} target="_blank" rel="noopener noreferrer"
        style={{ ...btn, background: 'rgba(24,119,242,0.12)', color: '#1877f2' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </a>

      <a href={twUrl} target="_blank" rel="noopener noreferrer"
        style={{ ...btn, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X
      </a>

      <button onClick={copyLink}
        style={{ ...btn, background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', color: copied ? '#22c55e' : '#94a3b8' }}>
        {copied ? '✓ Skopiowano' : 'Kopiuj link'}
      </button>

      {typeof navigator !== 'undefined' && navigator.share && (
        <button onClick={nativeShare}
          style={{ ...btn, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
          Więcej...
        </button>
      )}
    </div>
  );
}
