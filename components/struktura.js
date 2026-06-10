'use client';

const zarzad = [
  {
    rola: 'Prezes',
    imie: 'Jakub Zygała',
    telefon: '691 901 479',
    email: 'jakub.zygala05@o2.pl',
  },
  {
    rola: 'Wiceprezes',
    imie: 'Ewelina Krykwińska',
    telefon: '696 541 071',
    email: null,
  },
  {
    rola: 'Sekretarz',
    imie: 'Szymon Filipowicz',
    telefon: null,
    email: null,
  },
  {
    rola: 'Skarbnik',
    imie: 'Adrian Michalski',
    telefon: null,
    email: null,
  },
];

const CLUB_EMAIL = 'drawa.drawno@zzpn.pl';

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.01a16 16 0 0 0 6.08 6.08l1.19-.94a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const RolaBadge = ({ rola }) => {
  const colors = {
    Prezes: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', text: '#60a5fa' },
    Wiceprezes: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc' },
    Sekretarz: { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)', text: '#5eead4' },
    Skarbnik: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', text: '#fde047' },
  };
  const c = colors[rola] ?? colors.Sekretarz;
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.18em',
      padding: '3px 10px',
      borderRadius: 20,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
    }}>
      {rola.toUpperCase()}
    </span>
  );
};

export default function Struktura({ SectionLabel }) {
  return (
    <section style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Struktura Klubu</SectionLabel>

        {/* Oficjalny e-mail klubowy */}
        <a
          href={`mailto:${CLUB_EMAIL}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 20,
            marginBottom: 32,
            padding: '10px 18px',
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 10,
            textDecoration: 'none',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.14)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.07)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
          }}
        >
          <span style={{ color: '#3b82f6' }}><IconMail /></span>
          <div>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 2 }}>
              OFICJALNY EMAIL KLUBU
            </div>
            <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>{CLUB_EMAIL}</div>
          </div>
        </a>

        {/* Karty zarządu */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {zarzad.map((os, i) => (
            <div
              key={i}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Inicjały avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                letterSpacing: '0.05em',
                color: '#60a5fa',
                flexShrink: 0,
              }}>
                {os.imie.split(' ').map(s => s[0]).join('')}
              </div>

              <div style={{ flex: 1 }}>
                <RolaBadge rola={os.rola} />
                <div style={{
                  marginTop: 8,
                  fontSize: 16,
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  letterSpacing: '0.06em',
                  color: '#fff',
                  lineHeight: 1.2,
                }}>
                  {os.imie}
                </div>
              </div>

              {/* Kontakt */}
              {(os.telefon || os.email) && (
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  {os.telefon && (
                    <a
                      href={`tel:${os.telefon.replace(/\s/g, '')}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#64748b',
                        textDecoration: 'none',
                        fontSize: 12,
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                      <IconPhone />
                      {os.telefon}
                    </a>
                  )}
                  {os.email && (
                    <a
                      href={`mailto:${os.email}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#64748b',
                        textDecoration: 'none',
                        fontSize: 12,
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                      <IconMail />
                      {os.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
