'use client';
import Link from 'next/link';

const FORM_COLOR = { W: '#22c55e', D: '#94a3b8', L: '#ef4444' };
const FORM_LABEL = { W: 'W', D: 'R', L: 'P' };

export default function Statystyki({ teamStats = null, SectionLabel }) {
  if (!teamStats) return null;

  const { wins, draws, losses, total, winPct, golesFor, golesAgainst,
          homeWins, homeDraws, homeLosses, awayWins, awayDraws, awayLosses,
          unbeatenStreak, unbeatenSince, form } = teamStats;

  return (
    <section
      className="mob-pb"
      style={{ padding: '0 20px 80px', background: '#030712' }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Statystyki sezonu 2025/2026</SectionLabel>

        {/* Główne liczby */}
        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { value: total, label: 'MECZÓW' },
            { value: `${golesFor}:${golesAgainst}`, label: 'BRAMKI', accent: true },
            { value: `${winPct}%`, label: 'WYGRANYCH' },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                background: '#0f172a',
                padding: '22px 12px',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(30px, 6vw, 46px)',
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  color: s.accent ? '#3b82f6' : '#fff',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#334155', marginTop: 6 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Dom / Wyjazd */}
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'DOM', w: homeWins, d: homeDraws, l: homeLosses },
            { label: 'WYJAZD', w: awayWins, d: awayDraws, l: awayLosses },
          ].map((side) => {
            const tot = side.w + side.d + side.l;
            const pct = tot ? Math.round((side.w / tot) * 100) : 0;
            return (
              <div
                key={side.label}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '14px 18px',
                }}
              >
                <div className="stat-side-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#475569' }}>
                    {side.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569' }}>
                    {side.w}W · {side.d}R · {side.l}P
                  </span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: side.l === 0 ? '#22c55e' : '#3b82f6',
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{pct}% wygranych</span>
                  {side.l === 0 && <span style={{ color: '#22c55e', fontWeight: 700 }}>NIEPOKONANI</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Seria bez porażki + forma */}
        <div
          style={{
            marginTop: 10,
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#22c55e', marginBottom: 4 }}>
              SERIA BEZ PORAŻKI
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 36,
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  color: '#22c55e',
                  lineHeight: 1,
                }}
              >
                {unbeatenStreak}
              </span>
              <span style={{ fontSize: 12, color: '#475569' }}>meczów · od {unbeatenSince}</span>
            </div>
          </div>
          {form && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.1em', marginRight: 4 }}>OSTATNIE</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {form.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: FORM_COLOR[r],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {FORM_LABEL[r]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Button */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link
            href="/statystyki"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 8,
              color: '#3b82f6',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
          >
            ZOBACZ WIĘCEJ STATYSTYK →
          </Link>
        </div>
      </div>
    </section>
  );
}
