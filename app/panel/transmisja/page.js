"use client";

import { useState, useEffect } from "react";
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

export default function AdminTransmisja() {
  const [streamUrl, setStreamUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stream/url")
      .then((r) => r.json())
      .then((d) => {
        setSavedUrl(d.url || "");
        setStreamUrl(d.url || "");
      });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("");
    try {
      const r = await fetch("/api/stream/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: streamUrl }),
      });
      if (r.ok) {
        setSavedUrl(streamUrl);
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
    setSaveStatus("");
    try {
      await fetch("/api/stream/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "" }),
      });
      setStreamUrl("");
      setSavedUrl("");
      setSaveStatus("Transmisja wyłączona");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("Błąd");
    } finally {
      setSaving(false);
    }
  }

  const videoId = extractYouTubeId(streamUrl);
  const savedId = extractYouTubeId(savedUrl);

  return (
    <div style={{ maxWidth: 620 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 4, height: 26, background: "#ef4444", borderRadius: 2 }} />
        <div>
          <div style={{
            fontSize: "clamp(20px,4vw,26px)",
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            letterSpacing: "0.1em", color: "#fff",
          }}>
            Transmisja na żywo
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
            Wklej link z YouTube Live — pojawi się na stronie
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{
        padding: "12px 16px",
        background: savedId ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${savedId ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 9, marginBottom: 24,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: savedId ? "#22c55e" : "#334155",
          animation: savedId ? "pulse 1.6s ease-in-out infinite" : "none",
        }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: savedId ? "#22c55e" : "#475569" }}>
            {savedId ? "Transmisja aktywna" : "Brak aktywnej transmisji"}
          </div>
          {savedId && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
              ID: {savedId} ·{" "}
              <Link href="/transmisja" target="_blank"
                style={{ color: "#3b82f6", textDecoration: "none" }}>
                podgląd na stronie ↗
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Link do transmisji YouTube</label>
          <input
            type="text"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://youtube.com/live/... lub youtu.be/..."
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }}
          />
          <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
            Akceptowane: pełny URL YouTube Live, youtu.be/ID lub samo 11-znakowe ID
          </div>
        </div>

        {/* Preview */}
        {videoId && (
          <div style={{
            aspectRatio: "16/9", background: "#0a0f1e", borderRadius: 9,
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Podgląd transmisji"
            />
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
          <button type="submit" disabled={saving} style={{ ...btnPrimaryStyle, flex: 1 }}>
            {saving ? "Zapisuję..." : "Zapisz i uruchom"}
          </button>
          {savedUrl && (
            <button type="button" onClick={handleClear} disabled={saving} style={btnDangerStyle}>
              Wyłącz
            </button>
          )}
        </div>
      </form>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 11, color: "#64748b",
  fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7,
};

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: 14,
  transition: "border-color 0.2s, background 0.2s",
};

const btnPrimaryStyle = {
  padding: "11px 20px", background: "#3b82f6",
  border: "none", borderRadius: 8,
  color: "#fff", fontSize: 14, fontWeight: 600,
  cursor: "pointer",
};

const btnDangerStyle = {
  padding: "11px 16px",
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: 8, color: "#ef4444",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
