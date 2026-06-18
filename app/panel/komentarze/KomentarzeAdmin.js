"use client";

import { useState, useEffect, useCallback } from "react";

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "14px 18px",
  marginBottom: 8,
};

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} godz. temu`;
  const days = Math.floor(hrs / 24);
  return `${days} dni temu`;
}

export default function KomentarzeAdmin() {
  const [tab, setTab] = useState("pending");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/komentarze?status=${tab}`)
      .then((r) => r.json())
      .then((d) => setLista(d.komentarze || []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  }, [tab, tick]);

  async function approve(id) {
    await fetch(`/api/admin/komentarze/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zatwierdzony: true }),
    });
    reload();
  }

  async function remove(id) {
    await fetch(`/api/admin/komentarze/${id}`, { method: "DELETE" });
    reload();
  }

  const pendingCount = tab === "pending" ? lista.length : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em", marginBottom: 16 }}>
        Komentarze
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "pending", label: "Oczekujące" },
          { key: "approved", label: "Zatwierdzone" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "1px solid",
              borderColor: tab === t.key ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)",
              background: tab === t.key ? "rgba(59,130,246,0.12)" : "transparent",
              color: tab === t.key ? "#3b82f6" : "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>Ładowanie...</div>
      ) : lista.length === 0 ? (
        <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>
          {tab === "pending" ? "Brak oczekujących komentarzy" : "Brak zatwierdzonych komentarzy"}
        </div>
      ) : (
        lista.map((k) => (
          <div key={k.id} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.08em",
                background: k.typ === "artykul" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)",
                color: k.typ === "artykul" ? "#3b82f6" : "#22c55e",
                border: `1px solid ${k.typ === "artykul" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)"}`,
              }}>
                {k.typ === "artykul" ? "ARTYKUŁ" : "MECZ"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{k.nick}</span>
              {k.emoji && <span style={{ fontSize: 16 }}>{k.emoji}</span>}
              <span style={{ fontSize: 11, color: "#334155", marginLeft: "auto" }}>{timeAgo(k.createdAt)}</span>
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {k.tresc}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {tab === "pending" && (
                <>
                  <button onClick={() => approve(k.id)} style={{
                    padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)",
                    background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>
                    Zatwierdź
                  </button>
                  <button onClick={() => remove(k.id)} style={{
                    padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>
                    Odrzuć
                  </button>
                </>
              )}
              {tab === "approved" && (
                <button onClick={() => remove(k.id)} style={{
                  padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                  Usuń
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
