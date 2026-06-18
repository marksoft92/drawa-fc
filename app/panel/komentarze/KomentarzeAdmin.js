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

  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

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

  async function sendReply(id) {
    if (!replyText.trim()) return;
    setReplying(true);
    await fetch(`/api/admin/komentarze/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odpowiedz: replyText.trim() }),
    });
    setReplyId(null);
    setReplyText("");
    setReplying(false);
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
            {k.targetLabel && (
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#334155" }}>→</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.targetLabel}</span>
              </div>
            )}
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {k.tresc}
            </div>
            {k.odpowiedz && (
              <div style={{ padding: "8px 10px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 8, borderLeft: "3px solid #3b82f6", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <img src="/logo.png" alt="" width={14} height={14} style={{ objectFit: "contain", borderRadius: 2 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6" }}>MKS DRAWA DRAWNO</span>
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{k.odpowiedz}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tab === "pending" && (
                <>
                  <button onClick={() => approve(k.id)} style={btnApprove}>Zatwierdź</button>
                  <button onClick={() => remove(k.id)} style={btnReject}>Odrzuć</button>
                </>
              )}
              {tab === "approved" && (
                <button onClick={() => remove(k.id)} style={btnReject}>Usuń</button>
              )}
              <button
                onClick={() => { setReplyId(replyId === k.id ? null : k.id); setReplyText(k.odpowiedz || ""); }}
                style={{
                  padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <img src="/logo.png" alt="" width={12} height={12} style={{ objectFit: "contain" }} />
                {k.odpowiedz ? "Edytuj odpowiedź" : "Odpowiedz"}
              </button>
            </div>
            {replyId === k.id && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Odpowiedź jako MKS Drawa Drawno..."
                  style={{
                    flex: 1, padding: "8px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 7, color: "#fff", fontSize: 12, resize: "vertical", minHeight: 50, fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button onClick={() => sendReply(k.id)} disabled={replying} style={btnApprove}>
                    {replying ? "..." : "Wyślij"}
                  </button>
                  <button onClick={() => setReplyId(null)} style={{ ...btnReject, padding: "4px 10px" }}>Anuluj</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const btnApprove = {
  padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)",
  background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 11, fontWeight: 700, cursor: "pointer",
};
const btnReject = {
  padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)",
  background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer",
};
