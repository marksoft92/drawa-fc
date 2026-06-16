"use client";

import { useState } from "react";

const QUICK = [
  { label: "Trening dziś", title: "Trening dziś!", body: "Przypomnienie o treningu. Zapraszamy!" },
  { label: "Zmiana miejsca", title: "Zmiana miejsca treningu", body: "Uwaga! Trening odbywa się w innym miejscu niż zwykle." },
  { label: "Odwołany", title: "Trening odwołany", body: "Dzisiejszy trening został odwołany. Przepraszamy za utrudnienia." },
  { label: "Mecz jutro", title: "Mecz jutro!", body: "Przypominamy o jutrzejszym meczu. Powodzenia!" },
];

export default function PowiadomienieClient({ senderName }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { sent, total } or { error }

  function applyQuick(q) {
    setTitle(q.title);
    setBody(q.body);
    setResult(null);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || sending) return;
    setSending(true);
    setResult(null);
    try {
      const r = await fetch("/api/panel/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() }),
      });
      const d = await r.json();
      if (r.ok) setResult({ ok: true, sent: d.sent, total: d.total });
      else setResult({ ok: false, error: d.error });
    } catch {
      setResult({ ok: false, error: "Błąd połączenia" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          Powiadomienie
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Wyślij push do wszystkich graczy i sztabu</div>
      </div>

      {/* Szybkie szablony */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", marginBottom: 10 }}>SZYBKIE SZABLONY</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => applyQuick(q)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                color: "#3b82f6", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.18)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formularz */}
      <form onSubmit={handleSend} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Tytuł *</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setResult(null); }}
            placeholder="np. Trening dziś o 18:00"
            maxLength={80}
            style={inp}
            required
          />
          <div style={{ fontSize: 10, color: "#334155", marginTop: 4, textAlign: "right" }}>{title.length}/80</div>
        </div>

        <div>
          <label style={lbl}>Treść *</label>
          <textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); setResult(null); }}
            placeholder="Treść powiadomienia…"
            maxLength={200}
            rows={3}
            style={{ ...inp, resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
            required
          />
          <div style={{ fontSize: 10, color: "#334155", marginTop: 4, textAlign: "right" }}>{body.length}/200</div>
        </div>

        <div>
          <label style={lbl}>Link po kliknięciu (opcjonalny)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/panel/ankiety"
            style={inp}
          />
          <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Zostaw puste — otworzy główny panel</div>
        </div>

        {/* Podgląd */}
        {(title || body) && (
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>PODGLĄD POWIADOMIENIA</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <img src="/logo.png" alt="logo" width={32} height={32} style={{ borderRadius: 6, objectFit: "contain", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{title || "Tytuł…"}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 }}>{body || "Treść…"}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>MKS Drawa · {senderName}</div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !title.trim() || !body.trim()}
          style={{
            padding: "12px 20px", background: sending || !title.trim() || !body.trim() ? "rgba(59,130,246,0.2)" : "#2563eb",
            border: "none", borderRadius: 10, color: sending || !title.trim() || !body.trim() ? "#475569" : "#fff",
            fontSize: 14, fontWeight: 700, cursor: sending || !title.trim() || !body.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {sending ? (
            <>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Wysyłam…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Wyślij powiadomienie
            </>
          )}
        </button>

        {result && (
          <div style={result.ok ? alertOk : alertErr}>
            {result.ok
              ? `Wysłano do ${result.sent} z ${result.total} urządzeń`
              : result.error}
          </div>
        )}
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #334155; }
        input:focus, textarea:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 };
const inp = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, transition: "border-color 0.2s" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
