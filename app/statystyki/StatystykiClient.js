"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import {computeTeamStats} from "@/lib/computeStats";
import {parseMeczDate} from "@/lib/parseMeczDate";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Legend,
} from "recharts";

// ── helpers ───────────────────────────────────────────────────

const isDrawa = (name) => name?.toLowerCase().includes("drawa");

const FORM_COLOR = {W: "#22c55e", D: "#94a3b8", L: "#ef4444"};
const FORM_LABEL = {W: "W", D: "R", L: "P"};

const CARD = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 14,
  padding: "22px",
};

const SECTION_LABEL = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#475569",
  marginBottom: 16,
};

const BIG = {
  fontFamily: "'Bebas Neue', Impact, sans-serif",
  lineHeight: 1,
};

function parsePolishDate(s) {
  return parseMeczDate(s) || new Date(0);
}

const SHORT_MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

// ── custom tooltip for charts ─────────────────────────────────
const ChartTooltip = ({active, payload, label}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12
    }}>
      <div style={{color: "#94a3b8", marginBottom: 4}}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{color: p.color, fontWeight: 600}}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ── page ──────────────────────────────────────────────────────

export default function StatystykiClient({ initialMecze }) {
  const [mecze, setMecze] = useState(initialMecze || []);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (initialMecze) return;
    let cancelled = false;
    fetch("/api/ustawienia")
      .then(r => r.json())
      .then(u => {
        if (cancelled) return;
        const enc = encodeURIComponent(u.aktywny_sezon || "2025/26");
        return fetch(`/api/liga/mecze?sezon=${enc}`).then(r => r.json());
      })
      .then(d => { if (d && !cancelled) setMecze(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [initialMecze]);

  const s = computeTeamStats(mecze);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px) and (orientation: portrait)");
    setIsPortrait(mq.matches);
    const handler = (e) => setIsPortrait(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  useEffect(() => {
    document.body.style.overflow = isPortrait ? "hidden" : "";
    document.documentElement.style.overflow = isPortrait ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isPortrait]);

  // scorers
  const scorerMap = {};
  for (const mecz of mecze) {
    if (!mecz.strzelcy?.length) continue;
    const drawaSide = isDrawa(mecz.team1) ? "gospodarze" : "goscie";
    for (const g of mecz.strzelcy) {
      if (g.strona === drawaSide) scorerMap[g.zawodnik] = (scorerMap[g.zawodnik] ?? 0) + 1;
    }
  }
  const strzelcy = Object.entries(scorerMap).sort((a, b) => b[1] - a[1]).map(([name, gole]) => ({name, gole}));

  // goals by minute — chart data
  const minuteData = Object.entries(s.goalsByMinute).
  map(([band, count]) => ({
    band,
    count,
  }));
  const maxMinute = Math.max(...minuteData.map((d) => d.count));

  // ── DNA Sezonu ──────────────────────────────────────────────
  const ligaMeczeWithEvents = mecze.filter(
    (m) => !m.liga?.includes("Puchar") && m.status !== "planowany" && m.score && m.wszystkieZdarzenia?.length
  );
  const dnaMatches = ligaMeczeWithEvents.map((m) => {
    const home = isDrawa(m.team1);
    const drawaSide = home ? "gospodarze" : "goscie";
    const [s1, s2] = m.score.split(":").map(Number);
    const gf = home ? s1 : s2;
    const ga = home ? s2 : s1;
    const opp = (home ? m.team2 : m.team1)
      .replace(/^(MKS|KS|LKS|SKS|GKS|UKS|FC)\s+/i, "")
      .split(" ").slice(0, 2).join(" ");
    return {
      opp,
      score: `${gf}:${ga}`,
      result: gf > ga ? "W" : gf < ga ? "L" : "D",
      events: (m.wszystkieZdarzenia).map((z) => ({
        min: Math.min(Math.max(parseInt(z.minuta) || 1, 1), 90),
        type: z.typ,
        isDrawa: z.strona === drawaSide,
      })),
    };
  });

  // ── Portret Drużyny (squad heatmap) ────────────────────────
  const allLigaMecze = mecze
    .filter((m) => !m.liga?.includes("Puchar") && m.status !== "planowany" && m.score)
    .sort((a, b) => parsePolishDate(a.date).getTime() - parsePolishDate(b.date).getTime());

  const playerMatchMatrix = {};
  const matchMetaList = [];

  allLigaMecze.forEach((m, mi) => {
    const home = isDrawa(m.team1);
    const oppFull = (home ? m.team2 : m.team1).replace(/^(MKS|KS|LKS|SKS|GKS|UKS|FC)\s+/i, "");
    const dateObj = parsePolishDate(m.date);
    const dateLabel = `${dateObj.getDate()} ${SHORT_MONTHS[dateObj.getMonth()]}`;
    const [s1, s2] = (m.score || "0:0").split(":").map(Number);
    const gf = home ? s1 : s2;
    const ga = home ? s2 : s1;
    const result = gf > ga ? "W" : gf < ga ? "L" : "D";

    matchMetaList.push({
      label: oppFull.split(" ")[0].slice(0, 3),
      opp: oppFull.split(" ").slice(0, 2).join(" "),
      date: dateLabel,
      score: `${gf}:${ga}`,
      result,
      walkower: !!m.walkower,
      round: mi + 1,
    });

    if (!m.sklady) return;

    const drawaSide = home ? "gospodarze" : "goscie";
    const sklad = m.sklady[drawaSide];
    if (!sklad) return;

    const all = [...(sklad.pierwsza11 || []), ...(sklad.rezerwa || [])];
    for (const p of all) {
      if (!p.nazwisko) continue;
      if (!playerMatchMatrix[p.nazwisko]) {
        playerMatchMatrix[p.nazwisko] = Array(allLigaMecze.length).fill(null);
      }
      playerMatchMatrix[p.nazwisko][mi] = p.gole_w_meczu ?? 0;
    }
  });

  const sortedSquad = Object.entries(playerMatchMatrix)
    .map(([name, matches]) => ({name, apps: matches.filter((v) => v !== null).length, matches}))
    .sort((a, b) => b.apps - a.apps);

  // ── Kiedy mecz był rozstrzygnięty ──────────────────────────
  const decisiveMoments = dnaMatches
    .filter((m) => m.result === "W")
    .map((m) => {
      let dGf = 0, dGa = 0, decMin = 0, currentLead = false;
      for (const e of m.events) {
        if (e.type !== "gol" && e.type !== "samobój") continue;
        if (e.isDrawa) dGf++; else dGa++;
        if (dGf > dGa) {
          decMin = e.min;
          currentLead = true;
        } else {
          currentLead = false;
        }
      }
      const [gf, ga] = m.score.split(":").map(Number);
      return {opp: m.opp, score: m.score, min: decMin, margin: gf - ga};
    })
    .filter((m) => m.min > 0)
    .sort((a, b) => a.min - b.min);

  // season progression — cumulative goals scored & conceded
  let cumFor = 0, cumAgainst = 0;
  const progressionData = (s.allResults).map((r, i) => {
    const [gf, ga] = (r.score).split(":").map(Number);
    cumFor += gf;
    cumAgainst += ga;
    return {match: i + 1, zdobyte: cumFor, stracone: cumAgainst, opp: r.opponent};
  });

  // per-match scored/conceded (for bar chart)
  const perMatchData = (s.allResults).map((r, i) => {
    const [gf, ga] = (r.score).split(":").map(Number);
    return {match: `M${i + 1}`, zdobyte: gf, stracone: ga, result: r.result, opp: r.opponent};
  });

  // W/D/L donut
  const wdlData = [
    {name: "Wygrane", value: s.wins, color: "#22c55e"},
    {name: "Remisy", value: s.draws, color: "#94a3b8"},
    {name: "Porażki", value: s.losses, color: "#ef4444"},
  ];

  // home/away comparison
  const homeAwayData = [
    {name: "DOM", wygrane: s.homeWins, remisy: s.homeDraws, porazki: s.homeLosses},
    {name: "WYJAZD", wygrane: s.awayWins, remisy: s.awayDraws, porazki: s.awayLosses},
  ];

  return (
    <>
      <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
 * { box-sizing: border-box; margin: 0; padding: 0; }
 body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
 ::-webkit-scrollbar { width: 6px; }
 ::-webkit-scrollbar-track { background: #0f172a; }
 ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
 @media (max-width: 600px), (max-height: 500px) and (orientation: landscape) {
   .stats-grid-2, .stats-grid-3, .stats-hero { grid-template-columns: 1fr !important; }
 }
 @keyframes spin-hint {
   0%, 100% { transform: rotate(0deg); }
   40% { transform: rotate(-90deg); }
   60% { transform: rotate(-90deg); }
 }
 `}</style>

      {/* Overlay: obróć telefon */}
      {isPortrait && <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 1001,
        background: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        overflow: "hidden",
      }}>
        <div style={{ fontSize: 52, animation: "spin-hint 2s ease-in-out infinite" }}>📱</div>
        <div style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: 26, letterSpacing: "0.1em", color: "#fff",
        }}>OBRÓĆ TELEFON</div>
        <div style={{ fontSize: 12, color: "#475569", textAlign: "center", maxWidth: 220, lineHeight: 1.6 }}>
          Statystyki wymagają widoku poziomego
        </div>
        <div style={{ width: 36, height: 2, background: "#3b82f6", borderRadius: 2 }} />
      </div>}

      <NavBar backLabel="Strona główna"/>

      <main style={{maxWidth: 900, margin: "0 auto", padding: "96px 20px 80px"}}>

        {/* ── 1. HERO ── */}
        <div
          className="stats-hero"
          style={{display: "grid", gridTemplateColumns: "1fr auto", gap: 16, marginBottom: 12, alignItems: "stretch"}}>
          {/* left: big numbers + form */}
          <div style={{...CARD, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
            <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0}}>
              {[
                {val: s.total, lbl: "MECZÓW", sub: "bez Pucharu", color: "#fff"},
                {
                  val: `${s.golesFor}:${s.golesAgainst}`,
                  lbl: "BRAMKI",
                  sub: `śr. ${s.avgGolesFor}/mecz`,
                  color: "#3b82f6"
                },
                {val: `${s.winPct}%`, lbl: "WYGRANYCH", sub: `${s.wins}W · ${s.draws}R · ${s.losses}P`, color: "#fff"},
              ].map((item, i) => (
                <div key={item.lbl} style={{
                  textAlign: "center",
                  padding: "0 8px",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none"
                }}>
                  <div style={{...BIG, fontSize: "clamp(30px,5vw,48px)", color: item.color}}>{item.val}</div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#334155",
                    marginTop: 5
                  }}>{item.lbl}</div>
                  <div style={{fontSize: 10, color: "#1e3a5f", marginTop: 3}}>{item.sub}</div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8
            }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#334155"
              }}>OSTATNIE {s.form.length} MECZÓW</span>
              <div style={{display: "flex", gap: 4}}>
                {(s.form).map((r, i) => (
                  <div key={i} style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: FORM_COLOR[r],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff"
                  }}>
                    {FORM_LABEL[r]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right: W/D/L donut */}
          <div style={{
            ...CARD,
            minWidth: 160,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={SECTION_LABEL}>BILANS</div>
            <PieChart width={130} height={130}>
              <Pie data={wdlData} cx={60} cy={60} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value"
                   stroke="none">
                {wdlData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
              </Pie>
            </PieChart>
            <div style={{display: "flex", flexDirection: "column", gap: 5, marginTop: 4}}>
              {wdlData.map((d) => (
                <div key={d.name} style={{display: "flex", alignItems: "center", gap: 6, fontSize: 11}}>
                  <div style={{width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0}}/>
                  <span style={{color: "#475569"}}>{d.name}</span>
                  <span style={{color: "#94a3b8", fontWeight: 700, marginLeft: "auto"}}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. GOLE WG MINUT + DOM vs WYJAZD ── */}
        <div className="stats-grid-2" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>

          {/* Gole wg minut */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>GOLE WG MINUT</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={minuteData} margin={{top: 0, right: 0, bottom: 0, left: -20}}>
                <XAxis dataKey="band" tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>} cursor={{fill: "rgba(255,255,255,0.03)"}}/>
                <Bar dataKey="count" name="Gole" radius={[4, 4, 0, 0]}>
                  {minuteData.map((entry) => (
                    <Cell key={entry.band} fill={entry.count === maxMinute ? "#3b82f6" : "rgba(59,130,246,0.3)"}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              fontSize: 10,
              color: "#334155"
            }}>
              <span>I poł: <span style={{color: "#64748b"}}>{s.golesH1}</span></span>
              <span>II poł: <span style={{color: "#64748b"}}>{s.golesH2}</span></span>
              <span>Szczyt: <span style={{color: "#3b82f6"}}>76–90 min</span></span>
            </div>
          </div>

          {/* Dom vs Wyjazd */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>DOM vs WYJAZD</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={homeAwayData} margin={{top: 0, right: 0, bottom: 0, left: -20}}>
                <XAxis dataKey="name" tick={{fill: "#475569", fontSize: 10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>} cursor={{fill: "rgba(255,255,255,0.03)"}}/>
                <Bar dataKey="wygrane" name="Wygrane" fill="#22c55e" radius={[3, 3, 0, 0]} stackId="a"/>
                <Bar dataKey="remisy" name="Remisy" fill="#475569" radius={[0, 0, 0, 0]} stackId="a"/>
                <Bar dataKey="porazki" name="Porażki" fill="#ef4444" radius={[0, 0, 3, 3]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{
              display: "flex",
              gap: 14,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.05)"
            }}>
              {[{c: "#22c55e", l: "Wygrane"}, {c: "#475569", l: "Remisy"}, {c: "#ef4444", l: "Porażki"}].map((i) => (
                <div key={i.l} style={{display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#334155"}}>
                  <div style={{width: 8, height: 8, borderRadius: 2, background: i.c}}/>
                  {i.l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. PRZEBIEG SEZONU ── */}
        <div style={{...CARD, marginBottom: 12}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4}}>
            <div style={SECTION_LABEL}>PRZEBIEG SEZONU — GOLE NARASTAJĄCO</div>
            <div style={{display: "flex", gap: 14, marginBottom: 16}}>
              {[{c: "#3b82f6", l: "Zdobyte"}, {c: "#ef4444", l: "Stracone"}].map((i) => (
                <div key={i.l} style={{display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#334155"}}>
                  <div style={{width: 8, height: 3, borderRadius: 2, background: i.c}}/>
                  {i.l}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={progressionData} margin={{top: 5, right: 0, bottom: 0, left: -20}}>
              <defs>
                <linearGradient id="colorFor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAgainst" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="match" tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}
                     label={{value: "Kolejka", position: "insideBottom", offset: -2, fill: "#1e293b", fontSize: 9}}/>
              <YAxis tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>} cursor={{stroke: "rgba(255,255,255,0.1)"}}/>
              <Area type="monotone" dataKey="zdobyte" name="Zdobyte" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#colorFor)" dot={false}/>
              <Area type="monotone" dataKey="stracone" name="Stracone" stroke="#ef4444" strokeWidth={1.5}
                    fill="url(#colorAgainst)" dot={false} strokeDasharray="4 2"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 4. BRAMKI PER MECZ ── */}
        <div style={{...CARD, marginBottom: 12}}>
          <div style={SECTION_LABEL}>BRAMKI PER MECZ</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={perMatchData} margin={{top: 0, right: 0, bottom: 0, left: -20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
              <XAxis dataKey="match" tick={{fill: "#334155", fontSize: 8}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
              <Tooltip
                content={({active, payload, label}) => {
                  if (!active || !payload?.length) return null;
                  const d = perMatchData.find((x) => x.match === label);
                  return (
                    <div style={{
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 11
                    }}>
                      <div style={{color: "#94a3b8", marginBottom: 4}}>{d?.opp}</div>
                      {payload.map((p) => (
                        <div key={p.name} style={{color: p.color}}>{p.name}: {p.value}</div>
                      ))}
                    </div>
                  );
                }}
                cursor={{fill: "rgba(255,255,255,0.03)"}}
              />
              <Bar dataKey="zdobyte" name="Zdobyte" fill="#3b82f6" radius={[3, 3, 0, 0]}/>
              <Bar dataKey="stracone" name="Stracone" fill="rgba(239,68,68,0.5)" radius={[3, 3, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 5. ATAK VS OBRONA WG MINUT ── */}
        <div style={{...CARD, marginBottom: 12}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4}}>
            <div style={SECTION_LABEL}>ATAK VS OBRONA — MINUTY MECZU</div>
            <div style={{display: "flex", gap: 14, marginBottom: 16}}>
              {[{c: "#3b82f6", l: "Zdobyte"}, {c: "#ef4444", l: "Stracone"}].map((i) => (
                <div key={i.l} style={{display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#334155"}}>
                  <div style={{width: 8, height: 8, borderRadius: 2, background: i.c}}/>
                  {i.l}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={Object.keys(s.goalsByMinute).map((band) => ({
                band,
                zdobyte: (s.goalsByMinute)[band],
                stracone: (s.concededByMinute)[band] ?? 0,
              }))}
              margin={{top: 0, right: 0, bottom: 0, left: -20}}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
              <XAxis dataKey="band" tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>} cursor={{fill: "rgba(255,255,255,0.03)"}}/>
              <Bar dataKey="zdobyte" name="Zdobyte" fill="#3b82f6" radius={[3, 3, 0, 0]}/>
              <Bar dataKey="stracone" name="Stracone" fill="rgba(239,68,68,0.6)" radius={[3, 3, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 6. FORMA MIESIĘCZNA + HT/FT ── */}
        <div className="stats-grid-2" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>

          {/* Forma miesięczna */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>FORMA MIESIĘCZNA</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={(() => {
                  const ORDER = ["sierpień", "wrzesień", "październik", "listopad", "grudzień", "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec"];
                  return ORDER
                    .filter((m) => (s.byMonth)[m])
                    .map((m) => ({month: m.slice(0, 3).toUpperCase(), ...(s.byMonth)[m]}));
                })()}
                margin={{top: 0, right: 0, bottom: 0, left: -25}}
              >
                <XAxis dataKey="month" tick={{fill: "#475569", fontSize: 9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill: "#334155", fontSize: 9}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>} cursor={{fill: "rgba(255,255,255,0.03)"}}/>
                <Bar dataKey="W" name="Wygrane" fill="#22c55e" radius={[2, 2, 0, 0]} stackId="m"/>
                <Bar dataKey="D" name="Remisy" fill="#475569" radius={[0, 0, 0, 0]} stackId="m"/>
                <Bar dataKey="L" name="Porażki" fill="#ef4444" radius={[0, 0, 2, 2]} stackId="m"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* HT/FT matrix */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>WYNIK NA PRZERWIE → KOŃCOWY</div>
            <div style={{display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 6, alignItems: "center"}}>
              {/* header */}
              <div/>
              {["Wygrana", "Remis", "Porażka"].map((h) => (
                <div key={h} style={{
                  fontSize: 9,
                  color: "#334155",
                  textAlign: "center",
                  fontWeight: 700,
                  letterSpacing: "0.1em"
                }}>{h}</div>
              ))}
              {/* rows */}
              {[
                {label: "Prowadzili", ht: "W", color: "#22c55e"},
                {label: "Remis", ht: "D", color: "#94a3b8"},
                {label: "Przegrywali", ht: "L", color: "#ef4444"},
              ].map((row) => (
                <>
                  <div key={row.label}
                       style={{fontSize: 10, color: row.color, fontWeight: 600, whiteSpace: "nowrap"}}>{row.label}</div>
                  {["W", "D", "L"].map((ft) => {
                    const key = row.ht + ft
                    s.htFt;
                    const val = (s.htFt)[key] ?? 0;
                    const bg = val > 0
                      ? ft === "W" ? `rgba(34,197,94,${Math.min(0.1 + val * 0.15, 0.7)})`
                        : ft === "L" ? `rgba(239,68,68,${Math.min(0.1 + val * 0.15, 0.7)})`
                          : `rgba(148,163,184,${Math.min(0.1 + val * 0.15, 0.5)})`
                      : "rgba(255,255,255,0.02)";
                    return (
                      <div key={ft} style={{
                        background: bg,
                        borderRadius: 8,
                        padding: "10px 4px",
                        textAlign: "center",
                        fontSize: val > 0 ? 18 : 12,
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        color: val > 0 ? "#fff" : "#1e293b",
                      }}>
                        {val > 0 ? val : "—"}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div style={{fontSize: 10, color: "#1e293b", marginTop: 12}}>
              Prowadzą do przerwy → wygrywają w 92% przypadków
            </div>
          </div>
        </div>

        {/* ── 7. WYNIKI + MULTI-GOAL ── */}
        <div className="stats-grid-2" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>

          {/* Najczęstsze wyniki */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>NAJCZĘSTSZE WYNIKI</div>
            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
              {(s.scorelines).slice(0, 6).map((sl, i) => (
                <div key={sl.score} style={{display: "flex", alignItems: "center", gap: 10}}>
                  <div style={{
                    width: 56,
                    textAlign: "center",
                    fontFamily: "'Bebas Neue', Impact, sans-serif",
                    fontSize: 20,
                    color: i === 0 ? "#3b82f6" : "#fff"
                  }}>
                    {sl.score}
                  </div>
                  <div style={{
                    flex: 1,
                    height: 4,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(sl.count / (s.scorelines)[0].count) * 100}%`,
                      background: i === 0 ? "#3b82f6" : "rgba(59,130,246,0.3)",
                      borderRadius: 2
                    }}/>
                  </div>
                  <div style={{fontSize: 12, color: "#475569", fontWeight: 700, width: 24, textAlign: "right"}}>
                    ×{sl.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-goal + ciekawostki */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>ZAWODNICY Z 2+ GOLAMI W MECZU</div>
            <div style={{display: "flex", flexDirection: "column", gap: 10}}>
              {(s.multiGoalGames).map((p, i) => (
                <div key={p.name}>
                  <div style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
                    <span style={{fontSize: 13, color: i === 0 ? "#fff" : "#64748b"}}>{p.name}</span>
                    <span style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      fontSize: 18,
                      color: i === 0 ? "#3b82f6" : "#475569"
                    }}>
 {p.count}×
 </span>
                  </div>
                  <div style={{height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden"}}>
                    <div style={{
                      height: "100%",
                      width: `${(p.count / (s.multiGoalGames)[0].count) * 100}%`,
                      background: i === 0 ? "#3b82f6" : "rgba(59,130,246,0.3)",
                      borderRadius: 2
                    }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)"}}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#334155",
                marginBottom: 8
              }}>CIEKAWOSTKA
              </div>
              <div style={{fontSize: 12, color: "#475569", lineHeight: 1.6}}>
                Jędrasik zdobył 2+ gole w{" "}
                <span
                  style={{color: "#3b82f6", fontWeight: 700}}>{(s.multiGoalGames)[0]?.count} z {s.total} meczów</span>
                {" "}— to{" "}
                <span style={{color: "#fff"}}>
 {Math.round(((s.multiGoalGames)[0]?.count / s.total) * 100)}%
 </span>{" "}
                wszystkich spotkań sezonu.
              </div>
            </div>
          </div>
        </div>

        {/* ── 9. REKORDY ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 12
        }}>
          {[
            {lbl: "SERIA BEZ PORAŻKI", val: s.unbeatenStreak, sub: `od ${s.unbeatenSince}`, green: true},
            {lbl: "SERIA ZWYCIĘSTW", val: s.longestWinStreak, sub: "najdłuższa w sezonie", green: false},
            {lbl: "CZYSTE KONTA", val: s.cleanSheets, sub: `z ${s.total} meczów`, green: false},
            {lbl: "NAJWIĘKSZA WYGRANA", val: s.biggestWin.score, sub: s.biggestWin.opponent, green: false},
            {lbl: "JEDYNA PORAŻKA", val: s.biggestLoss.score, sub: s.biggestLoss.opponent, green: false},
            {lbl: "REKORD BRAMEK", val: s.mostGoalsMatch.score, sub: s.mostGoalsMatch.opponent, green: false},
          ].map((h) => (
            <div key={h.lbl} style={{
              background: h.green ? "rgba(34,197,94,0.06)" : "#0f172a",
              border: h.green ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "16px",
            }}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: h.green ? "#22c55e" : "#334155",
                marginBottom: 8
              }}>
                {h.lbl}
              </div>
              <div style={{...BIG, fontSize: 30, color: h.green ? "#22c55e" : "#fff"}}>{h.val}</div>
              <div style={{
                fontSize: 10,
                color: "#334155",
                marginTop: 5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {h.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── 10. EFEKTYWNOŚĆ + DYSCYPLINA ── */}
        <div className="stats-grid-3" style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 32}}>
          <div style={CARD}>
            <div style={SECTION_LABEL}>GDY STRZELAMY PIERWSI</div>
            <div style={{...BIG, fontSize: 44, color: "#fff"}}>{s.scoredFirstWinPct}%</div>
            <div style={{fontSize: 11, color: "#334155", marginBottom: 12}}>wygranych po 1. golu
              ({s.scoredFirstWins}/{s.scoredFirstCount})
            </div>
            <div style={{height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden"}}>
              <div style={{height: "100%", width: `${s.scoredFirstWinPct}%`, background: "#3b82f6", borderRadius: 2}}/>
            </div>
          </div>

          <div style={CARD}>
            <div style={SECTION_LABEL}>ODRABIANIE STRAT</div>
            <div style={{...BIG, fontSize: 44, color: "#fff"}}>{s.comebacks}×</div>
            <div style={{fontSize: 11, color: "#334155", marginBottom: 12}}>przegrywali → odrobili</div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 4}}>
              {Array.from({length: s.comebacks}).map((_, i) => (
                <div key={i} style={{width: 10, height: 10, borderRadius: 3, background: "#22c55e"}}/>
              ))}
            </div>
          </div>

          <div style={CARD}>
            <div style={SECTION_LABEL}>DYSCYPLINA</div>
            <div style={{display: "flex", gap: 18, marginBottom: 12}}>
              <div>
                <div style={{...BIG, fontSize: 36, color: "#eab308"}}>{s.yellowCards}</div>
                <div style={{fontSize: 9, color: "#334155"}}>żółtych</div>
              </div>
              <div>
                <div style={{...BIG, fontSize: 36, color: "#ef4444"}}>{s.redCards}</div>
                <div style={{fontSize: 9, color: "#334155"}}>czerwonych</div>
              </div>
            </div>
            {(s.topCardedPlayers).slice(0, 3).map((p) => (
              <div key={p.name} style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#334155",
                marginTop: 4
              }}>
                <span style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 100
                }}>{p.name}</span>
                <span style={{color: "#eab308", fontWeight: 700, flexShrink: 0}}>{p.count}×</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DNA SEZONU ── */}
        <div style={{...CARD, marginBottom: 12}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16}}>
            <div>
              <div style={SECTION_LABEL}>DNA SEZONU</div>
              <div style={{fontSize: 11, color: "#334155"}}>Każda kropka to zdarzenie — gol lub kartka — w danej minucie
                meczu
              </div>
            </div>
            <div style={{display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end"}}>
              {[
                {c: "#3b82f6", l: "Gol Drawy"},
                {c: "#ef4444", l: "Gol rywala"},
                {c: "#eab308", l: "Żółta kartka"},
              ].map((i) => (
                <div key={i.l} style={{display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#334155"}}>
                  <div style={{width: 7, height: 7, borderRadius: "50%", background: i.c}}/>
                  {i.l}
                </div>
              ))}
            </div>
          </div>

          {/* minute ruler */}

          <div style={{display: "flex", flexDirection: "column", gap: 3}}>
            {dnaMatches.map((match, mi) => (
              <div key={mi} style={{display: "flex", alignItems: "center", gap: 8}}>
                {/* label */}
                <div style={{width: 104, flexShrink: 0, display: "flex", gap: 6, alignItems: "center"}}>
 <span style={{
   width: 18, height: 18, borderRadius: 4, flexShrink: 0,
   background: match.result === "W" ? "rgba(34,197,94,0.15)" : match.result === "L" ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.1)",
   border: `1px solid ${match.result === "W" ? "rgba(34,197,94,0.4)" : match.result === "L" ? "rgba(239,68,68,0.4)" : "rgba(148,163,184,0.2)"}`,
   color: match.result === "W" ? "#22c55e" : match.result === "L" ? "#ef4444" : "#94a3b8",
   fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
 }}>{match.score}</span>
                  <span style={{
                    fontSize: 9,
                    color: "#334155",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>{match.opp}</span>
                </div>
                {/* timeline */}
                <div style={{
                  flex: 1,
                  height: 18,
                  position: "relative",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 4
                }}>
                  {/* half-time line */}
                  <div style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "rgba(255,255,255,0.04)"
                  }}/>
                  {match.events.map((e, ei) => {
                    const isGoal = e.type === "gol" || e.type === "samobój";
                    const isYellow = e.type === "żółta kartka";
                    const isRed = e.type === "czerwona kartka" || e.type === "czerwona kartka (drugi żółty)";
                    if (!isGoal && !isYellow && !isRed) return null;
                    const color = isGoal
                      ? (e.isDrawa ? "#3b82f6" : "#ef4444")
                      : isYellow ? "#eab308" : "#ef4444";
                    const size = isGoal ? 8 : 5;
                    return (
                      <div
                        key={ei}
                        style={{
                          position: "absolute",
                          left: `${((e.min - 1) / 89) * 100}%`,
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: size,
                          height: size,
                          borderRadius: isYellow ? 1 : "50%",
                          background: color,
                          boxShadow: isGoal && e.isDrawa ? `0 0 6px ${color}` : "none",
                          zIndex: isGoal ? 2 : 1,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* minute labels at bottom */}
          <div style={{paddingLeft: 112, marginTop: 4}}>
            <div style={{position: "relative", height: 12}}>
              {[1, 15, 30, 45, 60, 75, 90].map((m) => (
                <span key={m} style={{
                  position: "absolute",
                  left: `${((m - 1) / 89) * 100}%`,
                  fontSize: 8,
                  color: "#334155",
                  transform: "translateX(-50%)"
                }}>{m}'</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── PORTRET DRUŻYNY ── */}
        <div style={{...CARD, marginBottom: 12}}>
          <div style={{marginBottom: 16}}>
            <div style={SECTION_LABEL}>PORTRET DRUŻYNY — KTO GRAŁ KIEDY</div>
            <div style={{fontSize: 11, color: "#334155"}}>
              Każda komórka = mecz (od najstarszego do najnowszego). Najedź kursorem po szczegóły.
            </div>
          </div>

          <div style={{overflowX: "auto"}}>
            <div style={{minWidth: allLigaMecze.length * 28 + 160, fontSize: 9}}>
              {/* header row */}
              <div style={{display: "flex", marginBottom: 4, paddingLeft: 160}}>
                {matchMetaList.map((meta, i) => (
                  <div
                    key={i}
                    title={`Kolejka ${meta.round}: ${meta.opp} (${meta.score}) — ${meta.date}${meta.walkower ? " [Walkower]" : ""}`}
                    style={{
                      width: 28, flexShrink: 0, textAlign: "center",
                      color: meta.walkower ? "#eab308" : meta.result === "W" ? "#22c55e" : meta.result === "L" ? "#ef4444" : "#94a3b8",
                      fontSize: 8, overflow: "hidden", whiteSpace: "nowrap", cursor: "default",
                    }}
                  >
                    {meta.walkower ? "WO" : `K${meta.round}`}
                  </div>
                ))}
              </div>

              {/* player rows */}
              {sortedSquad.map(({name, apps, matches}) => (
                <div key={name} style={{display: "flex", alignItems: "center", marginBottom: 3}}>
                  <div style={{
                    width: 160,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingRight: 10
                  }}>
 <span style={{
   fontSize: 11,
   color: apps >= 14 ? "#94a3b8" : "#334155",
   overflow: "hidden",
   textOverflow: "ellipsis",
   whiteSpace: "nowrap"
 }}>
 {name}
 </span>
                    <span style={{fontSize: 9, color: "#1e293b", flexShrink: 0}}>{apps}</span>
                  </div>
                  {matches.map((val, mi) => {
                    const meta = matchMetaList[mi];
                    const isWo = meta?.walkower;
                    const played = val !== null;
                    const goals = (val ?? 0);

                    let bg;
                    let cellText = "";
                    let textColor = "transparent";

                    if (isWo) {
                      bg = "rgba(234,179,8,0.07)";
                      cellText = "WO";
                      textColor = "rgba(234,179,8,0.45)";
                    } else if (!played) {
                      bg = "rgba(255,255,255,0.02)";
                    } else if (goals >= 3) {
                      bg = "#1d4ed8";
                      cellText = String(goals);
                      textColor = "#fff";
                    } else if (goals === 2) {
                      bg = "#2563eb";
                      cellText = "2";
                      textColor = "#fff";
                    } else if (goals === 1) {
                      bg = "#3b82f6";
                      cellText = "1";
                      textColor = "#fff";
                    } else {
                      bg = "rgba(59,130,246,0.2)";
                    }

                    let tooltip = "";
                    if (meta) {
                      const header = `K${meta.round}: ${meta.opp} (${meta.score}) — ${meta.date}`;
                      const detail = isWo
                        ? "Walkower"
                        : played
                          ? goals > 0
                            ? `Strzelił ${goals} ${goals === 1 ? "gola" : goals < 5 ? "gole" : "goli"}`
                            : "Grał"
                          : "Nieobecny";
                      tooltip = `${header}\n${detail}`;
                    }

                    return (
                      <div
                        key={mi}
                        title={tooltip}
                        style={{
                          width: 24, height: 20, flexShrink: 0, margin: "0 2px",
                          borderRadius: 3,
                          background: bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: isWo ? 6 : 8,
                          color: textColor,
                          fontWeight: 700,
                          cursor: "default",
                        }}
                      >
                        {cellText}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: "flex",
            gap: 14,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            {[
              {c: "rgba(59,130,246,0.2)", l: "Grał"},
              {c: "#3b82f6", l: "Strzelił 1"},
              {c: "#2563eb", l: "Strzelił 2"},
              {c: "#1d4ed8", l: "Strzelił 3+"},
            ].map((item) => (
              <div key={item.l} style={{display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#334155"}}>
                <div style={{width: 12, height: 12, borderRadius: 2, background: item.c}}/>
                {item.l}
              </div>
            ))}
            <div style={{display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#334155"}}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "rgba(234,179,8,0.07)",
                border: "1px solid rgba(234,179,8,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 5,
                color: "rgba(234,179,8,0.6)",
                fontWeight: 700
              }}>WO
              </div>
              Walkower
            </div>
          </div>
        </div>

        {/* ── KIEDY MECZ BYŁ ROZSTRZYGNIĘTY ── */}
        <div style={{...CARD, marginBottom: 12}}>
          <div style={{marginBottom: 20}}>
            <div style={SECTION_LABEL}>KIEDY MECZ BYŁ JUŻ ROZSTRZYGNIĘTY</div>
            <div style={{fontSize: 11, color: "#334155"}}>Minuta, w której Drawa objęła prowadzenie i już go nie oddała
              — w każdym z 16 wygranych meczów
            </div>
          </div>

          {/* timeline */}
          <div style={{position: "relative", paddingBottom: 32, paddingTop: 8}}>
            {/* axis */}
            <div style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 32,
              height: 2,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 1
            }}/>

            {/* minute markers */}
            {[1, 15, 30, 45, 60, 75, 90].map((m) => (
              <div key={m} style={{
                position: "absolute",
                left: `${((m - 1) / 89) * 100}%`,
                bottom: 20,
                transform: "translateX(-50%)",
                textAlign: "center"
              }}>
                <div style={{width: 1, height: 8, background: "rgba(255,255,255,0.08)", margin: "0 auto"}}/>
                <div style={{fontSize: 8, color: "#334155", marginTop: 2}}>{m}'</div>
              </div>
            ))}

            {/* half-time zone */}
            <div style={{
              position: "absolute",
              left: `${((45 - 1) / 89) * 100}%`, right: `${100 - ((46 - 1) / 89) * 100}%`,
              bottom: 22, top: 0,
              background: "rgba(255,255,255,0.02)",
              borderLeft: "1px dashed rgba(255,255,255,0.06)",
            }}/>

            {/* bubbles */}
            {decisiveMoments.map((d, i) => {
              const x = ((d.min - 1) / 89) * 100;
              const size = Math.min(12 + d.margin * 5, 52);
              const earlyColor = d.min <= 20 ? "#22c55e" : d.min <= 45 ? "#3b82f6" : d.min <= 70 ? "#6366f1" : "#f59e0b";
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    bottom: 30,
                    transform: "translateX(-50%)",
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, ${earlyColor}, ${earlyColor}88)`,
                    border: `1px solid ${earlyColor}66`,
                    boxShadow: `0 0 12px ${earlyColor}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "default",
                    zIndex: 2,
                  }}
                  title={`${d.opp} (${d.score}) — ${d.min}'`}
                >
 <span style={{fontSize: Math.max(7, size / 4.5), fontFamily: "'Bebas Neue', Impact", color: "#fff", lineHeight: 1}}>
 {d.min}'
 </span>
                </div>
              );
            })}
          </div>

          {/* stats below */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 8}}>
            {[
              {
                val: `${decisiveMoments.filter(d => d.min <= 30).length}`,
                label: "decydujący gol przed 30'",
                sub: `z ${decisiveMoments.length} wygranych`,
              },
              {
                val: `${Math.round(decisiveMoments.reduce((a, d) => a + d.min, 0) / decisiveMoments.length)}'`,
                label: "śr. minuta rozstrzygnięcia",
                sub: "w wygranych meczach",
              },
              {
                val: `${decisiveMoments.filter(d => d.min >= 70).length}`,
                label: "wygranych z golu po 70'",
                sub: "późne bohaterstwo",
              },
            ].map((stat) => (
              <div key={stat.label} style={{
                textAlign: "center",
                padding: "12px 8px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8
              }}>
                <div style={{...BIG, fontSize: 26, color: "#fff"}}>{stat.val}</div>
                <div style={{fontSize: 10, color: "#475569", marginTop: 4}}>{stat.label}</div>
                <div style={{fontSize: 9, color: "#1e3a5f", marginTop: 2}}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 11. STRZELCY ── */}
        <div style={SECTION_LABEL}>STRZELCY (LIGA + PUCHAR ZZPN)</div>
        <ResponsiveContainer width="100%" height={strzelcy.length * 36}>
          <BarChart
            layout="vertical"
            data={strzelcy}
            margin={{top: 0, right: 40, bottom: 0, left: 0}}
          >
            <XAxis type="number" hide/>
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{fill: "#64748b", fontSize: 12}}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip/>} cursor={{fill: "rgba(255,255,255,0.03)"}}/>
            <Bar dataKey="gole" name="Gole" radius={[0, 4, 4, 0]} label={{
              position: "right",
              fill: "#475569",
              fontSize: 12,
              fontFamily: "'Bebas Neue', Impact, sans-serif"
            }}>
              {strzelcy.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#3b82f6" : i <= 2 ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.2)"}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

      </main>
    </>
  );
}
