/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";

const BADGE_EMOJI = [
  { e: "⚽", label: "Gol" },
  { e: "🏆", label: "Zwycięstwo" },
  { e: "💪", label: "Siła" },
  { e: "🔥", label: "Ogień" },
  { e: "🎯", label: "Celność" },
];
const REACTION_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "😡"];

function getFingerprint() {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("drawa_fp");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("drawa_fp", fp);
  }
  return fp;
}

function getMyReactions() {
  try { return JSON.parse(localStorage.getItem("drawa_reactions") || "{}"); } catch { return {}; }
}
function saveMyReactions(obj) {
  localStorage.setItem("drawa_reactions", JSON.stringify(obj));
}

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} godz. temu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} dni temu`;
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export default function Komentarze({ typ, targetId }) {
  const [komentarze, setKomentarze] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState("list");
  const [nick, setNick] = useState("");
  const [tresc, setTresc] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [myReactions, setMyReactionsState] = useState({});

  const load = useCallback(() => {
    fetch(`/api/komentarze?typ=${typ}&targetId=${targetId}`)
      .then((r) => r.json())
      .then((d) => setKomentarze(d.komentarze || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typ, targetId]);

  useEffect(() => {
    load();
    setNick(localStorage.getItem("drawa_comment_nick") || "");
    setMyReactionsState(getMyReactions());
  }, [load]);

  function openModal(v) {
    setView(v || "list");
    setModalOpen(true);
    setSuccessMsg("");
    setError("");
  }

  function closeModal() {
    setModalOpen(false);
    setSuccessMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fp = getFingerprint();
    try {
      const r = await fetch("/api/komentarze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typ, targetId, nick, tresc, emoji: selectedEmoji, fingerprintId: fp }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setSubmitting(false); return; }
      localStorage.setItem("drawa_comment_nick", nick);
      setTresc("");
      setSelectedEmoji(null);
      setSuccessMsg("Komentarz wysłany do weryfikacji");
      setView("list");
    } catch { setError("Błąd połączenia"); }
    setSubmitting(false);
  }

  async function toggleReaction(komentarzId, emoji) {
    const fp = getFingerprint();
    const key = `${komentarzId}:${emoji}`;
    const my = getMyReactions();
    const had = !!my[key];
    const newMy = { ...my };
    if (had) delete newMy[key]; else newMy[key] = true;
    saveMyReactions(newMy);
    setMyReactionsState(newMy);
    setKomentarze((prev) =>
      prev.map((k) => {
        if (k.id !== komentarzId) return k;
        const r = { ...k.reakcje };
        r[emoji] = (r[emoji] || 0) + (had ? -1 : 1);
        if (r[emoji] <= 0) delete r[emoji];
        return { ...k, reakcje: r };
      })
    );
    try {
      await fetch("/api/komentarze/reakcja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ komentarzId, emoji, fingerprintId: fp }),
      });
    } catch {}
  }

  if (!targetId) return null;

  const count = komentarze.length;

  return (
    <>
      {/* Trigger buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => openModal("list")}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)", color: count > 0 ? "#94a3b8" : "#475569",
            fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}
        >
          💬 Komentarze{!loading && ` (${count})`}
        </button>
        <button
          onClick={() => openModal("form")}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(59,130,246,0.3)",
            background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontSize: 12, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Dodaj komentarz
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0f1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
              width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column",
              boxShadow: "0 16px 64px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setView("list"); setSuccessMsg(""); setError(""); }}
                  style={{
                    padding: "5px 14px", borderRadius: 6, border: "1px solid",
                    borderColor: view === "list" ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)",
                    background: view === "list" ? "rgba(59,130,246,0.12)" : "transparent",
                    color: view === "list" ? "#3b82f6" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Komentarze ({count})
                </button>
                <button
                  onClick={() => { setView("form"); setSuccessMsg(""); setError(""); }}
                  style={{
                    padding: "5px 14px", borderRadius: 6, border: "1px solid",
                    borderColor: view === "form" ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)",
                    background: view === "form" ? "rgba(59,130,246,0.12)" : "transparent",
                    color: view === "form" ? "#3b82f6" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Napisz
                </button>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {successMsg && (
                <div style={{ fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  ✓ {successMsg}
                </div>
              )}

              {view === "form" && (
                <form onSubmit={handleSubmit}>
                  <input
                    style={inpStyle}
                    placeholder="Twój nick"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    maxLength={30}
                  />
                  <div style={{ display: "flex", gap: 6, margin: "10px 0" }}>
                    {BADGE_EMOJI.map((b) => (
                      <button
                        type="button"
                        key={b.e}
                        onClick={() => setSelectedEmoji(selectedEmoji === b.e ? null : b.e)}
                        title={b.label}
                        style={{
                          padding: "4px 8px", borderRadius: 6, border: "1px solid",
                          borderColor: selectedEmoji === b.e ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.06)",
                          background: selectedEmoji === b.e ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)",
                          fontSize: 18, cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {b.e}
                      </button>
                    ))}
                  </div>
                  <textarea
                    style={{ ...inpStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                    placeholder="Napisz komentarz..."
                    value={tresc}
                    onChange={(e) => setTresc(e.target.value)}
                    required
                    maxLength={500}
                  />
                  <div style={{ fontSize: 10, color: "#334155", textAlign: "right", marginTop: 2 }}>{tresc.length}/500</div>
                  {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{error}</div>}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      marginTop: 10, padding: "9px 28px", background: "#3b82f6", border: "none",
                      borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "wait" : "pointer",
                      width: "100%",
                    }}
                  >
                    {submitting ? "WYSYŁANIE..." : "WYŚLIJ KOMENTARZ"}
                  </button>
                </form>
              )}

              {view === "list" && (
                loading ? (
                  <div style={{ color: "#475569", fontSize: 12, padding: 20, textAlign: "center" }}>Ładowanie...</div>
                ) : count === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ color: "#334155", fontSize: 13, marginBottom: 10 }}>Brak komentarzy</div>
                    <button
                      onClick={() => setView("form")}
                      style={{
                        padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)",
                        background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Bądź pierwszy!
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {komentarze.map((k) => (
                      <div key={k.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{k.nick}</span>
                          {k.emoji && <span style={{ fontSize: 15 }}>{k.emoji}</span>}
                          <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>{timeAgo(k.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {k.tresc}
                        </div>
                        {k.odpowiedz && (
                          <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 8, borderLeft: "3px solid #3b82f6" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                              <img src="/logo.png" alt="" width={16} height={16} style={{ objectFit: "contain", borderRadius: 2 }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6" }}>MKS DRAWA DRAWNO</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{k.odpowiedz}</div>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                          {REACTION_EMOJI.map((emoji) => {
                            const cnt = k.reakcje?.[emoji] || 0;
                            const mine = !!myReactions[`${k.id}:${emoji}`];
                            if (cnt === 0 && !mine) return null;
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(k.id, emoji)}
                                style={{
                                  padding: "2px 6px", borderRadius: 12, border: "1px solid",
                                  borderColor: mine ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)",
                                  background: mine ? "rgba(59,130,246,0.12)" : "transparent",
                                  fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "#94a3b8",
                                }}
                              >
                                {emoji} <span style={{ fontSize: 10, fontWeight: 600 }}>{cnt}</span>
                              </button>
                            );
                          })}
                          <ReactionPicker onPick={(emoji) => toggleReaction(k.id, emoji)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReactionPicker({ onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "2px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
          background: "transparent", fontSize: 12, cursor: "pointer", color: "#475569",
        }}
      >
        +
      </button>
      {open && (
        <div style={{ display: "flex", gap: 2, padding: "2px 4px", background: "#1e293b", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
          {REACTION_EMOJI.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onPick(emoji); setOpen(false); }}
              style={{ padding: "2px 4px", background: "none", border: "none", fontSize: 16, cursor: "pointer" }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const inpStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 7,
  color: "#fff",
  fontSize: 13,
  boxSizing: "border-box",
};
