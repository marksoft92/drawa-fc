"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";

function extractYouTubeId(input) {
  if (!input) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function TransmisjaPage() {
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stream/url")
      .then((r) => r.json())
      .then((d) => {
        setStreamUrl(d.url || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const videoId = extractYouTubeId(streamUrl);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .stream-embed-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: #0a0f1e;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .stream-embed-wrapper iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
      `}</style>

      <NavBar backLabel="Strona główna" />

      <div style={{ paddingTop: 64, minHeight: "100vh", background: "#030712" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 4, height: 28, background: "#ef4444", borderRadius: 2 }} />
            <div
              style={{
                fontSize: "clamp(22px, 5vw, 32px)",
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                letterSpacing: "0.1em",
                color: "#fff",
              }}
            >
              Transmisja NA ŻYWO
            </div>
            {videoId && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: 20,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#ef4444",
                    animation: "pulse 1.6s ease-in-out infinite",
                  }}
                />
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.08em" }}>
                  LIVE
                </span>
              </div>
            )}
          </div>

          {/* Player */}
          {loading ? (
            <div
              style={{
                aspectRatio: "16/9",
                background: "#0a0f1e",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
                fontSize: 14,
              }}
            >
              Ładowanie...
            </div>
          ) : videoId ? (
            <div className="stream-embed-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Transmisja MKS Drawa Drawno"
              />
            </div>
          ) : (
            <div
              style={{
                aspectRatio: "16/9",
                background: "#0a0f1e",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#475569",
                textAlign: "center",
                padding: 24,
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10,8 16,12 10,16" fill="#334155" stroke="none" />
              </svg>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>
                Brak aktywnej transmisji
              </div>
              <div style={{ fontSize: 13, color: "#334155", maxWidth: 320 }}>
                Transmisja pojawi się tutaj gdy zostanie uruchomiona przed meczem.
              </div>
            </div>
          )}

          {/* Info */}
          <div
            style={{
              marginTop: 24,
              padding: "16px 20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              Transmisja jest prowadzona przez klub na kanale YouTube. Strona odświeża się automatycznie.{" "}
              <Link href="/" style={{ color: "#3b82f6", textDecoration: "none" }}>
                Wróć na stronę główną
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}
