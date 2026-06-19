"use client";

export default function GlobalError({ error, unstable_retry }) {
  return (
    <html lang="pl">
      <body style={{
        margin: 0,
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 20px",
        textAlign: "center",
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
      }}>
        <div style={{
          fontFamily: "Impact, sans-serif",
          fontSize: "clamp(60px, 12vw, 120px)",
          color: "#1e293b",
          lineHeight: 1,
        }}>
          Błąd
        </div>
        <h1 style={{
          fontFamily: "Impact, sans-serif",
          fontSize: "clamp(20px, 4vw, 32px)",
          letterSpacing: "0.08em",
          color: "#fff",
          margin: "16px 0 12px",
        }}>
          Coś poszło nie tak
        </h1>
        <p style={{ fontSize: 14, color: "#475569", maxWidth: 400, lineHeight: 1.7, marginBottom: 32 }}>
          Wystąpił krytyczny błąd. Spróbuj odświeżyć stronę.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            padding: "10px 28px",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          ODŚWIEŻ
        </button>
      </body>
    </html>
  );
}
