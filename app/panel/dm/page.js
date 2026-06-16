"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function Avatar({ foto, name, size = 44 }) {
  const [err, setErr] = useState(false);
  const initials = (name || "?").charAt(0).toUpperCase();
  if (foto && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.1)" }}>
        <Image src={foto} alt={name} width={size} height={size} style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={() => setErr(true)} unoptimized />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "1.5px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#3b82f6", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function timeAgo(date) {
  if (!date) return null;
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} godz.`;
  return `${Math.floor(hrs / 24)} dni`;
}

export default function DmListPage() {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/panel/dm")
      .then((r) => r.json())
      .then((d) => { setConvs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 20 }}>
        Wiadomości
      </div>

      {loading ? (
        <div style={{ color: "#475569", fontSize: 14, padding: 20 }}>Ładowanie...</div>
      ) : convs.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 14, padding: 20, textAlign: "center" }}>
          Brak rozmów. Wejdź w profil zawodnika i zacznij pisać.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {convs.map((c) => (
            <button
              key={c.convId}
              onClick={() => router.push(`/panel/dm/${c.otherId}`)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: c.unread ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${c.unread ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar foto={c.otherFoto} name={c.otherName} size={44} />
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: "50%",
                  background: c.online ? "#22c55e" : "#374151",
                  border: "2px solid #030712",
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#fff", fontWeight: c.unread ? 700 : 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.otherName}
                  </span>
                  {c.lastMsg && (
                    <span style={{ fontSize: 10, color: "#475569", flexShrink: 0 }}>
                      {timeAgo(c.lastMsg.createdAt)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: c.unread ? "#94a3b8" : "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastMsg
                    ? c.lastMsg.typ === "image"
                      ? "📷 Zdjęcie"
                      : c.lastMsg.tresc ?? "Wiadomość usunięta"
                    : "Brak wiadomości"}
                </div>
              </div>

              {c.unread > 0 && (
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
    </div>
  );
}
