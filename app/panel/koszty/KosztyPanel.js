"use client";

import { useState, useEffect } from "react";

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "16px 20px",
};
const labelStyle = { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function fmtHours(h) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} h`;
  return `${hrs} h ${mins} min`;
}

export default function KosztyPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay] = useState(null);

  useEffect(() => {
    fetch("/api/admin/koszty")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Ładowanie...</div>;
  if (!data || data.error) return <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Błąd ładowania danych</div>;

  const devPct = data.totalCost > 0 ? Math.round((data.totalDevCost / data.totalCost) * 100) : 0;
  const serverPct = 100 - devPct;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em", marginBottom: 20 }}>
        Koszty produkcji
      </h1>

      <div style={{ ...cardStyle, marginBottom: 16, padding: "24px 28px", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
        <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Łączny koszt</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.02em" }}>
          {data.totalCost.toLocaleString("pl-PL")} zł
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginTop: 14, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${devPct}%`, background: "#3b82f6", transition: "width 0.3s" }} />
          <div style={{ width: `${serverPct}%`, background: "#8b5cf6", transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#3b82f6", marginRight: 4 }} />Development ({devPct}%)</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#8b5cf6", marginRight: 4 }} />Serwer ({serverPct}%)</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Development</div>
          <div style={{ fontSize: 20, color: "#3b82f6", fontWeight: 700 }}>{data.totalDevCost.toLocaleString("pl-PL")} zł</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{fmtHours(data.totalDevHours)} × {data.hourlyRate} zł/h</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Serwer VPS</div>
          <div style={{ fontSize: 20, color: "#8b5cf6", fontWeight: 700 }}>{data.totalServerCost.toLocaleString("pl-PL")} zł</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{data.serverMonths} mies. × {data.serverMonthly} zł</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Commitów</div>
          <div style={{ fontSize: 20, color: "#22c55e", fontWeight: 700 }}>{data.totalCommits}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{data.sessions.length} sesji pracy</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Okres</div>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, lineHeight: 1.4 }}>
            {fmtDate(data.firstCommit)}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>→ {fmtDate(data.lastCommit)}</div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={labelStyle}>Rozliczenie dzienne</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {data.dailyBreakdown.map((day) => {
            const maxCost = Math.max(...data.dailyBreakdown.map((d) => d.cost));
            const w = Math.max((day.cost / maxCost) * 100, 3);
            const isExpanded = expandedDay === day.date;
            const daySessions = data.sessions.filter((s) => s.date === day.date);

            return (
              <div key={day.date} style={{ position: "relative", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${w}%`, background: "rgba(59,130,246,0.08)", borderRadius: 4 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>
                      {new Date(day.date).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span style={{ fontSize: 11, color: "#475569" }}>{day.commits} zmian</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{fmtHours(day.hours)}</span>
                    <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 700, minWidth: 60, textAlign: "right" }}>{day.cost} zł</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...cardStyle, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
        <div style={labelStyle}>Metodologia</div>
        <p>Godziny pracy wyznaczane z historii commitów Git. Commity bliżej niż 2h = jedna sesja pracy + 15 min buforu z każdej strony. Minimum 30 min na sesję.</p>
        <p style={{ marginTop: 6 }}>Stawka: <strong style={{ color: "#94a3b8" }}>{data.hourlyRate} zł/h</strong> · Serwer VPS: <strong style={{ color: "#94a3b8" }}>{data.serverMonthly} zł/mies.</strong> od czerwca 2026</p>
      </div>
    </div>
  );
}
