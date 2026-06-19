"use client";

import { useState, useEffect } from "react";

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 16,
};
const labelStyle = { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 };
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
  background: "#0a0f1a", color: "#fff", fontSize: 13, outline: "none",
};
const btnStyle = (active, color = "#2563eb") => ({
  padding: "9px 18px", borderRadius: 8, border: "none", cursor: active ? "pointer" : "wait",
  background: active ? color : "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.15s",
});

export default function NewsletterPanel() {
  const [subs, setSubs] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { loadSubs(); }, []);

  async function loadSubs() {
    try {
      const res = await fetch("/api/admin/newsletter");
      const data = await res.json();
      setSubs(data.subs || []);
      setActiveCount(data.active || 0);
      setTotalCount(data.total || 0);
    } catch {}
    setLoading(false);
  }

  async function handleSend() {
    if (!subject.trim() || !content.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const html = content
        .split("\n")
        .map((line) => (line.trim() ? `<p style="margin:0 0 12px;color:#1e293b;font-size:15px;line-height:1.7">${line}</p>` : ""))
        .join("");

      const wrappedHtml = `
        <div style="max-width:560px;margin:0 auto;font-family:-apple-system,'Segoe UI',sans-serif">
          <div style="text-align:center;padding:24px 0;border-bottom:2px solid #3b82f6">
            <img src="https://mksdrawadrawno.pl/logo.png" width="48" height="48" alt="MKS Drawa" style="margin-bottom:8px">
            <div style="font-size:18px;font-weight:700;color:#0f172a">MKS Drawa Drawno</div>
          </div>
          <div style="padding:28px 0">${html}</div>
          <div style="text-align:center;padding:16px 0;border-top:1px solid #e2e8f0">
            <a href="https://mksdrawadrawno.pl" style="color:#3b82f6;font-size:12px;text-decoration:none">mksdrawadrawno.pl</a>
          </div>
        </div>`;

      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html: wrappedHtml }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, msg: `Wysłano do ${data.sent} subskrybentów${data.failed ? ` (${data.failed} błędów)` : ""}` });
        setSubject("");
        setContent("");
      } else {
        setResult({ ok: false, msg: data.error });
      }
    } catch {
      setResult({ ok: false, msg: "Błąd połączenia" });
    }
    setSending(false);
  }

  async function handleDelete(id) {
    if (!confirm("Usunąć tego subskrybenta?")) return;
    await fetch("/api/admin/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadSubs();
  }

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em", marginBottom: 20 }}>
        Newsletter
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Aktywnych</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{activeCount}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Wszystkich</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#94a3b8" }}>{totalCount}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Wyślij newsletter</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Temat</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="np. Relacja z meczu — Drawa 3:1 Orzeł"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>
            Treść <span style={{ color: "#334155" }}>(każda linia = nowy akapit)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder={"Cześć kibicu!\n\nW sobotę rozegraliśmy mecz...\n\nZapraszamy na kolejny mecz!"}
            style={{ ...inputStyle, resize: "vertical", minHeight: 160 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !content.trim() || activeCount === 0}
            style={btnStyle(!sending && !!subject.trim() && !!content.trim() && activeCount > 0)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            {sending ? "Wysyłanie..." : `Wyślij do ${activeCount} osób`}
          </button>
          {result && (
            <span style={{ fontSize: 12, color: result.ok ? "#22c55e" : "#ef4444" }}>{result.msg}</span>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Subskrybenci ({totalCount})</div>
        {subs.length === 0 ? (
          <p style={{ fontSize: 13, color: "#475569" }}>Brak subskrybentów. Formularz zapisu jest w stopce strony.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {subs.map((s) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px", borderRadius: 6,
                background: s.active ? "transparent" : "rgba(239,68,68,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: s.active ? "#22c55e" : "#475569",
                  }} />
                  <span style={{ fontSize: 13, color: s.active ? "#cbd5e1" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.email}
                  </span>
                  {!s.active && <span style={{ fontSize: 10, color: "#ef4444", flexShrink: 0 }}>wypisany</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    {new Date(s.createdAt).toLocaleDateString("pl-PL")}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: "2px 6px" }}
                    title="Usuń"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
