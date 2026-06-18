'use client';

import { useState } from 'react';
import Komentarze from '@/components/Komentarze';

const MONTHS = {
  'sty': 1, 'styczeń': 1, 'lut': 2, 'luty': 2,
  'mar': 3, 'marzec': 3, 'kwi': 4, 'kwiecień': 4,
  'maj': 5, 'cze': 6, 'czerwiec': 6, 'lip': 7, 'lipiec': 7,
  'sie': 8, 'sierpień': 8, 'wrz': 9, 'wrzesień': 9,
  'paź': 10, 'październik': 10, 'lis': 11, 'listopad': 11,
  'gru': 12, 'grudzień': 12,
};

function parseDate(str) {
  if (!str) return 0;
  const full = str.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (full) {
    const m = MONTHS[full[2].toLowerCase()];
    if (m) return parseInt(full[3]) * 10000 + m * 100 + parseInt(full[1]);
  }
  const short = str.match(/^(\d{1,2})\s+(\S+)\s/);
  if (short) {
    const m = MONTHS[short[2].toLowerCase()];
    if (m) return 2026 * 10000 + m * 100 + parseInt(short[1]);
  }
  return 0;
}

export default function OstatniMecz({
                                      mecze = [],
                                      SectionLabel,
                                      HerbImg,
                                      isDrawa,
                                    }) {
  const [open, setOpen] = useState(false);

  const last = [...mecze]
    .filter((m) => m.score)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];

  if (!last) return null;

  const isHome = isDrawa(last.team1);

  const [s1, s2] = (last.score || '0:0')
    .split(':')
    .map(Number);

  const drawaScore = isHome ? s1 : s2;
  const oppScore = isHome ? s2 : s1;

  const result =
    drawaScore > oppScore
      ? 'W'
      : drawaScore < oppScore
        ? 'L'
        : 'D';

  const resultColor =
    result === 'W'
      ? '#22c55e'
      : result === 'L'
        ? '#ef4444'
        : '#f59e0b';

  const resultLabel =
    result === 'W'
      ? 'WYGRANA'
      : result === 'L'
        ? 'PORAŻKA'
        : 'REMIS';

  const drawaGoals = (last.strzelcy || []).filter(
    (s) =>
      (isHome && s.strona === 'gospodarze') ||
      (!isHome && s.strona === 'goscie')
  );

  return (
    <section
      className="mob-pb"
      style={{
        padding: '0 20px 80px',
        background: '#030712',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <SectionLabel>Ostatni Mecz</SectionLabel>

        <div
          style={{
            marginTop: 32,
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: `4px solid ${resultColor}`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom:
                '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#475569',
                  letterSpacing: '0.2em',
                }}
              >
                {last.liga}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#94a3b8',
                  marginTop: 2,
                }}
              >
                {last.date}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {last.walkower && (
                <span style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(100,116,139,0.15)',
                  border: '1px solid rgba(100,116,139,0.3)',
                  color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
                }}>
                  WALKOWER
                </span>
              )}
              {!last.walkower && last.status === 'odbyty_brak_relacji' && (
                <span style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(100,116,139,0.1)',
                  border: '1px solid rgba(100,116,139,0.2)',
                  color: '#475569', fontSize: 11, letterSpacing: '0.12em',
                }}>
                  BRAK RELACJI
                </span>
              )}
              <span style={{
                padding: '4px 12px', borderRadius: 20,
                background: `${resultColor}20`,
                border: `1px solid ${resultColor}40`,
                color: resultColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
              }}>
                {resultLabel}
              </span>
            </div>
          </div>

          {/* Score */}
          <div
            className="score-body"
            style={{
              padding: '32px 24px',
            }}
          >
            <div
              className="score-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(12px, 3vw, 32px)',
                flexWrap: 'wrap',
              }}
            >
              {/* Team 1 */}
              <div
                className="score-team-1"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 120,
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    fontSize:
                      'clamp(13px, 2vw, 16px)',
                    fontWeight: isDrawa(last.team1)
                      ? 700
                      : 400,
                    color: isDrawa(last.team1)
                      ? '#fff'
                      : '#64748b',
                    textAlign: 'right',
                  }}
                >
                  {last.team1}
                </div>

                <HerbImg
                  src={last.herb1}
                  alt={last.team1}
                  size={36}
                />
              </div>

              {/* Score */}
              <div
                style={{
                  display: 'flex',
                  gap: 'clamp(8px, 2vw, 20px)',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize:
                      'clamp(36px, 8vw, 64px)',
                    fontFamily:
                      "'Bebas Neue', Impact, sans-serif",
                    color: isDrawa(last.team1)
                      ? resultColor
                      : '#64748b',
                    lineHeight: 1,
                  }}
                >
                  {s1}
                </div>

                <div
                  style={{
                    color: '#334155',
                    fontSize: 32,
                  }}
                >
                  :
                </div>

                <div
                  style={{
                    fontSize:
                      'clamp(36px, 8vw, 64px)',
                    fontFamily:
                      "'Bebas Neue', Impact, sans-serif",
                    color: isDrawa(last.team2)
                      ? resultColor
                      : '#64748b',
                    lineHeight: 1,
                  }}
                >
                  {s2}
                </div>
              </div>

              {/* Team 2 */}
              <div
                className="score-team-2"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 120,
                }}
              >
                <HerbImg
                  src={last.herb2}
                  alt={last.team2}
                  size={36}
                />

                <div
                  style={{
                    fontSize:
                      'clamp(13px, 2vw, 16px)',
                    fontWeight: isDrawa(last.team2)
                      ? 700
                      : 400,
                    color: isDrawa(last.team2)
                      ? '#fff'
                      : '#64748b',
                  }}
                >
                  {last.team2}
                </div>
              </div>
            </div>

            {/* Goals */}
            {drawaGoals.length > 0 && (
              <div
                style={{
                  marginTop: 20,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: '#475569',
                    letterSpacing: '0.15em',
                    marginBottom: 6,
                  }}
                >
                  STRZELCY DRAWY
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#94a3b8',
                  }}
                >
                  {drawaGoals
                    .map(
                      (g) =>
                        `${g.zawodnik} (${g.minuta}')`
                    )
                    .join('  ·  ')}
                </div>
              </div>
            )}

            {/* Toggle */}
            {last.strzelcy?.length > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 20,
                }}
              >
                <button
                  onClick={() => setOpen(!open)}
                  style={{
                    background: 'none',
                    border:
                      '1px solid rgba(59,130,246,0.3)',
                    color: '#3b82f6',
                    padding: '8px 20px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    fontSize: 12,
                    letterSpacing: '0.1em',
                  }}
                >
                  {open
                    ? 'ZWIŃ'
                    : 'PEŁNA RELACJA →'}
                </button>
              </div>
            )}
          </div>

          {/* Events */}
          {open && last.wszystkieZdarzenia && (
            <div
              style={{
                padding: '0 24px 24px',
              }}
            >
              <div
                style={{
                  borderTop:
                    '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 20,
                }}
              >
                {last.wszystkieZdarzenia.map((z, i) => {
                  const isLeft =
                    z.strona === 'gospodarze';

                  const color =
                    z.typ === 'gol'
                      ? '#22c55e'
                      : z.typ ===
                      'żółta kartka'
                        ? '#f59e0b'
                        : z.typ ===
                        'czerwona kartka'
                          ? '#ef4444'
                          : '#3b82f6';

                  const icon =
                    z.typ === 'gol'
                      ? '⚽'
                      : z.typ ===
                      'żółta kartka'
                        ? '🟨'
                        : z.typ ===
                        'czerwona kartka'
                          ? '🟥'
                          : '↔';

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 8,
                        padding: '6px 0',
                        justifyContent:
                          isLeft
                            ? 'flex-start'
                            : 'flex-end',
                      }}
                    >
                      {isLeft && (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#475569',
                            minWidth: 28,
                          }}
                        >
													{z.minuta}'
												</span>
                      )}

                      <span
                        style={{
                          fontSize: 14,
                        }}
                      >
												{icon}
											</span>

                      <span
                        style={{
                          fontSize: 13,
                          color,
                        }}
                      >
												{z.zawodnik}
											</span>

                      {!isLeft && (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#475569',
                            minWidth: 28,
                            textAlign:
                              'right',
                          }}
                        >
													{z.minuta}'
												</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {last.id && (
            <div style={{ padding: '0 20px 16px' }}>
              <Komentarze typ="mecz" targetId={last.id} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}