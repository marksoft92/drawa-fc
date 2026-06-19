"use client";

import { useEffect } from "react";

export default function PanelError({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 20px",
      textAlign: "center",
      fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "rgba(239,68,68,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        fontSize: 24,
      }}>
        !
      </div>
      <h2 style={{
        fontSize: 18,
        fontWeight: 600,
        color: "#fff",
        margin: "0 0 8px",
      }}>
        Wystąpił błąd
      </h2>
      <p style={{ fontSize: 13, color: "#64748b", maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>
        {error?.message || "Nie udało się załadować tej sekcji panelu."}
      </p>
      <button
        onClick={() => unstable_retry()}
        style={{
          padding: "8px 24px",
          borderRadius: 6,
          border: "1px solid rgba(59,130,246,0.3)",
          background: "transparent",
          color: "#3b82f6",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          cursor: "pointer",
        }}
      >
        SPRÓBUJ PONOWNIE
      </button>
    </div>
  );
}
