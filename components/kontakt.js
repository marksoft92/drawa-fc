'use client';

const MAPS_LINK =
  'https://rozgrywki.zzpn.pl/league/17/table';
const FB_LINK =
  'https://www.facebook.com/profile.php?id=100031740656452';

const IconPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const items = [
  {
    Icon: IconPin,
    label: 'ADRES STADIONU',
    main: 'ul. Choszczeńska 85a',
    sub: '73-220 Drawno',
    cta: 'OTWÓRZ W MAPACH →',
    href: MAPS_LINK,
  },
  {
    Icon: IconFacebook,
    label: 'FACEBOOK',
    main: 'MKS Drawa Drawno',
    sub: 'Obserwuj klub',
    cta: 'PRZEJDŹ DO PROFILU →',
    href: FB_LINK,
  },
  {
    Icon: IconShield,
    label: 'LIGA',
    main: 'Klasa B',
    sub: 'Zachodniopomorskie · Sezon 2025/26',
    cta: 'Rozgrywki ZZPN →',
    href: MAPS_LINK,
  },
];

export default function Kontakt({ SectionLabel }) {
  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Kontakt</SectionLabel>

        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {items.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '24px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                e.currentTarget.style.background = '#0f1f3d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = '#0f172a';
              }}
            >
              {/* Ikona */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <item.Icon />
              </div>

              {/* Treść */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: '#475569',
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontFamily: "'Bebas Neue', Impact, sans-serif",
                    letterSpacing: '0.06em',
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  {item.main}
                </div>
                {item.sub && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {item.sub}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div
                style={{
                  fontSize: 10,
                  color: '#3b82f6',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: 12,
                }}
              >
                {item.cta}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
