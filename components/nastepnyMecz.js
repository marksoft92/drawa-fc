'use client';

export default function NastepnyMecz({
                                       mecze = [],
                                       SectionLabel,
                                       HerbImg,
                                       isDrawa,
                                     }) {
  const next = mecze.find((m) => !m.score && !m.walkower);

  if (!next) return null;

  return (
    <section
      className="mob-py"
      style={{
        padding: '80px 20px',
        background: '#030712',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <SectionLabel>Następny Mecz</SectionLabel>

        <div
          className="next-match-inner"
          style={{
            marginTop: 32,
            background:
              'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 16,
            padding: '40px 32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 400,
              height: 200,
              background:
                'radial-gradient(ellipse, rgba(59,130,246,0.15), transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.25em',
                color: '#3b82f6',
                marginBottom: 8,
              }}
            >
              {next.liga}
            </div>

            <div
              style={{
                fontSize: 14,
                color: '#64748b',
              }}
            >
              {next.date}
            </div>
          </div>

          {/* Teams */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(16px, 4vw, 48px)',
            }}
          >
            {/* Team 1 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                minWidth: 120,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: isDrawa(next.team1)
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: isDrawa(next.team1)
                    ? '2px solid rgba(59,130,246,0.4)'
                    : '2px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDrawa(next.team1)
                    ? '0 0 24px rgba(59,130,246,0.2)'
                    : 'none',
                }}
              >
                <HerbImg
                  src={next.herb1}
                  alt={next.team1}
                  size={52}
                />
              </div>

              <div
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 18px)',
                  fontWeight: 700,
                  color: isDrawa(next.team1)
                    ? '#fff'
                    : '#94a3b8',
                  textAlign: 'center',
                  fontFamily:
                    "'Bebas Neue', Impact, sans-serif",
                  letterSpacing: '0.05em',
                }}
              >
                {next.team1}
              </div>
            </div>

            {/* VS */}
            <div
              style={{
                fontSize: 'clamp(28px, 6vw, 56px)',
                fontFamily:
                  "'Bebas Neue', Impact, sans-serif",
                color: '#1e3a5f',
                letterSpacing: '0.1em',
              }}
            >
              VS
            </div>

            {/* Team 2 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                minWidth: 120,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: isDrawa(next.team2)
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: isDrawa(next.team2)
                    ? '2px solid rgba(59,130,246,0.4)'
                    : '2px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HerbImg
                  src={next.herb2}
                  alt={next.team2}
                  size={52}
                />
              </div>

              <div
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 18px)',
                  fontWeight: 700,
                  color: isDrawa(next.team2)
                    ? '#fff'
                    : '#94a3b8',
                  textAlign: 'center',
                  fontFamily:
                    "'Bebas Neue', Impact, sans-serif",
                  letterSpacing: '0.05em',
                }}
              >
                {next.team2}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}