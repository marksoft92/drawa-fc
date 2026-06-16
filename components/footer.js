'use client';
import { useState, useEffect } from 'react';

const kolumny = [
  {
    tytul: 'Klub',
    linki: [
      { label: 'Aktualności', href: '#aktualnosci' },
      { label: 'Kadra', href: '#kadra' },
      { label: 'Galeria', href: '#galeria' },
      { label: 'Sponsorzy', href: '#sponsorzy' },
    ],
  },
  {
    tytul: 'Rozgrywki',
    linki: [
      { label: 'Mecze', href: '#mecze' },
      { label: 'Tabela', href: '#tabela' },
      { label: 'Statystyki', href: '#statystyki' },
    ],
  },
  {
    tytul: 'Kontakt',
    linki: [
      { label: 'ul. Choszczeńska 85a, Drawno', href: '#kontakt' },
      { label: 'kontakt@mksdrawadrawno.pl', href: 'mailto:kontakt@mksdrawadrawno.pl' },
      { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100031740656452' },
      { label: 'Instagram', href: 'https://www.instagram.com/mksdrawadrawno/' },
    ],
  },
];

export default function Footer({ HerbImg, herb }) {
  const [sezon, setSezon] = useState('2025/26');
  const [klasa, setKlasa] = useState('A klasa');

  useEffect(() => {
    fetch('/api/ustawienia')
      .then(r => r.json())
      .then(d => {
        if (d.aktywny_sezon) setSezon(d.aktywny_sezon);
        if (d.aktywny_klasa) setKlasa(d.aktywny_klasa);
      })
      .catch(() => {});
  }, []);

  return (
    <footer
      className="footer-top"
      style={{
        background: '#030712',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 64,
        paddingBottom: 0,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Brand hero strip ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            paddingBottom: 48,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}
        >
          <HerbImg src={herb} alt="MKS Drawa Drawno" size={220} />

          {/* Nazwa */}
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: 32,
                letterSpacing: '0.14em',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              MKS Drawa Drawno
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#3b82f6',
                letterSpacing: '0.3em',
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {klasa.toUpperCase()} · SEZON {sezon}
            </div>
          </div>

          {/* Opis */}
          <p
            style={{
              fontSize: 13,
              color: '#475569',
              lineHeight: 1.7,
              maxWidth: 360,
            }}
          >
            Oficjalny klub piłkarski miasta Drawno. Gramy z pasją od pokoleń —
            dla kibiców, dla społeczności, dla Drawna.
          </p>

          {/* Socials */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { href: 'https://www.facebook.com/profile.php?id=100031740656452', label: 'Facebook' },
              { href: 'https://www.instagram.com/mksdrawadrawno/', label: 'Instagram' },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                {label.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        {/* ── Kolumny linków ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 40,
            padding: '40px 0 48px',
          }}
        >
          {kolumny.map((kol) => (
            <div key={kol.tytul} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  color: '#3b82f6',
                  letterSpacing: '0.25em',
                  fontWeight: 700,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {kol.tytul}
              </div>
              {kol.linki.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{
                    fontSize: 13,
                    color: '#475569',
                    textDecoration: 'none',
                    lineHeight: 1.5,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '20px 0 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 11, color: '#475569' }}>
              © {new Date().getFullYear()} MKS Drawa Drawno · Wszelkie prawa zastrzeżone
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e88' }} />
              <div style={{ fontSize: 11, color: '#334155' }}>
                Sezon {sezon} · {klasa} · Zachodniopomorskie
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#1e293b', letterSpacing: '0.02em' }}>
            Projekt graficzny, kod źródłowy i treści strony{' '}
            <span style={{ color: '#334155' }}>mksdrawadrawno.pl</span>{' '}
            są chronione prawem autorskim. Kopiowanie, reprodukowanie lub rozpowszechnianie
            bez zgody właściciela jest zabronione.
          </div>
        </div>

      </div>
    </footer>
  );
}