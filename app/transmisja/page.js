"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";

function detectStream(input) {
  if (!input?.trim()) return null;
  const v = input.trim();

  const ytMatch = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return { platform: "youtube", id: ytMatch[1] };
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return { platform: "youtube", id: v };

  if (v.includes("facebook.com") || v.includes("fb.watch")) {
    return { platform: "facebook", url: v };
  }

  const twMatch = v.match(/twitch\.tv\/([A-Za-z0-9_]+)/);
  if (twMatch) return { platform: "twitch", channel: twMatch[1] };

  return null;
}

function buildEmbedUrl(info) {
  if (!info) return null;
  if (info.platform === "youtube")
    return `https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0`;
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

function halfLabel(h) {
  if (h === "1") return "1. POŁO.";
  if (h === "przerwa") return "PRZERWA";
  if (h === "2") return "2. POŁO.";
  if (h === "po") return "PO MECZU";
  return "";
}

export default function TransmisjaPage() {
  const [streamUrl, setStreamUrl] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [, setTick] = useState(0);

  // Load stream URL + rotation
  useEffect(() => {
    fetch("/api/stream/url")
      .then((r) => r.json())
      .then((d) => { setStreamUrl(d.url || ""); setRotation(d.rotation ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Poll match state every 2s
  useEffect(() => {
    function load() {
      fetch("/api/match/state").then(r => r.json()).then(setMatch).catch(() => {});
    }
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  // Tick every 1s to animate the timer smoothly
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const info = detectStream(streamUrl);
  const embedSrc = buildEmbedUrl(info);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .stream-wrap { position: relative; width: 100%; padding-bottom: 56.25%; background: #0a0f1e; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
        .stream-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
        .stream-wrap.rotated iframe { width: 177.78%; height: 56.25%; left: -38.89%; top: 21.875%; transform: rotate(90deg); transform-origin: center center; }
        .match-bar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center; background: rgba(3,7,18,0.88); backdrop-filter: blur(8px); padding: 8px 14px; gap: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
      `}</style>

      <NavBar backLabel="Strona główna" />

      <div style={{ paddingTop: 64, minHeight: "100vh", background: "#030712" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 4, height: 28, background: "#ef4444", borderRadius: 2 }} />
            <div style={{ fontSize: "clamp(22px,5vw,32px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
              Transmisja NA ŻYWO
            </div>
            {embedSrc && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 20 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.6s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ aspectRatio: "16/9", background: "#0a0f1e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 14 }}>
              Ładowanie...
            </div>
          ) : embedSrc ? (
            <div className={`stream-wrap${rotation === 90 ? " rotated" : ""}`}>
              <iframe
                src={embedSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Transmisja MKS Drawa Drawno"
              />
              {match?.active && (
                <div className="match-bar">
                  {/* Drużyna domowa */}
                  <div style={{ flex: 1, fontSize: "clamp(10px,1.8vw,14px)", fontWeight: 700, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {match.homeTeam}
                  </div>

                  {/* Wynik */}
                  <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1.2vw,12px)", padding: "0 clamp(8px,1.5vw,16px)" }}>
                    <span style={{ fontSize: "clamp(14px,2.8vw,22px)", fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", minWidth: "1ch", textAlign: "center" }}>
                      {match.homeScore}
                    </span>
                    <span style={{ fontSize: "clamp(12px,2vw,18px)", color: "#475569", fontWeight: 700 }}>—</span>
                    <span style={{ fontSize: "clamp(14px,2.8vw,22px)", fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", minWidth: "1ch", textAlign: "center" }}>
                      {match.awayScore}
                    </span>
                  </div>

                  {/* Drużyna gości */}
                  <div style={{ flex: 1, fontSize: "clamp(10px,1.8vw,14px)", fontWeight: 700, color: "#f1f5f9", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {match.awayTeam}
                  </div>

                  {/* Czas + połowa */}
                  <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px,0.8vw,8px)", marginLeft: "clamp(8px,1.5vw,16px)", paddingLeft: "clamp(8px,1.5vw,16px)", borderLeft: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                    <span style={{ fontSize: "clamp(10px,1.8vw,14px)", fontFamily: "monospace", color: "#94a3b8", fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
                      {fmtTime(calcElapsed(match))}
                    </span>
                    {match.half && (
                      <span style={{ fontSize: "clamp(8px,1.3vw,11px)", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>
                        {halfLabel(match.half)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ aspectRatio: "16/9", background: "#0a0f1e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#475569", textAlign: "center", padding: 24 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10,8 16,12 10,16" fill="#334155" stroke="none" />
              </svg>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>Brak aktywnej transmisji</div>
              <div style={{ fontSize: 13, color: "#334155", maxWidth: 320 }}>
                Transmisja pojawi się tutaj gdy zostanie uruchomiona przed meczem.
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              Transmisja prowadzona przez klub.{" "}
              <Link href="/" style={{ color: "#3b82f6", textDecoration: "none" }}>Wróć na stronę główną</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
