/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/footer";

const DRAWA_HERB = "/logo.png";
const FooterHerbImg = ({ src, alt, size = 40 }) => (
  <img src={src} alt={alt || ""} width={size} height={size} style={{ objectFit: "contain", borderRadius: 4 }} />
);

const MEDAL = ["#fbbf24", "#94a3b8", "#b45309"];

function Countdown({ target }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) { setLeft("Zamknięte"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(d > 0 ? `${d}d ${h}h ${m}min` : `${h}h ${m}min ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  return <span>{left}</span>;
}

function CrestImg({ src, size = 48 }) {
  if (!src) return <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, color: "#334155", flexShrink: 0 }}>?</div>;
  return <img src={src} alt="" width={size} height={size} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} />;
}

function punktyLabel(p) {
  if (p === 3) return { text: "Trafiony!", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (p === 2) return { text: "Blisko", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (p === 1) return { text: "Wynik OK", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { text: "Pudło", color: "#475569", bg: "rgba(255,255,255,0.02)" };
}

export default function TypowaniePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch("/api/typowanie")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getForm(id) {
    return forms[id] || { imie: "", nazwisko: "", g1: "", g2: "" };
  }

  function setField(id, key, val) {
    setForms((p) => ({ ...p, [id]: { ...getForm(id), [key]: val } }));
  }

  async function handleSubmit(e, id) {
    e.preventDefault();
    const f = getForm(id);
    setSubmitting((p) => ({ ...p, [id]: true }));
    setErrors((p) => ({ ...p, [id]: "" }));

    try {
      const r = await fetch(`/api/typowanie/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imie: f.imie, nazwisko: f.nazwisko, golTeam1: Number(f.g1), golTeam2: Number(f.g2) }),
      });
      const d = await r.json();
      if (!r.ok) { setErrors((p) => ({ ...p, [id]: d.error })); }
      else { setSubmitted((p) => ({ ...p, [id]: true })); }
    } catch {
      setErrors((p) => ({ ...p, [id]: "Błąd połączenia" }));
    }
    setSubmitting((p) => ({ ...p, [id]: false }));
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
      `}</style>

      <NavBar backLabel="Typowanie" />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>Typowanie wyników — MKS Drawa Drawno</h1>

      <main style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 800, margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
            Typowanie wyników
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Ładowanie...</div>
        ) : !data ? (
          <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Błąd ładowania</div>
        ) : (
          <>
            {/* Otwarte typowania */}
            {data.otwarte.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 16 }}>OTWARTE TYPOWANIA</div>
                {data.otwarte.map((t) => {
                  const f = getForm(t.id);
                  const done = submitted[t.id];
                  const err = errors[t.id];
                  const busy = submitting[t.id];

                  return (
                    <div key={t.id} style={{ background: "#0f172a", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 14, padding: "24px", marginBottom: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                      {/* Mecz header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20 }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <CrestImg src={t.herb1} size={56} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 8 }}>{t.team1}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.1em" }}>VS</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                            {new Date(t.dataRozpoczecia).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <CrestImg src={t.herb2} size={56} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 8 }}>{t.team2}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 4 }}>ZAMKNIĘCIE ZA</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6", fontFamily: "monospace" }}>
                          <Countdown target={t.dataRozpoczecia} />
                        </div>
                        <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>{t._count.wpisy} typów oddanych</div>
                      </div>

                      {done ? (
                        <div style={{ textAlign: "center", padding: "16px 0" }}>
                          <div style={{ fontSize: 18, marginBottom: 6 }}>✓</div>
                          <div style={{ fontSize: 14, color: "#22c55e", fontWeight: 600 }}>Twój typ został zapisany!</div>
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Wyniki po meczu</div>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleSubmit(e, t.id)}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                            <input
                              style={inpStyle}
                              placeholder="Imię"
                              value={f.imie}
                              onChange={(e) => setField(t.id, "imie", e.target.value)}
                              required
                              maxLength={50}
                            />
                            <input
                              style={inpStyle}
                              placeholder="Nazwisko"
                              value={f.nazwisko}
                              onChange={(e) => setField(t.id, "nazwisko", e.target.value)}
                              required
                              maxLength={50}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14 }}>
                            <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "right", flex: 1 }}>{t.team1}</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              style={{ ...inpStyle, width: 56, textAlign: "center", fontSize: 20, fontWeight: 800, padding: "8px 4px" }}
                              value={f.g1}
                              onChange={(e) => setField(t.id, "g1", e.target.value)}
                              required
                            />
                            <span style={{ color: "#334155", fontSize: 18, fontWeight: 700 }}>:</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              style={{ ...inpStyle, width: 56, textAlign: "center", fontSize: 20, fontWeight: 800, padding: "8px 4px" }}
                              value={f.g2}
                              onChange={(e) => setField(t.id, "g2", e.target.value)}
                              required
                            />
                            <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "left", flex: 1 }}>{t.team2}</span>
                          </div>
                          {err && <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center", marginBottom: 10 }}>{err}</div>}
                          <div style={{ textAlign: "center" }}>
                            <button type="submit" disabled={busy} style={{
                              padding: "10px 32px", background: "#3b82f6", border: "none", borderRadius: 8,
                              color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "wait" : "pointer",
                              opacity: busy ? 0.6 : 1, transition: "opacity 0.15s",
                            }}>
                              {busy ? "Wysyłanie..." : "Oddaj typ"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {data.otwarte.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: 14, marginBottom: 32 }}>
                Brak otwartych typowań — wróć przed następnym meczem!
              </div>
            )}

            {/* Zakończone */}
            {data.zakonczone.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 16 }}>WYNIKI TYPOWAŃ</div>
                {data.zakonczone.map((t) => (
                  <div key={t.id} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px", marginBottom: 16 }}>
                    {/* Wynik meczu */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>{t.team1}</span>
                        <CrestImg src={t.herb1} size={36} />
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "monospace", padding: "4px 14px", background: "rgba(59,130,246,0.1)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.2)" }}>
                        {t.wynikTeam1}:{t.wynikTeam2}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                        <CrestImg src={t.herb2} size={36} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>{t.team2}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: "#334155", textAlign: "center", marginBottom: 14 }}>
                      {new Date(t.dataRozpoczecia).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })} · {t.wpisy.length} typów
                    </div>

                    {/* Ranking */}
                    {t.wpisy.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {t.wpisy.map((w, i) => {
                          const pl = punktyLabel(w.punkty);
                          return (
                            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: pl.bg, borderRadius: 8, border: `1px solid ${pl.color}22` }}>
                              <span style={{ width: 24, fontSize: 14, fontWeight: 800, color: i < 3 ? MEDAL[i] : "#475569", textAlign: "center" }}>
                                {i + 1}
                              </span>
                              <span style={{ flex: 1, fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{w.imie} {w.nazwisko}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "monospace", minWidth: 40, textAlign: "center" }}>
                                {w.golTeam1}:{w.golTeam2}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: pl.color, minWidth: 50, textAlign: "right" }}>
                                {w.punkty} pkt
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", color: "#475569", fontSize: 12 }}>Nikt nie typował</div>
                    )}

                    {/* Legenda */}
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                      {[
                        { pts: 3, label: "Trafiony wynik" },
                        { pts: 2, label: "Wynik + różnica" },
                        { pts: 1, label: "Wynik W/R/P" },
                        { pts: 0, label: "Pudło" },
                      ].map((l) => (
                        <span key={l.pts} style={{ fontSize: 10, color: "#475569" }}>
                          <span style={{ fontWeight: 700, color: punktyLabel(l.pts).color }}>{l.pts} pkt</span> = {l.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer HerbImg={FooterHerbImg} herb={DRAWA_HERB} />
    </>
  );
}

const inpStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 14,
  boxSizing: "border-box",
};
