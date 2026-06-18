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
function setMyReactions(obj) {
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
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      setSuccessMsg("Komentarz wysłany do weryfikacji");
      setTimeout(() => setSuccessMsg(""), 5000);
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
    setMyReactions(newMy);
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

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 700 }}>
          KOMENTARZE {komentarze.length > 0 && `(${komentarze.length})`}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(59,130,246,0.3)",
            background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}
        >
          💬 {showForm ? "UKRYJ" : "DODAJ KOMENTARZ"}
        </button>
      </div>

      {successMsg && (
        <div style={{ fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
          ✓ {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
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
            style={{ ...inpStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
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
              marginTop: 10, padding: "8px 24px", background: "#3b82f6", border: "none",
              borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "WYSYŁANIE..." : "WYŚLIJ"}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 12, padding: 12 }}>Ładowanie...</div>
      ) : komentarze.length === 0 ? (
        <div style={{ color: "#334155", fontSize: 13, padding: "12px 0" }}>Brak komentarzy. Bądź pierwszy!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {komentarze.map((k) => (
            <div key={k.id} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{k.nick}</span>
                {k.emoji && <span style={{ fontSize: 16 }}>{k.emoji}</span>}
                <span style={{ fontSize: 11, color: "#334155", marginLeft: "auto" }}>{timeAgo(k.createdAt)}</span>
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {k.tresc}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {REACTION_EMOJI.map((emoji) => {
                  const count = k.reakcje?.[emoji] || 0;
                  const mine = !!myReactions[`${k.id}:${emoji}`];
                  if (count === 0 && !mine) return null;
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(k.id, emoji)}
                      style={{
                        padding: "2px 6px", borderRadius: 12, border: "1px solid",
                        borderColor: mine ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)",
                        background: mine ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
                        fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                        color: "#94a3b8", transition: "all 0.15s",
                      }}
                    >
                      {emoji} <span style={{ fontSize: 10, fontWeight: 600 }}>{count}</span>
                    </button>
                  );
                })}
                {/* Always show a + button to add first reaction */}
                <button
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const picker = btn.nextElementSibling;
                    if (picker) picker.style.display = picker.style.display === "flex" ? "none" : "flex";
                  }}
                  style={{
                    padding: "2px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
                    background: "transparent", fontSize: 12, cursor: "pointer", color: "#475569",
                  }}
                >
                  +
                </button>
                <div style={{ display: "none", gap: 2, padding: "2px 4px", background: "#1e293b", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  {REACTION_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        toggleReaction(k.id, emoji);
                        e.currentTarget.parentElement.style.display = "none";
                      }}
                      style={{ padding: "2px 4px", background: "none", border: "none", fontSize: 16, cursor: "pointer" }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  marginBottom: 0,
};
