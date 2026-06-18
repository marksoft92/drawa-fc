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

const REFERRER_LABELS = {
  "facebook.com": "Facebook",
  "lm.facebook.com": "Facebook (mobile)",
  "l.facebook.com": "Facebook (link)",
  "m.facebook.com": "Facebook (mobile)",
  "google.com": "Google",
  "google.pl": "Google.pl",
  "instagram.com": "Instagram",
  "t.co": "Twitter/X",
};

function SessionRow({ session }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loadingAct, setLoadingAct] = useState(false);

  const deviceLabel = session.device === "mobile" ? "Telefon" : session.device === "laptop" ? "Komputer" : session.device === "tablet" ? "Tablet" : session.device || "—";
  const city = session.city || "—";
  const country = COUNTRY_NAMES[session.country] || session.country || "";
  const location = city !== "—" && country ? `${city}, ${country}` : city !== "—" ? city : country || "—";
  const time = new Date(session.firstAt).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const duration = session.lastAt && session.firstAt
    ? Math.round((new Date(session.lastAt) - new Date(session.firstAt)) / 1000)
    : 0;

  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (activity) return;
    setLoadingAct(true);
    try {
      const { startAt, endAt } = getRange("90d");
      const res = await fetch(`/api/admin/analytics?type=session-activity&sessionId=${session.id}&startAt=${startAt}&endAt=${endAt}`);
      const data = await res.json();
      setActivity(Array.isArray(data) ? data : []);
    } catch { setActivity([]); }
    setLoadingAct(false);
  }

  return (
    <>
      <tr onClick={toggle} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.15s" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <td style={{ padding: "8px 10px", color: "#cbd5e1", whiteSpace: "nowrap" }}>
          <span style={{ marginRight: 6, fontSize: 10, color: "#475569" }}>{open ? "▼" : "▶"}</span>
          {location}
        </td>
        <td style={{ padding: "8px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{session.browser || "—"}</td>
        <td style={{ padding: "8px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{deviceLabel}</td>
        <td style={{ padding: "8px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{session.os || "—"}</td>
        <td style={{ padding: "8px 10px", color: "#fff", fontWeight: 600, textAlign: "center" }}>{session.views}</td>
        <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{fmtTime(duration)}</td>
        <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>{time}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{ background: "rgba(15,23,42,0.6)", padding: "10px 16px 10px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {loadingAct ? (
                <div style={{ color: "#475569", fontSize: 12 }}>Ładowanie...</div>
              ) : activity && activity.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Ścieżka na stronie</div>
                  {activity.filter((a) => a.eventType === 1).reverse().map((a, i) => {
                    const t = new Date(a.createdAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    const ref = a.referrerDomain && a.referrerDomain !== "mksdrawadrawno.pl"
                      ? REFERRER_LABELS[a.referrerDomain] || a.referrerDomain
                      : null;
                    return (
                      <div key={a.eventId || i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ color: "#334155", flexShrink: 0 }}>{t}</span>
                        <span style={{ color: "#3b82f6" }}>{a.urlPath}</span>
                        {ref && <span style={{ color: "#f59e0b", fontSize: 11 }}>z {ref}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: "#475569", fontSize: 12 }}>Brak szczegółów</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SessionsTable({ sessions, range }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 16, overflowX: "auto" }}>
      <div style={{ ...labelStyle, marginBottom: 12 }}>Ostatni odwiedzający <span style={{ color: "#334155", fontWeight: 400 }}>— kliknij aby rozwinąć</span></div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Lokalizacja", "Przeglądarka", "Urządzenie", "System", "Odsłony", "Czas na stronie", "Data"].map((h) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.slice(0, 25).map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveVisitorRow({ visitor, events }) {
  const [open, setOpen] = useState(false);
  const deviceIcon = visitor.device === "mobile" ? "📱" : visitor.device === "tablet" ? "📟" : "💻";
  const deviceLabel = visitor.device === "mobile" ? "Telefon" : visitor.device === "laptop" ? "Komputer" : visitor.device === "tablet" ? "Tablet" : visitor.device || "—";
  const city = visitor.city || null;
  const country = visitor.country ? (COUNTRY_NAMES[visitor.country] || visitor.country) : null;
  const loc = city && country ? `${city}, ${country}` : city || country || "—";
  const lastPage = events[0]?.urlPath || "—";
  const firstRef = events.find((e) => e.referrerDomain && e.referrerDomain !== "mksdrawadrawno.pl");
  const source = firstRef ? (REFERRER_LABELS[firstRef.referrerDomain] || firstRef.referrerDomain) : "bezpośrednio";

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <span style={{ fontSize: 16, flexShrink: 0 }}>{deviceIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>
            {loc} <span style={{ color: "#64748b", fontWeight: 400 }}>· {visitor.browser || "?"} · {visitor.os || "?"}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
            Ogląda: <span style={{ color: "#3b82f6" }}>{lastPage}</span>
            {source !== "bezpośrednio" && <span style={{ color: "#f59e0b" }}> · z {source}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{events.length} {events.length === 1 ? "strona" : "stron"}</div>
        </div>
        <span style={{ fontSize: 10, color: "#475569", flexShrink: 0 }}>{open ? "▼" : "▶"}</span>
      </div>
      {open && (
        <div style={{ background: "rgba(15,23,42,0.5)", padding: "10px 16px 10px 44px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 12, marginBottom: 10 }}>
            <div><span style={{ color: "#475569" }}>Przeglądarka:</span> <span style={{ color: "#cbd5e1" }}>{visitor.browser || "—"}</span></div>
            <div><span style={{ color: "#475569" }}>System:</span> <span style={{ color: "#cbd5e1" }}>{visitor.os || "—"}</span></div>
            <div><span style={{ color: "#475569" }}>Urządzenie:</span> <span style={{ color: "#cbd5e1" }}>{deviceLabel}</span></div>
            <div><span style={{ color: "#475569" }}>Ekran:</span> <span style={{ color: "#cbd5e1" }}>{visitor.screen || "—"}</span></div>
            <div><span style={{ color: "#475569" }}>Lokalizacja:</span> <span style={{ color: "#cbd5e1" }}>{loc}</span></div>
            <div><span style={{ color: "#475569" }}>Język:</span> <span style={{ color: "#cbd5e1" }}>{visitor.language || "—"}</span></div>
            <div><span style={{ color: "#475569" }}>Źródło:</span> <span style={{ color: "#cbd5e1" }}>{source}</span></div>
            <div><span style={{ color: "#475569" }}>Kraj:</span> <span style={{ color: "#cbd5e1" }}>{country || "—"}</span></div>
          </div>
          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Ścieżka na stronie</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {events.map((e, i) => {
              const t = new Date(e.createdAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              const ref = e.referrerDomain && e.referrerDomain !== "mksdrawadrawno.pl"
                ? (REFERRER_LABELS[e.referrerDomain] || e.referrerDomain) : null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#334155", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{t}</span>
                  <span style={{ color: i === 0 ? "#22c55e" : "#3b82f6" }}>{e.urlPath}</span>
                  {ref && <span style={{ color: "#f59e0b", fontSize: 11 }}>z {ref}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function LivePanel({ realtime, active, liveSessions }) {
  if (!realtime && active === 0) return null;

  const rtEvents = realtime?.events || [];
  const sessionEvents = {};
  const sessionInfo = {};

  for (const e of rtEvents) {
    const sid = e.sessionId;
    if (e.__type === "session") {
      sessionInfo[sid] = { ...sessionInfo[sid], ...e };
    } else if (e.__type === "pageview") {
      if (!sessionEvents[sid]) sessionEvents[sid] = [];
      sessionEvents[sid].push(e);
    }
  }

  for (const s of (liveSessions || [])) {
    if (sessionInfo[s.id]) {
      sessionInfo[s.id] = { ...sessionInfo[s.id], city: s.city, screen: s.screen, language: s.language, region: s.region };
    } else {
      sessionInfo[s.id] = { ...s, sessionId: s.id };
    }
  }

  const visitorIds = Object.keys(sessionInfo);
  if (active === 0 && visitorIds.length === 0) return null;

  return (
    <div style={{ ...cardStyle, marginBottom: 20, borderColor: "rgba(34,197,94,0.15)", padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Na żywo — {active} {active === 1 ? "osoba" : active < 5 ? "osoby" : "osób"}
        </span>
        <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>co 10s · kliknij aby rozwinąć</span>
      </div>
      {visitorIds.length > 0 ? (
        visitorIds.map((sid) => (
          <LiveVisitorRow
            key={sid}
            visitor={sessionInfo[sid]}
            events={(sessionEvents[sid] || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))}
          />
        ))
      ) : (
        <div style={{ padding: "16px", color: "#334155", fontSize: 13 }}>Brak aktywnych sesji</div>
      )}
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
  const [cities, setCities] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(0);
  const [realtime, setRealtime] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startAt, endAt, unit } = getRange(range);
    const base = `startAt=${startAt}&endAt=${endAt}&timezone=Europe/Warsaw`;

    try {
      const [statsRes, pvRes, pagesRes, refRes, brRes, devRes, osRes, countryRes, cityRes, sessionsRes, activeRes] = await Promise.all([
        fetch(`/api/admin/analytics?type=stats&${base}`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=pageviews&${base}&unit=${unit}`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=path&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=referrer&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=browser&${base}&limit=5`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=device&${base}&limit=5`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=os&${base}&limit=5`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=country&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=metrics&metric=city&${base}&limit=10`).then((r) => r.json()),
        fetch(`/api/admin/analytics?type=sessions&${base}`).then((r) => r.json()),
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
      setCities(Array.isArray(cityRes) ? cityRes : []);
      setSessions(Array.isArray(sessionsRes?.data) ? sessionsRes.data : []);
      setActive(activeRes?.visitors || 0);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchRealtime = useCallback(async () => {
    try {
      const now = Date.now();
      const fiveMinAgo = now - 5 * 60 * 1000;
      const [activeRes, rtRes, liveRes] = await Promise.all([
        fetch("/api/admin/analytics?type=active").then((r) => r.json()),
        fetch("/api/admin/analytics?type=realtime").then((r) => r.json()),
        fetch(`/api/admin/analytics?type=sessions&startAt=${fiveMinAgo}&endAt=${now}`).then((r) => r.json()),
      ]);
      setActive(activeRes?.visitors || 0);
      setRealtime(rtRes);
      setLiveSessions(Array.isArray(liveRes?.data) ? liveRes.data : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

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

      <LivePanel realtime={realtime} active={active} liveSessions={liveSessions} />

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

          {sessions.length > 0 && (
            <SessionsTable sessions={sessions} range={range} />
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <MetricTable data={cities} title="Miasta" />
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
