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
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
  background: "#0a0f1a", color: "#fff", fontSize: 13, outline: "none",
};
const btnStyle = (active, color = "#2563eb") => ({
  padding: "9px 18px", borderRadius: 8, border: "none", cursor: active ? "pointer" : "wait",
  background: active ? color : "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.15s",
});

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
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/server").then((r) => r.json()),
      fetch("/api/admin/ustawienia").then((r) => r.json()),
    ]).then(([serverData, settings]) => {
      setData(serverData);
      setSmtpHost(settings.smtp_host || "smtp.gmail.com");
      setSmtpPort(settings.smtp_port || "465");
      setSmtpEmail(settings.smtp_email || "");
      setSmtpPassword(settings.smtp_password || "");
    }).catch(() => {}).finally(() => setLoading(false));
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

  async function saveSmtpSettings() {
    setSavingSmtp(true);
    setSmtpSaved(false);
    try {
      await fetch("/api/admin/ustawienia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_email: smtpEmail,
          smtp_password: smtpPassword,
        }),
      });
      setSmtpSaved(true);
      setTimeout(() => setSmtpSaved(false), 3000);
    } catch {}
    setSavingSmtp(false);
  }

  async function sendTestBackup() {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/server/backup-send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, msg: "Backup wysłany na " + smtpEmail });
      } else {
        setSendResult({ ok: false, msg: data.error || "Błąd wysyłki" });
      }
    } catch {
      setSendResult({ ok: false, msg: "Błąd połączenia" });
    }
    setSending(false);
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
          <div style={labelStyle}>Tabele bazy danych</div>
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

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={labelStyle}>Kopia zapasowa — pobieranie</div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
          Przywracanie: <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>pg_restore -U drawa -d drawa_fc plik.dump</code>
        </p>
        <button onClick={downloadDump} disabled={dumping} style={btnStyle(!dumping)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {dumping ? "Generowanie..." : "Pobierz backup bazy"}
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={labelStyle}>Konfiguracja SMTP</div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>
          Ustawienia poczty używane przez backup bazy i newsletter.
          Dla Gmaila potrzebujesz <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" style={{ color: "#3b82f6" }}>hasła aplikacji Google</a>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Host SMTP</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Port</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="465"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Adres email</label>
            <input
              type="email"
              value={smtpEmail}
              onChange={(e) => setSmtpEmail(e.target.value)}
              placeholder="drawadrawnomks@gmail.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Hasło aplikacji</label>
            <input
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={saveSmtpSettings} disabled={savingSmtp || !smtpEmail} style={btnStyle(!savingSmtp && !!smtpEmail, "#16a34a")}>
            {savingSmtp ? "Zapisywanie..." : "Zapisz SMTP"}
          </button>
          {smtpSaved && <span style={{ fontSize: 12, color: "#22c55e" }}>Zapisano</span>}
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={labelStyle}>Backup bazy na email</div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>
          Backup zostanie wysłany na adres z konfiguracji SMTP powyżej.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={sendTestBackup} disabled={sending || !smtpEmail || !smtpPassword} style={btnStyle(!sending && !!smtpEmail && !!smtpPassword)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            {sending ? "Wysyłanie..." : "Wyślij backup teraz"}
          </button>
          {sendResult && (
            <span style={{ fontSize: 12, color: sendResult.ok ? "#22c55e" : "#ef4444" }}>{sendResult.msg}</span>
          )}
        </div>
      </div>
    </div>
  );
}
