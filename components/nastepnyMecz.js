'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseMeczDate as parseMatchDate, meczSortKeyAsc, isMeczUpcoming } from '@/lib/parseMeczDate';

function useCountdown(targetDate) {
  const [state, setState] = useState({ d: 0, h: 0, m: 0, s: 0, past: false });

  useEffect(() => {
    if (!targetDate) return;

    function tick() {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setState({ d: 0, h: 0, m: 0, s: 0, past: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setState({ d, h, m, s, past: false });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return state;
}

export default function NastepnyMecz({
                                       mecze = [],
                                       SectionLabel,
                                       HerbImg,
                                       isDrawa,
                                     }) {
  const next = useMemo(
    () => [...mecze].filter((m) => isMeczUpcoming(m))
      .sort((a, b) => meczSortKeyAsc(a.date) - meczSortKeyAsc(b.date))[0],
    [mecze]
  );

  const matchDate = useMemo(() => parseMatchDate(next?.date ?? null), [next?.date]);
  const countdown = useCountdown(matchDate);

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

          {/* Countdown */}
          {matchDate && !countdown.past && (
            <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 10,
                  color: '#3b82f6',
                  letterSpacing: '0.2em',
                  marginBottom: 8,
                }}
              >
                DO MECZU
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                }}
              >
                {[
                  { v: countdown.d, l: 'DNI' },
                  { v: countdown.h, l: 'GODZ' },
                  { v: countdown.m, l: 'MIN' },
                  { v: countdown.s, l: 'SEK' },
                ].map(({ v, l }) => (
                  <div
                    key={l}
                    style={{
                      background: '#030712',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      textAlign: 'center',
                      minWidth: 44,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        color: '#fff',
                        lineHeight: 1,
                      }}
                    >
                      {String(v).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: '#475569',
                        marginTop: 4,
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              className="nm-team"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                minWidth: 120,
              }}
            >
              <HerbImg src={next.herb1} alt={next.team1} size={isDrawa(next.team1) ? 90 : 52} />

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
              className="nm-team"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                minWidth: 120,
              }}
            >
              <HerbImg src={next.herb2} alt={next.team2} size={isDrawa(next.team2) ? 90 : 52} />

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
