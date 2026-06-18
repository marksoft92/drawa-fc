"use client";

import { useState, useEffect, useCallback } from "react";

const RANGES = [
  { label: "Dziś", value: "today" },
  { label: "7 dni", value: "7d" },
  { label: "30 dni", value: "30d" },
  { label: "90 dni", value: "90d" },
];

function getRange(value) {
  const now = new Date();
  const endAt = now.getTime();
  let startAt;
  let unit = "day";
  if (value === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    startAt = start.getTime();
    unit = "hour";
  } else {
    const days = parseInt(value);
    startAt = endAt - days * 24 * 60 * 60 * 1000;
  }
  return { startAt, endAt, unit };
}

function fmt(n) {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1000) return n.toLocaleString("pl-PL");
  return String(n);
}

function fmtTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0s";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

const COUNTRY_NAMES = {
  PL: "Polska", DE: "Niemcy", US: "USA", GB: "Wlk. Brytania", UA: "Ukraina",
  NL: "Holandia", FR: "Francja", CZ: "Czechy", SE: "Szwecja", NO: "Norwegia",
};

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "16px 20px",
};

const labelStyle = { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 };
const valueStyle = { fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.02em" };

function StatCard({ label, value, sub }) {
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MiniChart({ data, height = 80 }) {
  if (!data || data.length === 0) return <div style={{ color: "#334155", fontSize: 13, padding: 20, textAlign: "center" }}>Brak danych</div>;
  const max = Math.max(...data.map((d) => d.y), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height, width: "100%" }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max((d.y / max) * 100, 2)}%`,
            background: "linear-gradient(to top, #1e40af, #3b82f6)",
            borderRadius: "3px 3px 0 0",
            minWidth: 2,
            cursor: "default",
          }}
          title={`${d.x}: ${d.y} odsłon`}
        />
      ))}
    </div>
  );
}

function MetricTable({ data, title, formatLabel }) {
  if (!data || data.length === 0) return (
    <div style={cardStyle}>
      <div style={{ ...labelStyle, marginBottom: 12 }}>{title}</div>
      <div style={{ color: "#334155", fontSize: 13 }}>Brak danych</div>
    </div>
  );
  const maxVal = data[0]?.y || 1;
  return (
    <div style={cardStyle}>
      <div style={{ ...labelStyle, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.map((row, i) => {
          const pct = (row.y / maxVal) * 100;
          const label = formatLabel ? formatLabel(row.x) : (row.x || "(brak)");
          return (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                position: "absolute", top: 0, left: 0, bottom: 0,
                width: `${pct}%`, background: "rgba(59,130,246,0.08)",
                borderRadius: 4,
              }} />
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 10px", position: "relative", zIndex: 1,
              }}>
                <span style={{ fontSize: 13, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                  {row.y}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalitykaPanel() {
  const [range, setRange] = useState("7d");
  const [stats, setStats] = useState(null);
  const [pageviews, setPageviews] = useState(null);
  const [pages, setPages] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [os, setOs] = useState([]);
  const [countries, setCountries] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startAt, endAt, unit } = getRange(range);
    const base = `startAt=${startAt}&endAt=${endAt}&timezone=Europe/Warsaw`;

    try {
      const [statsRes, pvRes, pagesRes, refRes, brRes, devRes, osRes, countryRes, activeRes] = await Promise.all([
        fetch(`/api/admin/analytics?type=stats&${base}`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=pageviews&${base}&unit=${unit}`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=path&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=referrer&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=browser&${base}&limit=5`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=device&${base}&limit=5`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=os&${base}&limit=5`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=country&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=active`).then((r) => r.json()),
      ]);
      setStats(statsRes);
      setPageviews(pvRes);
      setPages(Array.isArray(pagesRes) ? pagesRes : []);
      setReferrers(Array.isArray(refRes) ? refRes : []);
      setBrowsers(Array.isArray(brRes) ? brRes : []);
      setDevices(Array.isArray(devRes) ? devRes : []);
      setOs(Array.isArray(osRes) ? osRes : []);
      setCountries(Array.isArray(countryRes) ? countryRes : []);
      setActive(activeRes?.visitors || 0);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/analytics?type=active");
        const data = await res.json();
        setActive(data?.visitors || 0);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const avgTime = stats && stats.pageviews > 0 ? stats.totaltime / stats.pageviews : 0;
  const bounceRate = stats && stats.visits > 0 ? Math.round((stats.bounces / stats.visits) * 100) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em" }}>
            Analityka
          </h1>
          {active > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#22c55e", fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              {active} online
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, background: "#0f172a", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: range === r.value ? "#1e293b" : "transparent",
                color: range === r.value ? "#fff" : "#64748b",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Ładowanie...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
            <StatCard label="Odsłony" value={fmt(stats?.pageviews)} />
            <StatCard label="Odwiedziny" value={fmt(stats?.visits)} />
            <StatCard label="Unikalni" value={fmt(stats?.visitors)} />
            <StatCard label="Śr. czas" value={fmtTime(avgTime)} />
            <StatCard label="Bounce rate" value={`${bounceRate}%`} />
          </div>

          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Odsłony w czasie</div>
            <MiniChart data={pageviews?.pageviews} height={80} />
            {pageviews?.pageviews?.length > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#475569" }}>
                  {new Date(pageviews.pageviews[0].x).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                </span>
                <span style={{ fontSize: 10, color: "#475569" }}>
                  {new Date(pageviews.pageviews.at(-1).x).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
            <MetricTable data={pages} title="Najpopularniejsze strony" />
            <MetricTable data={referrers} title="Źródła ruchu" formatLabel={(v) => v || "(wejście bezpośrednie)"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <MetricTable data={browsers} title="Przeglądarki" />
            <MetricTable data={devices} title="Urządzenia" formatLabel={(v) => v === "mobile" ? "Telefon" : v === "laptop" ? "Komputer" : v === "tablet" ? "Tablet" : v} />
            <MetricTable data={os} title="System operacyjny" />
            <MetricTable data={countries} title="Kraje" formatLabel={(v) => COUNTRY_NAMES[v] || v} />
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
