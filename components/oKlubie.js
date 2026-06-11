'use client';

export default function OKlubie({ SectionLabel }) {
  return (
    <section
      className="mob-pb"
      style={{
        padding: '0 20px 80px',
        background: '#030712',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>O Klubie</SectionLabel>

        {/* Identity paragraph */}
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            lineHeight: 1.8,
            marginTop: 24,
            maxWidth: 600,
          }}
        >
          MKS Drawa Drawno to klub piłkarski z serca Puszczy Drawskiej. Reprezentujemy miasto Drawno z dumą — na boisku i poza nim. Gramy dla naszych kibiców, dla społeczności, dla regionu.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 32,
          }}
        >
          {[
            { value: '2025/26', label: 'SEZON' },
            { value: '#1', label: 'MIEJSCE W LIDZE' },
            { value: '85', label: 'BRAMEK STRZELONYCH' },
            { value: '32', label: 'ZAWODNIKÓW W KADRZE' },
          ].map(({ value, label }) => (
            <div
              key={label}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  color: '#3b82f6',
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: '#475569',
                  letterSpacing: '0.15em',
                  marginTop: 6,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* History block */}
        <div
          style={{
            marginTop: 40,
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle blue radial glow */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              fontSize: 'clamp(22px, 4vw, 30px)',
              color: '#fff',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            Nasz Klub
          </div>

          <p
            style={{
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.8,
              marginBottom: 12,
            }}
          >
            Klub działa w Drawnie — malowniczym mieście na skraju Drawieńskiego Parku Narodowego w województwie zachodniopomorskim. Rozgrywamy mecze przy ulicy Choszczeńskiej 85a, na obiekcie dobrze znanych kibicom z całego regionu.
          </p>

          <p
            style={{
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.8,
              marginBottom: 12,
            }}
          >
            Sezon 2025/26 to jeden z najlepszych w naszej historii. Drawa pewnie kroczy ku mistrzostwu Klasy B Zachodniopomorskiej IV — 52 punkty, 85 strzelonych bramek i zaledwie 1 porażka na 21 meczach to wyniki, które mówią same za siebie.
          </p>

          {/* Badges row */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {['Klasa B Zachodniopomorska IV', 'Drawieński Park Narodowy', 'Sezon 2025/26'].map((badge) => (
              <span
                key={badge}
                style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 20,
                  padding: '6px 16px',
                  fontSize: 11,
                  color: '#3b82f6',
                  letterSpacing: '0.08em',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
