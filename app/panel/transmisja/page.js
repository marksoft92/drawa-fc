"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function detectStream(input) {
  if (!input?.trim()) return null;
  const v = input.trim();

  // YouTube
  const ytMatch = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return { platform: "youtube", id: ytMatch[1] };
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return { platform: "youtube", id: v };

  // Facebook — link do wideo/live
  if (v.includes("facebook.com") || v.includes("fb.watch")) {
    return { platform: "facebook", url: v };
  }

  // Twitch — kanał
  const twMatch = v.match(/twitch\.tv\/([A-Za-z0-9_]+)/);
  if (twMatch) return { platform: "twitch", channel: twMatch[1] };

  return null;
}

function buildEmbedUrl(info) {
  if (!info) return null;
  if (info.platform === "youtube")
    return `https://www.youtube.com/embed/${info.id}?rel=0&autoplay=1`;
  if (info.platform === "facebook")
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(info.url)}&show_text=false&autoplay=true`;
  if (info.platform === "twitch") {
    const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `https://player.twitch.tv/?channel=${info.channel}&parent=${parent}&autoplay=true`;
  }
  return null;
}

function calcElapsed(state) {
  if (!state) return 0;
  let t = state.timerOffset || 0;
  if (state.timerRunning && state.timerStartedAt) {
    t += (Date.now() - new Date(state.timerStartedAt).getTime()) / 1000;
  }
  return Math.floor(t);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const PLATFORM = {
  youtube: { label: "YouTube", color: "#ef4444" },
  facebook: { label: "Facebook", color: "#1877f2" },
  twitch: { label: "Twitch", color: "#9147ff" },
};

const HALVES = [
  { value: "1", label: "1. połowa" },
  { value: "przerwa", label: "Przerwa" },
  { value: "2", label: "2. połowa" },
  { value: "po", label: "Po meczu" },
];

export default function PanelTransmisja() {
  // ── Stream URL ─────────────────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stream/url")
      .then((r) => r.json())
      .then((d) => { setSavedUrl(d.url || ""); setInput(d.url || ""); });
  }, []);

  const detected = detectStream(input);
  const savedInfo = detectStream(savedUrl);
  const previewSrc = buildEmbedUrl(detected);
  const savedSrc = buildEmbedUrl(savedInfo);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("");
    try {
      const r = await fetch("/api/stream/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.trim() }),
      });
      if (r.ok) {
        setSavedUrl(input.trim());
        setSaveStatus("Zapisano!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Błąd zapisu");
      }
    } catch {
      setSaveStatus("Błąd połączenia");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      await fetch("/api/stream/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "" }),
      });
      setInput(""); setSavedUrl("");
      setSaveStatus("Transmisja wyłączona");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("Błąd");
    } finally {
      setSaving(false);
    }
  }

  // ── Match state ────────────────────────────────────────────────────────────
  const [match, setMatch] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/match/state").then(r => r.json()).then(setMatch).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function patchMatch(updates) {
    const next = { ...match, ...updates };
    setMatch(next);
    await fetch("/api/match/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }

  function startTimer() {
    patchMatch({ timerRunning: true, timerStartedAt: new Date().toISOString() });
  }
  function stopTimer() {
    const s = calcElapsed(match);
    patchMatch({ timerRunning: false, timerStartedAt: null, timerOffset: s });
  }
  function resetTimer() {
    patchMatch({ timerRunning: false, timerStartedAt: null, timerOffset: 0 });
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640 }}>

      {/* ── Transmisja URL ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 4, height: 26, background: "#ef4444", borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
            Transmisja na żywo
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
            YouTube, Facebook Live lub Twitch
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{
        padding: "12px 16px",
        background: savedSrc ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${savedSrc ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 9, marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: savedSrc ? "#22c55e" : "#334155",
          animation: savedSrc ? "pulse 1.6s ease-in-out infinite" : "none",
        }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: savedSrc ? "#22c55e" : "#475569" }}>
            {savedSrc
              ? `Transmisja aktywna${savedInfo ? ` · ${PLATFORM[savedInfo.platform]?.label}` : ""}`
              : "Brak aktywnej transmisji"}
          </div>
          {savedSrc && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
              <Link href="/transmisja" target="_blank" style={{ color: "#3b82f6", textDecoration: "none" }}>
                podgląd na stronie ↗
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Platformy */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { name: "YouTube", color: "#ef4444", note: "Wymaga 24h do włączenia live" },
          { name: "Facebook", color: "#1877f2", note: "Działa od razu — skopiuj link z live" },
          { name: "Twitch", color: "#9147ff", note: "Wklej link do kanału: twitch.tv/nazwa" },
        ].map((p) => (
          <div key={p.name} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{p.note}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em" }}>
              Link do transmisji
            </label>
            {detected && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: PLATFORM[detected.platform]?.color,
                background: `${PLATFORM[detected.platform]?.color}18`,
                border: `1px solid ${PLATFORM[detected.platform]?.color}40`,
                borderRadius: 10, padding: "2px 8px",
              }}>
                {PLATFORM[detected.platform]?.label}
              </span>
            )}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://youtube.com/live/..., facebook.com/.../live/... lub twitch.tv/nazwa"
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }}
          />
          {input.trim() && !detected && (
            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 5 }}>
              Nie rozpoznano platformy — wklej pełny link do YouTube, Facebook Live lub Twitch
            </div>
          )}
        </div>

        {previewSrc && (
          <div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>Podgląd</div>
            <div style={{ aspectRatio: "16/9", background: "#0a0f1e", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              <iframe
                src={previewSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none" }}
                title="Podgląd transmisji"
              />
            </div>
          </div>
        )}

        {saveStatus && (
          <div style={{
            fontSize: 13,
            color: saveStatus.includes("Błąd") ? "#ef4444" : "#22c55e",
            background: saveStatus.includes("Błąd") ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${saveStatus.includes("Błąd") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
            borderRadius: 7, padding: "9px 13px",
          }}>
            {saveStatus}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving || !detected} style={{ ...btnPrimaryStyle, flex: 1, opacity: !detected ? 0.5 : 1 }}>
            {saving ? "Zapisuję..." : "Zapisz i uruchom"}
          </button>
          {savedUrl && (
            <button type="button" onClick={handleClear} disabled={saving} style={btnDangerStyle}>
              Wyłącz
            </button>
          )}
        </div>
      </form>

      {/* ── Tablica wyników ── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "36px 0" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 26, background: "#3b82f6", borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: "clamp(20px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
              Tablica wyników
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Nakładka na transmisji</div>
          </div>
        </div>
        <button
          onClick={() => patchMatch({ active: !match?.active })}
          style={{
            padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700,
            background: match?.active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
            color: match?.active ? "#22c55e" : "#475569",
            border: `1px solid ${match?.active ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {match?.active ? "● WIDOCZNA" : "○ UKRYTA"}
        </button>
      </div>

      {/* Drużyny */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 5, letterSpacing: "0.06em" }}>DRUŻYNA DOMOWA</div>
          <input
            value={match?.homeTeam ?? ""}
            onChange={e => setMatch(m => ({ ...m, homeTeam: e.target.value }))}
            onBlur={e => patchMatch({ homeTeam: e.target.value })}
            placeholder="MKS Drawa"
            style={inputStyle}
          />
        </div>
        <div style={{ color: "#334155", fontSize: 20, fontWeight: 700, paddingBottom: 10 }}>vs</div>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 5, letterSpacing: "0.06em" }}>DRUŻYNA GOŚCI</div>
          <input
            value={match?.awayTeam ?? ""}
            onChange={e => setMatch(m => ({ ...m, awayTeam: e.target.value }))}
            onBlur={e => patchMatch({ awayTeam: e.target.value })}
            placeholder="Rywal FC"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Wynik */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20, padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => patchMatch({ homeScore: Math.max(0, (match?.homeScore || 0) - 1) })} style={scoreBtnStyle}>−</button>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", minWidth: 48, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
            {match?.homeScore ?? 0}
          </div>
          <button onClick={() => patchMatch({ homeScore: (match?.homeScore || 0) + 1 })} style={scoreBtnStyle}>+</button>
        </div>
        <div style={{ fontSize: 28, color: "#334155", fontWeight: 700 }}>:</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => patchMatch({ awayScore: Math.max(0, (match?.awayScore || 0) - 1) })} style={scoreBtnStyle}>−</button>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", minWidth: 48, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
            {match?.awayScore ?? 0}
          </div>
          <button onClick={() => patchMatch({ awayScore: (match?.awayScore || 0) + 1 })} style={scoreBtnStyle}>+</button>
        </div>
      </div>

      {/* Połowa */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 20 }}>
        {HALVES.map(h => (
          <button
            key={h.value}
            onClick={() => patchMatch({ half: h.value })}
            style={{
              padding: "9px 4px",
              border: "1px solid",
              borderColor: match?.half === h.value ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)",
              background: match?.half === h.value ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
              borderRadius: 8, cursor: "pointer",
              color: match?.half === h.value ? "#3b82f6" : "#64748b",
              fontSize: 11, fontWeight: 600,
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Zegar */}
      <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "monospace", color: "#fff", letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>
          {fmtTime(calcElapsed(match))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {match?.timerRunning ? (
            <button onClick={stopTimer} style={{ ...btnPrimaryStyle, background: "#f59e0b" }}>⏸ Stop</button>
          ) : (
            <button onClick={startTimer} style={{ ...btnPrimaryStyle, background: "#22c55e" }}>▶ Start</button>
          )}
          <button
            onClick={resetTimer}
            style={{ padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 16, cursor: "pointer" }}
          >
            ↺
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
        button:active { transform: scale(0.96); }
      `}</style>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, transition: "border-color 0.2s, background 0.2s" };
const btnPrimaryStyle = { padding: "11px 20px", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const btnDangerStyle = { padding: "11px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const scoreBtnStyle = { width: 40, height: 40, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 300 };
