'use client';
import { useState } from 'react';

function getResult(mecz) {
  if (mecz.walkower) return { label: 'W/O', color: '#475569', bg: 'rgba(71,85,105,0.15)' };
  if (!mecz.score) return null;
  const [g1, g2] = mecz.score.split(':').map(Number);
  const drawaHome = mecz.team1?.toLowerCase().includes('drawa');
  const drawaGoals = drawaHome ? g1 : g2;
  const oppGoals = drawaHome ? g2 : g1;
  if (drawaGoals > oppGoals) return { label: 'W', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (drawaGoals === oppGoals) return { label: 'R', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
  return { label: 'P', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

export default function SezonTimeline({ mecze, SectionLabel, HerbImg, isDrawa }) {
  const [active, setActive] = useState(null);
  const finished = mecze.filter(m => m.score || m.walkower);

  return (
    <section className="mob-pb" style={{ padding: '0 20px 80px', background: '#030712' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionLabel>Sezon Krok po Kroku</SectionLabel>
        <p style={{ fontSize: 11, color: '#334155', marginTop: 6, letterSpacing: '0.1em' }}>
          {finished.length} ROZEGRANYCH MECZÓW
        </p>

        {/* Horizontal scroll strip */}
        <div
          style={{
            marginTop: 24,
            overflowX: 'auto',
            paddingBottom: 12,
            scrollbarWidth: 'none',
          }}
          className="timeline-strip"
        >
          <style>{`.timeline-strip::-webkit-scrollbar { display: none; }`}</style>
          <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
            {finished.map((m, i) => {
              const res = getResult(m);
              if (!res) return null;
              const opp = isDrawa(m.team1) ? m.team2 : m.team1;
              const oppShort = opp.replace(/^(MKS|KS|LKS|SKS|GKS|UKS|FC)\s+/i, '').split(' ')[0];
              const isActive = active === i;

              return (
                <div
                  key={i}
                  onClick={() => setActive(isActive ? null : i)}
                  style={{
                    background: isActive ? '#0f1f3d' : '#0f172a',
                    border: `1px solid ${isActive ? res.color : 'rgba(255,255,255,0.06)'}`,
                    borderTop: `3px solid ${res.color}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    minWidth: 80,
                    textAlign: 'center',
                    transition: 'border-color 0.2s, background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 9, color: '#334155', letterSpacing: '0.1em', marginBottom: 4 }}>
                    M{i + 1}
                  </div>
                  <div style={{
                    fontSize: 15,
                    fontFamily: "'Bebas Neue', Impact, sans-serif",
                    color: res.color,
                    letterSpacing: '0.05em',
                    lineHeight: 1,
                  }}>
                    {m.walkower ? 'W/O' : m.score}
                  </div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 4, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {oppShort}
                  </div>
                  <div style={{
                    marginTop: 6,
                    display: 'inline-block',
                    background: res.bg,
                    color: res.color,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    borderRadius: 4,
                    padding: '2px 5px',
                  }}>
                    {res.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expanded detail panel */}
        {active !== null && (() => {
          const m = finished[active];
          if (!m) return null;
          const res = getResult(m);
          const goals = m.events?.filter(e => e.type === 'goal') ?? [];
          const cards = m.events?.filter(e => e.type === 'card') ?? [];

          return (
            <div style={{
              marginTop: 12,
              background: '#0f172a',
              border: `1px solid rgba(${res?.color === '#22c55e' ? '34,197,94' : res?.color === '#ef4444' ? '239,68,68' : '148,163,184'},0.2)`,
              borderRadius: 12,
              padding: '20px 24px',
              animation: 'fadeIn 0.2s ease',
            }}>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }`}</style>

              {/* Teams + score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <HerbImg src={m.herb1} alt={m.team1} size={32} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, maxWidth: 80, textAlign: 'center' }}>{m.team1}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 32, color: '#fff', letterSpacing: '0.05em' }}>
                  {m.walkower ? 'W/O' : m.score}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <HerbImg src={m.herb2} alt={m.team2} size={32} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, maxWidth: 80, textAlign: 'center' }}>{m.team2}</div>
                </div>
              </div>

              <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', letterSpacing: '0.1em', marginBottom: 12 }}>
                {m.date} · {m.liga}
              </div>

              {/* Goals */}
              {goals.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {goals.map((e, i) => (
                    <span key={i} style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#22c55e' }}>
                      ⚽ {e.player} {e.minute ? `${e.minute}'` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Cards */}
              {cards.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                  {cards.map((e, i) => (
                    <span key={i} style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#eab308' }}>
                      🟨 {e.player} {e.minute ? `${e.minute}'` : ''}
                    </span>
                  ))}
                </div>
              )}

              {goals.length === 0 && cards.length === 0 && (
                <div style={{ textAlign: 'center', fontSize: 11, color: '#334155' }}>Brak szczegółowych danych</div>
              )}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
