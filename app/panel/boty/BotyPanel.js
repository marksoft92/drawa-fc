"use client";

import { useState, useEffect } from "react";

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "16px 20px",
};
const labelStyle = { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 };

const BOT_LABELS = {
  facebookexternalhit: { name: "Facebook", desc: "Preview linków", color: "#3b82f6" },
  Googlebot: { name: "Googlebot", desc: "Indeksowanie Google", color: "#22c55e" },
  "GoogleOther": { name: "GoogleOther", desc: "Crawling Google", color: "#22c55e" },
  "Googlebot-Image": { name: "Googlebot Image", desc: "Indeksowanie obrazów", color: "#22c55e" },
  GPTBot: { name: "GPTBot (OpenAI)", desc: "Trenowanie AI", color: "#f59e0b" },
  "OAI-SearchBot": { name: "OpenAI Search", desc: "SearchGPT", color: "#f59e0b" },
  ClaudeBot: { name: "ClaudeBot", desc: "Anthropic AI", color: "#f59e0b" },
  CCBot: { name: "CCBot", desc: "Common Crawl", color: "#94a3b8" },
  MJ12bot: { name: "Majestic", desc: "SEO crawler", color: "#ef4444" },
  "Go-http-client": { name: "Go HTTP", desc: "Skrypt/bot", color: "#ef4444" },
  "python-requests": { name: "Python", desc: "Skrypt", color: "#ef4444" },
  curl: { name: "curl", desc: "Ręczne zapytanie", color: "#94a3b8" },
  wget: { name: "wget", desc: "Pobieranie", color: "#94a3b8" },
  Bytespider: { name: "Bytespider", desc: "TikTok/ByteDance", color: "#f59e0b" },
  PetalBot: { name: "PetalBot", desc: "Huawei search", color: "#94a3b8" },
  DotBot: { name: "DotBot", desc: "Moz SEO", color: "#94a3b8" },
  SemrushBot: { name: "Semrush", desc: "SEO crawler", color: "#ef4444" },
  AhrefsBot: { name: "Ahrefs", desc: "SEO crawler", color: "#ef4444" },
  YandexBot: { name: "Yandex", desc: "Rosyjska wyszukiwarka", color: "#94a3b8" },
  bingbot: { name: "Bingbot", desc: "Indeksowanie Bing", color: "#3b82f6" },
  Twitterbot: { name: "Twitter/X", desc: "Preview linków", color: "#3b82f6" },
  WhatsApp: { name: "WhatsApp", desc: "Preview linków", color: "#22c55e" },
  Telegram: { name: "Telegram", desc: "Preview linków", color: "#3b82f6" },
};

function identifyBot(ua) {
  for (const [key, info] of Object.entries(BOT_LABELS)) {
    if (ua.toLowerCase().includes(key.toLowerCase())) return info;
  }
  return { name: "Nieznany bot", desc: "", color: "#475569" };
}

export default function BotyPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/server/bots")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Ładowanie...</div>;
  if (!data) return <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Błąd ładowania</div>;

  const botPct = data.totalReqs > 0 ? Math.round((data.botReqs / data.totalReqs) * 100) : 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em", marginBottom: 20 }}>
        Boty & Crawlery
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Wszystkie requesty</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Bebas Neue', sans-serif" }}>{data.totalReqs.toLocaleString("pl-PL")}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Requesty botów</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b", fontFamily: "'Bebas Neue', sans-serif" }}>{data.botReqs.toLocaleString("pl-PL")}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Udział botów</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: botPct > 30 ? "#ef4444" : "#22c55e", fontFamily: "'Bebas Neue', sans-serif" }}>{botPct}%</div>
        </div>
      </div>

      {data.bots?.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={labelStyle}>Boty wg User-Agent</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.bots.map((b, i) => {
              const info = identifyBot(b.ua);
              const maxCount = data.bots[0]?.count || 1;
              const w = Math.max((b.count / maxCount) * 100, 2);
              return (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${w}%`, background: "rgba(59,130,246,0.06)", borderRadius: 4 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", position: "relative", zIndex: 1 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>
                        {info.name} {info.desc && <span style={{ color: "#475569", fontWeight: 400 }}>— {info.desc}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.ua}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{b.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
        {data.botIps?.length > 0 && (
          <div style={cardStyle}>
            <div style={labelStyle}>IP botów</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.botIps.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{b.ip}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.topIps?.length > 0 && (
          <div style={cardStyle}>
            <div style={labelStyle}>Najwięcej requestów (wszyscy)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.topIps.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{b.ip}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.recentBots?.length > 0 && (
        <div style={{ ...cardStyle }}>
          <div style={labelStyle}>Ostatnia aktywność botów</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowX: "auto" }}>
            {data.recentBots.map((b, i) => {
              const info = identifyBot(b.ua);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                  <span style={{ color: "#334155", flexShrink: 0, fontVariantNumeric: "tabular-nums", minWidth: 130 }}>{b.time}</span>
                  <span style={{ color: "#cbd5e1", fontWeight: 500, flexShrink: 0 }}>{info.name}</span>
                  <span style={{ color: "#3b82f6" }}>{b.path}</span>
                  <span style={{ color: "#334155", fontFamily: "monospace", marginLeft: "auto", fontSize: 11, flexShrink: 0 }}>{b.ip}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
