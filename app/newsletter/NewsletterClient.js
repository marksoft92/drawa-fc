"use client";

import { useState } from "react";

const benefits = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="#3b82f6" stroke="none" />
      </svg>
    ),
    title: "Relacje na żywo",
    desc: "Wyniki meczów i relacje tuż po ostatnim gwizdku — zanim pojawią się gdziekolwiek indziej.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: "Zapowiedzi meczów",
    desc: "Kiedy i z kim gramy, gdzie kibicować i jak dojechać — wszystko w jednym mailu.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Kulisy drużyny",
    desc: "Transfery, zmiany w kadrze, treningi i życie klubowe — informacje z pierwszej ręki.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Bez spamu",
    desc: "Wysyłamy tylko gdy jest o czym pisać. Żadnych reklam, żadnego spamu. W każdej chwili możesz się wypisać.",
  },
];

export default function NewsletterClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: data.msg });
        setEmail("");
      } else {
        setStatus({ ok: false, msg: data.error });
      }
    } catch {
      setStatus({ ok: false, msg: "Błąd połączenia" });
    }
    setBusy(false);
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#030712",
      fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    }}>
      {/* Hero */}
      <section style={{
        padding: "100px 20px 60px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <img
            src="/logo.png"
            alt="MKS Drawa Drawno"
            width={72}
            height={72}
            style={{ marginBottom: 20, opacity: 0.9 }}
          />

          <div style={{
            fontSize: 10,
            color: "#3b82f6",
            letterSpacing: "0.3em",
            fontWeight: 700,
            marginBottom: 16,
          }}>
            NEWSLETTER
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: "clamp(32px, 7vw, 56px)",
            letterSpacing: "0.06em",
            color: "#fff",
            lineHeight: 1.1,
            margin: "0 0 16px",
          }}>
            Bądź na bieżąco z&nbsp;Drawą
          </h1>

          <p style={{
            fontSize: 15,
            color: "#64748b",
            lineHeight: 1.7,
            maxWidth: 440,
            margin: "0 auto 36px",
          }}>
            Wyniki meczów, relacje, zapowiedzi spotkań i aktualności klubowe — prosto na Twój email. Dołącz do kibiców Drawy.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            display: "flex",
            gap: 10,
            maxWidth: 440,
            margin: "0 auto",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Twój adres email"
              required
              style={{
                flex: 1, minWidth: 220, padding: "14px 18px", borderRadius: 10,
                border: "1px solid rgba(59,130,246,0.25)", background: "#0a0f1a",
                color: "#fff", fontSize: 14, outline: "none",
                transition: "border-color 0.2s",
              }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "14px 28px", borderRadius: 10, border: "none",
                background: busy ? "#1e293b" : "#2563eb", color: "#fff",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
                cursor: busy ? "wait" : "pointer", transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {busy ? "ZAPISUJĘ..." : "ZAPISZ SIĘ"}
            </button>
          </form>

          {status && (
            <div style={{
              marginTop: 16,
              padding: "12px 20px",
              borderRadius: 8,
              background: status.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${status.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              color: status.ok ? "#22c55e" : "#ef4444",
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 440,
              margin: "16px auto 0",
            }}>
              {status.msg}
            </div>
          )}

          <p style={{
            fontSize: 11,
            color: "#334155",
            marginTop: 16,
          }}>
            Możesz się wypisać w dowolnej chwili jednym kliknięciem.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "0 20px 80px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {benefits.map((b) => (
            <div key={b.title} style={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "24px 20px",
              transition: "border-color 0.2s",
            }}>
              <div style={{ marginBottom: 14 }}>{b.icon}</div>
              <h3 style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 6px",
              }}>
                {b.title}
              </h3>
              <p style={{
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.6,
                margin: 0,
              }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 20px",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.7,
          maxWidth: 400,
          margin: "0 auto",
        }}>
          Newsletter MKS Drawa Drawno — dołącz do kibicowskiej społeczności i nie przegap żadnego meczu.
        </p>
      </section>
    </main>
  );
}
