"use client";

import { useState } from "react";
import Link from "next/link";
import { meczSortKeyAsc } from "@/lib/parseMeczDate";

const DRAWA_HERB = "/logo.png";
const isDrawa = (name) => name?.toLowerCase().includes("drawa");

const HerbImg = ({ src, alt, size = 40 }) => {
  const drawa = isDrawa(alt);
  const imgSize = drawa ? Math.max(size, 64) : size;
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    src={drawa ? DRAWA_HERB : src?.includes("/flags/0.jpg") ? `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='%231e293b' rx='20'/><text x='20' y='26' text-anchor='middle' font-size='18' fill='%2364748b'>?</text></svg>` : src}
    alt={alt} width={imgSize} height={imgSize}
    style={{ objectFit: "contain", borderRadius: 4 }}
  />;
};

function getResult(mecz) {
  if (!mecz.score) return null;
  const isHome = isDrawa(mecz.team1);
  const [s1, s2] = mecz.score.split(":").map(Number);
  const d = isHome ? s1 : s2, o = isHome ? s2 : s1;
  return d > o ? "W" : d < o ? "L" : "D";
}

function resultColor(r) {
  if (r === "W") return "#22c55e";
  if (r === "L") return "#ef4444";
  if (r === "D") return "#f59e0b";
  return "#3b82f6";
}

function resultLabel(r) {
  if (r === "W") return "WYGRANA";
  if (r === "L") return "PORAŻKA";
  if (r === "D") return "REMIS";
  return "";
}

