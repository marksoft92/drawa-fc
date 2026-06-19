"use client";

import { useState, useEffect } from "react";
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
  if (h === "1")       return "1. POŁ.";
  if (h === "przerwa") return "PRZERWA";
  if (h === "2")       return "2. POŁ.";
  if (h === "po")      return "PO MECZU";
  return "";
}

export default function TransmisjaPage() {
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [match, setMatch]         = useState(null);
  const [, setTick]               = useState(0);

  useEffect(() => {
    fetch("/api/stream/url")
      .then(r => r.json())
      .then(d => { setStreamUrl(d.url || ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function load() {
      fetch("/api/match/state").then(r => r.json()).then(setMatch).catch(() => {});
    }
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const info     = detectStream(streamUrl);
  const embedSrc = buildEmbedUrl(info);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #000; overflow: hidden; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
      `}</style>

      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>Transmisja na żywo — MKS Drawa Drawno</h1>
      <div style={{ position: "fixed", inset: 0, background: "#000" }}>

        {/* ── Stream ── */}
        {loading ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 15 }}>
            Ładowanie...
          </div>
        ) : embedSrc ? (
          <iframe
            src={embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            title="Transmisja MKS Drawa Drawno"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#334155" }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="#1e293b" stroke="none" />
            </svg>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>Brak aktywnej transmisji</div>
            <div style={{ fontSize: 13, color: "#0f172a" }}>Transmisja pojawi się tutaj przed meczem.</div>
          </div>
        )}

        {/* ── Nakładka z wynikiem ── */}
        {match?.active && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
            padding: "14px 20px 32px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
              background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)",
              borderRadius: 12, padding: "10px 16px", width: "fit-content", margin: "0 auto",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {/* Drużyna domowa */}
              <span style={{
                fontSize: "clamp(11px,2.5vw,16px)", fontWeight: 700, color: "#f1f5f9",
                maxWidth: "22vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                textAlign: "right",
              }}>
                {match.homeTeam}
              </span>

              {/* Wynik */}
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1.5vw,14px)", padding: "0 clamp(10px,2vw,20px)" }}>
                <span style={{ fontSize: "clamp(20px,4.5vw,36px)", fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {match.homeScore}
                </span>
                <span style={{ fontSize: "clamp(14px,3vw,24px)", color: "#475569", fontWeight: 300 }}>—</span>
                <span style={{ fontSize: "clamp(20px,4.5vw,36px)", fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {match.awayScore}
                </span>
              </div>

              {/* Drużyna gości */}
              <span style={{
                fontSize: "clamp(11px,2.5vw,16px)", fontWeight: 700, color: "#f1f5f9",
                maxWidth: "22vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {match.awayTeam}
              </span>

              {/* Separator */}
              <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)", margin: "0 clamp(8px,1.5vw,14px)" }} />

              {/* Czas + połowa */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: "clamp(12px,2.5vw,18px)", fontFamily: "monospace", color: "#e2e8f0", fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: 1, lineHeight: 1 }}>
                  {fmtTime(calcElapsed(match))}
                </span>
                {match.half && (
                  <span style={{ fontSize: "clamp(8px,1.5vw,10px)", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em" }}>
                    {halfLabel(match.half)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Przycisk powrotu ── */}
        <Link
          href="/"
          style={{
            position: "absolute", bottom: 16, left: 16, zIndex: 30,
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
            color: "#64748b", fontSize: 12, fontWeight: 600, textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          ← Powrót
        </Link>

        {/* ── Badge LIVE ── */}
        {embedSrc && (
          <div style={{
            position: "absolute", bottom: 16, right: 16, zIndex: 30,
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            background: "rgba(239,68,68,0.15)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(239,68,68,0.4)", borderRadius: 20,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.6s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
          </div>
        )}
      </div>
    </>
  );
}
