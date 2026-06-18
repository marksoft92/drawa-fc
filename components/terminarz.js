'use client';

import { useState } from 'react';
import Komentarze from '@/components/Komentarze';

const SHOW_INITIALLY = 5;

const MONTHS = {
  'sty': 1, 'styczeń': 1,
  'lut': 2, 'luty': 2,
  'mar': 3, 'marzec': 3,
  'kwi': 4, 'kwiecień': 4,
  'maj': 5,
  'cze': 6, 'czerwiec': 6,
  'lip': 7, 'lipiec': 7,
  'sie': 8, 'sierpień': 8,
  'wrz': 9, 'wrzesień': 9,
  'paź': 10, 'październik': 10,
  'lis': 11, 'listopad': 11,
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

function getResult(mecz, isDrawa) {
  if (!mecz.score) return null;
  const isHome = isDrawa(mecz.team1);
  const [s1, s2] = mecz.score.split(':').map(Number);
  const d = isHome ? s1 : s2;
  const o = isHome ? s2 : s1;
  return d > o ? 'W' : d < o ? 'L' : 'D';
}

function resultLabel(r) {
  if (r === 'W') return 'WYGRANA';
  if (r === 'L') return 'PORAŻKA';
  if (r === 'D') return 'REMIS';
  return '';
}

function resultColor(r) {
  if (r === 'W') return '#22c55e';
  if (r === 'L') return '#ef4444';
  if (r === 'D') return '#f59e0b';
  return '#3b82f6';
}

function PlayerRow({ p, highlight }) {
  const goals = p.gole_w_meczu || 0;
  const own = p.samobojcze_w_meczu || 0;
  const card = p.kartka_w_meczu;
  const sub = p.zmiana_w_meczu;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <span style={{
        minWidth: 22, textAlign: 'right',
        fontSize: 10, color: '#334155', flexShrink: 0,
      }}>
        {p.numer}
      </span>
      <span style={{
        flex: 1, fontSize: 12,
        color: highlight ? '#e2e8f0' : '#64748b',
        fontWeight: highlight ? 600 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {p.nazwisko.trim()}
      </span>
      <span style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
        {goals > 0 && (
          <span style={{ fontSize: 10 }}>
            {'⚽'.repeat(goals)}
          </span>
        )}
        {own > 0 && (
          <span style={{ fontSize: 9, color: '#ef4444' }} title="samobójcza">og</span>
        )}
        {card === 'żółta' && <span style={{ fontSize: 10 }}>🟨</span>}
        {card === 'czerwona' && <span style={{ fontSize: 10 }}>🟥</span>}
        {card === 'żółta+czerwona' && <span style={{ fontSize: 10 }}>🟨🟥</span>}
        {sub === 'wszedł' && <span style={{ fontSize: 9, color: '#22c55e' }}>▲</span>}
        {sub === 'zszedł' && <span style={{ fontSize: 9, color: '#ef4444' }}>▼</span>}
      </span>
    </div>
  );
}

function TeamSquad({ team, squad, isDrawa, HerbImg }) {
  const highlight = isDrawa(team);
  const p11 = squad?.pierwsza11 || [];
  const rez = squad?.rezerwa || [];

  return (
    <div
      className={highlight ? 'squad-drawa' : ''}
      style={{
        flex: 1, minWidth: 0,
        background: highlight ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.15)',
        border: highlight ? '1px solid rgba(59,130,246,0.15)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Team header */}
      <div style={{
        padding: '8px 12px',
        background: highlight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: highlight ? '#3b82f6' : '#475569',
          letterSpacing: '0.05em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team}
        </span>
      </div>

      {/* First 11 */}
      <div style={{ padding: '6px 12px' }}>
        <div style={{ fontSize: 8, color: '#334155', letterSpacing: '0.12em', marginBottom: 4 }}>
          SKŁAD
        </div>
        {p11.map((p, i) => (
          <PlayerRow key={i} p={p} highlight={highlight} />
        ))}
      </div>

      {/* Bench */}
      {rez.length > 0 && (
        <div style={{ padding: '6px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 8, color: '#334155', letterSpacing: '0.12em', marginBottom: 4 }}>
            ŁAWKA
          </div>
          {rez.map((p, i) => (
            <PlayerRow key={i} p={p} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchDetails({ mecz, drawaSide, isDrawa }) {
  const sklady = mecz.sklady;

  return (
    <div style={{
      padding: '16px 16px 20px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(0,0,0,0.2)',
    }}>
      {/* Events timeline */}
      {mecz.strzelcy?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.15em', marginBottom: 8 }}>
            PRZEBIEG MECZU
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mecz.wszystkieZdarzenia?.map((z, i) => {
              const isDrawaEvent = z.strona === 'gospodarze';
              const icon = z.typ === 'gol' ? '⚽'
                : z.typ === 'żółta kartka' ? '🟨'
                : z.typ === 'czerwona kartka' ? '🟥'
                : z.typ === 'zmiana' ? '↔' : null;
              if (!icon) return null;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  justifyContent: isDrawaEvent ? 'flex-start' : 'flex-end',
                  padding: '2px 0',
                }}>
                  {isDrawaEvent && (
                    <span style={{ fontSize: 10, color: '#475569', minWidth: 24 }}>{z.minuta}'</span>
                  )}
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: isDrawaEvent ? '#94a3b8' : '#64748b' }}>
                    {z.zawodnik}
                  </span>
                  {!isDrawaEvent && (
                    <span style={{ fontSize: 10, color: '#475569', minWidth: 24, textAlign: 'right' }}>{z.minuta}'</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Squads */}
      {sklady && (
        <div>
          {mecz.strzelcy?.length > 0 && (
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.15em', marginBottom: 10 }}>
              SKŁADY
            </div>
          )}
          <div className="squads-container" style={{ display: 'flex', gap: 10 }}>
            <TeamSquad
              team={mecz.team1}
              squad={sklady.gospodarze}
              isDrawa={isDrawa}
              HerbImg={null}
            />
            <TeamSquad
              team={mecz.team2}
              squad={sklady.goscie}
              isDrawa={isDrawa}
              HerbImg={null}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ mecz, isDrawa, HerbImg, upcoming }) {
  const [expanded, setExpanded] = useState(false);

  const isDone = !!mecz.score;
  const isHome = isDrawa(mecz.team1);
  const result = getResult(mecz, isDrawa);
  const color = isDone ? resultColor(result) : '#3b82f6';
  const isPuchar = mecz.liga?.toLowerCase().includes('puchar');

  const [s1, s2] = isDone ? mecz.score.split(':').map(Number) : [null, null];

  const drawaSide = isHome ? 'gospodarze' : 'goscie';
  const drawaGoals = (mecz.strzelcy || []).filter(s => s.strona === drawaSide);
  const oppGoals   = (mecz.strzelcy || []).filter(s => s.strona !== drawaSide);
  const hasDetails = isDone && (mecz.strzelcy?.length > 0 || mecz.kartki?.length > 0 || !!mecz.sklady);

  const dateShort = mecz.date?.split(',')[0] ?? '';

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Header row */}
      <div style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Liga badge */}
          <span style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 10,
            background: isPuchar ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.1)',
            color: isPuchar ? '#ca8a04' : '#3b82f6',
            border: `1px solid ${isPuchar ? 'rgba(234,179,8,0.3)' : 'rgba(59,130,246,0.2)'}`,
            letterSpacing: '0.08em', fontWeight: 600,
          }}>
            {isPuchar ? 'PUCHAR POLSKI' : 'KLASA B'}
          </span>
          <span style={{ fontSize: 12, color: '#475569' }}>{dateShort}</span>
        </div>

        {/* Result / WO / upcoming */}
        {mecz.walkower ? (
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(100,116,139,0.15)',
            border: '1px solid rgba(100,116,139,0.3)',
            color: '#64748b', letterSpacing: '0.12em', fontWeight: 700,
          }}>
            WALKOWER
          </span>
        ) : isDone && result ? (
          <span style={{
            fontSize: 10, padding: '3px 12px', borderRadius: 20,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            color, letterSpacing: '0.12em', fontWeight: 700,
          }}>
            {resultLabel(result)}
          </span>
        ) : (
          <span style={{
            fontSize: 10, padding: '3px 12px', borderRadius: 20,
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#3b82f6', letterSpacing: '0.1em',
          }}>
            NADCHODZĄCY
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div style={{
        padding: '20px 20px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Team 1 */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8, minWidth: 0,
        }}>
          <HerbImg src={mecz.herb1} alt={mecz.team1} size={48} />
          <span style={{
            fontSize: 12, textAlign: 'center', lineHeight: 1.3,
            color: isDrawa(mecz.team1) ? '#e2e8f0' : '#64748b',
            fontWeight: isDrawa(mecz.team1) ? 700 : 400,
          }}>
            {mecz.team1}
          </span>
        </div>

        {/* Score */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          {isDone ? (
            <div style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              color,
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}>
              {mecz.score}
            </div>
          ) : (
            <div style={{
              fontSize: 28,
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              color: '#334155',
              lineHeight: 1,
            }}>
              VS
            </div>
          )}
          {isDone && mecz.status === 'odbyty_brak_relacji' && (
            <div style={{ fontSize: 9, color: '#334155', marginTop: 4, letterSpacing: '0.08em' }}>
              BRAK RELACJI
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8, minWidth: 0,
        }}>
          <HerbImg src={mecz.herb2} alt={mecz.team2} size={48} />
          <span style={{
            fontSize: 12, textAlign: 'center', lineHeight: 1.3,
            color: isDrawa(mecz.team2) ? '#e2e8f0' : '#64748b',
            fontWeight: isDrawa(mecz.team2) ? 700 : 400,
          }}>
            {mecz.team2}
          </span>
        </div>
      </div>

      {/* Drawa goalscorers preview (always visible) */}
      {drawaGoals.length > 0 && (
        <div style={{
          padding: '0 20px 14px',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, color: '#3b82f6' }}>⚽</span>
          {drawaGoals.map((g, i) => (
            <span key={i} style={{ fontSize: 11, color: '#64748b' }}>
              {g.zawodnik}
              {g.minuta ? <span style={{ color: '#475569', marginLeft: 2 }}>{g.minuta}'</span> : null}
              {i < drawaGoals.length - 1 && <span style={{ color: '#1e293b', marginLeft: 4 }}>·</span>}
            </span>
          ))}
        </div>
      )}

      {isDone && mecz.id && (
        <div style={{ padding: '0 20px 12px' }}>
          <Komentarze typ="mecz" targetId={mecz.id} />
        </div>
      )}

      {/* Expand button */}
      {hasDetails && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: expanded ? '#475569' : '#334155',
              cursor: 'pointer', padding: '10px 20px',
              fontSize: 10, letterSpacing: '0.12em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = expanded ? '#475569' : '#334155'; e.currentTarget.style.background = 'none'; }}
          >
            {expanded ? '▲ ZWIŃ' : '▼ SKŁAD I RELACJA'}
          </button>

          {expanded && (
            <MatchDetails mecz={mecz} drawaSide={drawaSide} isDrawa={isDrawa} />
          )}
        </div>
      )}
    </div>
  );
}

export default function Terminarz({ mecze = [], SectionLabel, HerbImg, isDrawa }) {
  const [showAll, setShowAll] = useState(false);

  const played = mecze
    .filter(m => m.score && m.status !== 'planowany')
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  const upcoming = mecze
    .filter(m => !m.score && m.status === 'planowany')
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const visiblePlayed = showAll ? played : played.slice(0, SHOW_INITIALLY);

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Terminarz — upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <SectionLabel>Terminarz</SectionLabel>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map((m, i) => (
                <MatchCard key={m.id || `u-${i}`} mecz={m} isDrawa={isDrawa} HerbImg={HerbImg} upcoming />
              ))}
            </div>
          </div>
        )}

        {/* Wyniki */}
        <div>
          <SectionLabel>Wyniki</SectionLabel>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visiblePlayed.map((m, i) => (
              <MatchCard key={m.id || `p-${i}`} mecz={m} isDrawa={isDrawa} HerbImg={HerbImg} />
            ))}
          </div>

          {played.length > SHOW_INITIALLY && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowAll(v => !v)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#3b82f6',
                  borderRadius: 8,
                  padding: '12px 0',
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; e.currentTarget.style.background = 'none'; }}
              >
                {showAll ? '▲ ZWIŃ' : `▼ ROZWIŃ CAŁY SEZON — ${played.length} MECZÓW`}
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
