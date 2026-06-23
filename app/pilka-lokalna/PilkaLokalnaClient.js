"use client";

import { useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";

const SectionLabel = ({ children }) => (
  <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
    <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2 }} />
    <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", fontWeight: "normal" }}>{children}</span>
  </h2>
);

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return ""; }
}

export default function PilkaLokalnaClient({ wpisy, zrodla }) {
  const [filter, setFilter] = useState("");
  const filtered = filter ? wpisy.filter(w => w.zrodloId === filter) : wpisy;

  return (
    <>
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 64 }}>
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <SectionLabel>Piłka lokalna</SectionLabel>
            {zrodla.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  onClick={() => setFilter("")}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
                    background: !filter ? "rgba(59,130,246,0.15)" : "transparent",
                    color: !filter ? "#3b82f6" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Wszystkie
                </button>
                {zrodla.map(z => (
                  <button
                    key={z.id}
                    onClick={() => setFilter(z.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
                      background: filter === z.id ? "rgba(59,130,246,0.15)" : "transparent",
                      color: filter === z.id ? "#3b82f6" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {z.herb && <img src={z.herb} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                    {z.nazwa}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>Brak wpisów{filter ? " dla tego źródła" : ""}.</div>
              <div style={{ fontSize: 13 }}>Wróć wkrótce — agregujemy najnowsze wiadomości z klubów ligowych.</div>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {filtered.map(w => (
              <Link
                key={w.id}
                href={`/pilka-lokalna/${w.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "border-color 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
                >
                  {w.miniaturka && (
                    <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                      <img src={w.miniaturka} alt={w.tytul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      {w.zrodlo?.herb && (
                        <img src={w.zrodlo.herb} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                      )}
                      <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>{w.zrodlo?.nazwa}</span>
                      <span style={{ fontSize: 11, color: "#334155" }}>·</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>{fmtDate(w.dataPostu || w.createdAt)}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 8 }}>
                      {w.tytul}
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {w.tresc.slice(0, 200)}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
