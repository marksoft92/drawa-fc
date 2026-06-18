"use client";

import { useState, useEffect } from "react";

function fmtBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function pct(used, total) {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "16px 20px",
};
const labelStyle = { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };

function ProgressBar({ value, max, color = "#3b82f6", label }) {
  const p = pct(value, max);
  const barColor = p > 90 ? "#ef4444" : p > 70 ? "#f59e0b" : color;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "#94a3b8" }}>{label}</span>
        <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{fmtBytes(value)} / {fmtBytes(max)} ({p}%)</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, background: barColor, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function SerwerPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dumping, setDumping] = useState(false);

  useEffect(() => {
    fetch("/api/admin/server")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function downloadDump() {
    setDumping(true);
    try {
      const res = await fetch("/api/admin/server/dump");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drawa_fc_${new Date().toISOString().slice(0, 10)}.dump`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Błąd podczas tworzenia kopii zapasowej");
    }
    setDumping(false);
  }

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Ładowanie...</div>;
  if (!data) return <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Błąd ładowania danych serwera</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em", marginBottom: 20 }}>
        Serwer
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Uptime</div>
          <div style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>{data.uptime || "—"}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>CPU</div>
          <div style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>{data.cpuCount} vCPU</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Load: {data.loadavg?.map((l) => l.toFixed(2)).join(" / ") || "—"}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>RAM</div>
          <div style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>{fmtBytes(data.ram?.total)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Wolne: {fmtBytes(data.ram?.available)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Baza danych</div>
          <div style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>{fmtBytes(data.dbSize)}</div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={labelStyle}>Zasoby</div>
        <ProgressBar value={data.ram?.used} max={data.ram?.total} label="RAM" />
        <ProgressBar value={data.swap?.used} max={data.swap?.total} label="Swap" color="#8b5cf6" />
        <ProgressBar value={data.disk?.used} max={data.disk?.total} label="Dysk" color="#22c55e" />
      </div>

      {data.docker?.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={labelStyle}>Docker</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.docker.map((c) => (
              <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 13, color: "#cbd5e1" }}>{c.name}</span>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>RAM: <span style={{ color: "#fff", fontWeight: 600 }}>{c.mem}</span></span>
                  <span style={{ color: "#94a3b8" }}>CPU: <span style={{ color: "#fff", fontWeight: 600 }}>{c.cpu}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.dbTables?.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={labelStyle}>Tabele bazy danych</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.dbTables.map((t) => {
              const maxSize = data.dbTables[0]?.size || 1;
              const w = Math.max((t.size / maxSize) * 100, 2);
              return (
                <div key={t.name} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${w}%`, background: "rgba(59,130,246,0.08)", borderRadius: 4 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", position: "relative", zIndex: 1 }}>
                    <span style={{ fontSize: 13, color: "#cbd5e1" }}>{t.name}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{fmtBytes(t.size)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ ...cardStyle }}>
        <div style={labelStyle}>Kopia zapasowa</div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
          Pobierz pełny dump bazy danych PostgreSQL (.dump). Przywracanie: <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>pg_restore -U drawa -d drawa_fc plik.dump</code>
        </p>
        <button
          onClick={downloadDump}
          disabled={dumping}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: dumping ? "wait" : "pointer",
            background: dumping ? "#1e293b" : "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {dumping ? "Generowanie..." : "Pobierz backup bazy"}
        </button>
      </div>
    </div>
  );
}