function PlayerRow({ p, highlight }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <span style={{ minWidth: 22, textAlign: "right", fontSize: 10, color: "#334155", flexShrink: 0 }}>{p.numer}</span>
      <span style={{ flex: 1, fontSize: 12, color: highlight ? "#e2e8f0" : "#64748b", fontWeight: highlight ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {p.nazwisko?.trim()}
      </span>
      <span style={{ display: "flex", gap: 3, flexShrink: 0, alignItems: "center" }}>
        {(p.gole_w_meczu || 0) > 0 && <span style={{ fontSize: 10 }}>{"⚽".repeat(p.gole_w_meczu)}</span>}
        {p.kartka_w_meczu === "żółta" && <span style={{ fontSize: 10 }}>🟨</span>}
        {p.kartka_w_meczu === "czerwona" && <span style={{ fontSize: 10 }}>🟥</span>}
        {p.zmiana_w_meczu === "wszedł" && <span style={{ fontSize: 9, color: "#22c55e" }}>▲</span>}
        {p.zmiana_w_meczu === "zszedł" && <span style={{ fontSize: 9, color: "#ef4444" }}>▼</span>}
      </span>
    </div>
  );
}

function MatchCard({ mecz }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = !!mecz.score;
  const result = getResult(mecz);
  const color = isDone ? resultColor(result) : "#3b82f6";
  const isHome = isDrawa(mecz.team1);
  const drawaSide = isHome ? "gospodarze" : "goscie";
  const drawaGoals = (mecz.strzelcy || []).filter(s => s.strona === drawaSide);
  const hasDetails = isDone && (mecz.strzelcy?.length > 0 || !!mecz.sklady);
  const sklady = mecz.sklady || {};

  return (
    <div style={{
      background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)",
      borderLeft: `4px solid ${color}`, borderRadius: 12, overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>{mecz.date?.split(",")[0] || ""}</span>
        {mecz.walkower ? (
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)", color: "#64748b", letterSpacing: "0.12em", fontWeight: 700 }}>WALKOWER</span>
        ) : isDone && result ? (
          <span style={{ fontSize: 10, padding: "3px 12px", borderRadius: 20, background: `${color}18`, border: `1px solid ${color}40`, color, letterSpacing: "0.12em", fontWeight: 700 }}>{resultLabel(result)}</span>
        ) : (
          <span style={{ fontSize: 10, padding: "3px 12px", borderRadius: 20, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6", letterSpacing: "0.1em" }}>NADCHODZĄCY</span>
        )}
      </div>

      <div style={{ padding: "20px 20px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <HerbImg src={mecz.herb1} alt={mecz.team1} size={48} />
          <span style={{ fontSize: 12, textAlign: "center", lineHeight: 1.3, color: isDrawa(mecz.team1) ? "#e2e8f0" : "#64748b", fontWeight: isDrawa(mecz.team1) ? 700 : 400 }}>{mecz.team1}</span>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          {isDone ? (
            <div style={{ fontSize: "clamp(28px, 5vw, 44px)", fontFamily: "'Bebas Neue', Impact, sans-serif", color, letterSpacing: "0.05em", lineHeight: 1 }}>{mecz.score}</div>
          ) : (
            <div style={{ fontSize: 28, fontFamily: "'Bebas Neue', Impact, sans-serif", color: "#334155", lineHeight: 1 }}>VS</div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <HerbImg src={mecz.herb2} alt={mecz.team2} size={48} />
          <span style={{ fontSize: 12, textAlign: "center", lineHeight: 1.3, color: isDrawa(mecz.team2) ? "#e2e8f0" : "#64748b", fontWeight: isDrawa(mecz.team2) ? 700 : 400 }}>{mecz.team2}</span>
        </div>
      </div>

      {drawaGoals.length > 0 && (
        <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#3b82f6" }}>⚽</span>
          {drawaGoals.map((g, i) => (
            <span key={i} style={{ fontSize: 11, color: "#64748b" }}>
              {g.zawodnik}{g.minuta ? <span style={{ color: "#475569", marginLeft: 2 }}>{g.minuta}&apos;</span> : null}
              {i < drawaGoals.length - 1 && <span style={{ color: "#1e293b", marginLeft: 4 }}>·</span>}
            </span>
          ))}
        </div>
      )}

      {hasDetails && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={() => setExpanded(e => !e)} style={{ width: "100%", background: "none", border: "none", color: "#334155", cursor: "pointer", padding: "10px 20px", fontSize: 10, letterSpacing: "0.12em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {expanded ? "▲ ZWIŃ" : "▼ SKŁAD I RELACJA"}
          </button>

          {expanded && (
            <div style={{ padding: "16px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}>
              {mecz.wszystkieZdarzenia?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", marginBottom: 8 }}>PRZEBIEG MECZU</div>
                  {mecz.wszystkieZdarzenia.map((z, i) => {
                    const isGosp = z.strona === "gospodarze";
                    const icon = z.typ === "gol" ? "⚽" : z.typ === "żółta kartka" ? "🟨" : z.typ?.includes("czerwona") ? "🟥" : null;
                    if (!icon) return null;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: isGosp ? "flex-start" : "flex-end", padding: "2px 0" }}>
                        {isGosp && <span style={{ fontSize: 10, color: "#475569", minWidth: 24 }}>{z.minuta}&apos;</span>}
                        <span style={{ fontSize: 12 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: isGosp ? "#94a3b8" : "#64748b" }}>{z.zawodnik}</span>
                        {!isGosp && <span style={{ fontSize: 10, color: "#475569", minWidth: 24, textAlign: "right" }}>{z.minuta}&apos;</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {sklady && (
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ team: mecz.team1, squad: sklady.gospodarze }, { team: mecz.team2, squad: sklady.goscie }].map(({ team, squad }) => {
                    if (!squad?.pierwsza11?.length) return null;
                    const hl = isDrawa(team);
                    return (
                      <div key={team} style={{ flex: 1, background: hl ? "rgba(59,130,246,0.04)" : "rgba(0,0,0,0.15)", border: hl ? "1px solid rgba(59,130,246,0.15)" : "1px solid rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" }}>
                        <div style={{ padding: "8px 12px", background: hl ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: hl ? "#3b82f6" : "#475569", letterSpacing: "0.05em" }}>{team}</span>
                        </div>
                        <div style={{ padding: "6px 12px" }}>
                          <div style={{ fontSize: 8, color: "#334155", letterSpacing: "0.12em", marginBottom: 4 }}>SKŁAD</div>
                          {squad.pierwsza11.map((p, j) => <PlayerRow key={j} p={p} highlight={hl} />)}
                        </div>
                        {squad.rezerwa?.length > 0 && (
                          <div style={{ padding: "6px 12px 10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ fontSize: 8, color: "#334155", letterSpacing: "0.12em", marginBottom: 4 }}>ŁAWKA</div>
                            {squad.rezerwa.map((p, j) => <PlayerRow key={j} p={p} highlight={hl} />)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isDone && mecz.id && (
        <div style={{ padding: "0 20px 4px" }}>
          <Link href={`/liga/mecz/${mecz.id}`} style={{ fontSize: 10, color: "#334155", textDecoration: "none", letterSpacing: "0.1em" }}>
            PEŁNA RELACJA →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LigaClient({ mecze }) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...mecze].sort((a, b) => meczSortKeyAsc(a.date) - meczSortKeyAsc(b.date));

  return (
    <>
      <style>{`
        .squads-container { display: flex; gap: 10px; }
        @media (max-width: 640px) { .squads-container { flex-direction: column; } }
      `}</style>

      <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px" }}>
        <div style={{ width: 4, height: 24, background: "#22c55e", borderRadius: 2 }} />
        <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", fontWeight: "normal" }}>Mecze sezonu</span>
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sorted.map((m, i) => (
          <div key={m.id} style={{ display: !showAll && i >= 8 ? "none" : "block" }}>
            <MatchCard mecz={m} />
          </div>
        ))}
      </div>

      {sorted.length > 8 && (
        <button onClick={() => setShowAll(v => !v)} style={{ width: "100%", marginTop: 16, background: "none", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", borderRadius: 8, padding: "12px 0", cursor: "pointer", fontSize: 11, letterSpacing: "0.14em" }}>
          {showAll ? "▲ ZWIŃ" : `▼ WSZYSTKIE MECZE (${sorted.length})`}
        </button>
      )}
    </>
  );
}
