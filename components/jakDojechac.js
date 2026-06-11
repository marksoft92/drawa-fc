'use client';

export default function JakDojechac({ SectionLabel }) {
  const NAV_URL = 'https://www.google.com/maps/dir/?api=1&destination=Choszcze%C5%84ska+85a,+73-220+Drawno';
  const EMBED_URL = 'https://maps.google.com/maps?q=Choszcze%C5%84ska+85a,+73-220+Drawno&output=embed&z=15';

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Jak Dojechać</SectionLabel>

        <div style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}>
          {/* Map — same height as card */}
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            minHeight: 300,
          }}>
            <iframe
              src={EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', height: '100%', minHeight: 300, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.8)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info card */}
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '28px 24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: '#fff', letterSpacing: '0.08em', marginBottom: 20 }}>
              Stadion MKS Drawa
            </div>

            {[
              { label: 'ADRES', value: 'ul. Choszczeńska 85a', sub: '73-220 Drawno' },
              { label: 'OBIEKT', value: 'Stadion Miejski', sub: 'Drawno, Zachodniopomorskie' },
              { label: 'DOJAZD', value: 'A18 → DK10 → Drawno', sub: 'ok. 1h ze Szczecina' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{value}</div>
                {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
              </div>
            ))}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 'auto' }}>
              <a
                href={NAV_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '12px 20px',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                }}
              >
                NAWIGUJ DO STADIONU
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
