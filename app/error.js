"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{
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
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: "clamp(60px, 12vw, 120px)",
        color: "#1e293b",
        lineHeight: 1,
      }}>
        Błąd
      </div>
      <h1 style={{
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: "clamp(20px, 4vw, 32px)",
        letterSpacing: "0.08em",
        color: "#fff",
        margin: "16px 0 12px",
      }}>
        Coś poszło nie tak
      </h1>
      <p style={{ fontSize: 14, color: "#475569", maxWidth: 400, lineHeight: 1.7, marginBottom: 32 }}>
        Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wróć na stronę główną.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
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
          SPRÓBUJ PONOWNIE
        </button>
        <Link
          href="/"
          style={{
            padding: "10px 22px",
            borderRadius: 8,
            border: "1px solid rgba(59,130,246,0.3)",
            color: "#3b82f6",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textDecoration: "none",
          }}
        >
          STRONA GŁÓWNA
        </Link>
      </div>
    </main>
  );
}
