"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { computeTeamStats } from "@/lib/computeStats";

const isDrawa = n => n?.toLowerCase().includes("drawa");

function SezonCard({ sezon, aktywny }) {
  const [tabela, setTabela] = useState(null);
  const [mecze, setMecze] = useState(null);

  useEffect(() => {
    const enc = encodeURIComponent(sezon);
    Promise.all([
      fetch(`/api/liga/tabela?sezon=${enc}`).then(r => r.json()),
      fetch(`/api/liga/mecze?sezon=${enc}`).then(r => r.json()),
    ]).then(([t, m]) => {
      setTabela(Array.isArray(t) ? t : []);
      setMecze(Array.isArray(m) ? m : []);
    }).catch(() => { setTabela([]); setMecze([]); });
  }, [sezon]);

  const loading = tabela === null || mecze === null;
  const s = mecze ? computeTeamStats(mecze) : null;
  const row = tabela ? tabela.find(r => isDrawa(r.nazwa)) : null;

  return (
    <div style={{
      background: "#0f172a",
      border: aktywny ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
      borderLeft: aktywny ? "4px solid #3b82f6" : "4px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
    }}>
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.08em" }}>
            SEZON {sezon}
          </div>
          {row && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Pozycja: {row.pozycja}. miejsce</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {aktywny && (
            <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
              AKTYWNY
            </div>
          )}
          {row?.pozycja === 1 && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
              MISTRZOSTWO
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, color: "#334155", fontSize: 12 }}>Ładowanie...</div>
      ) : s && (
        <>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 16 }}>
            {[
              { v: row?.pkt ?? "—", l: "PKT" },
              { v: s.total, l: "MECZÓW" },
              { v: s.wins, l: "WYGRANYCH" },
              { v: s.draws, l: "REMISÓW" },
              { v: s.losses, l: "PORAŻEK" },
              { v: `${s.golesFor}:${s.golesAgainst}`, l: "BRAMKI" },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 30, color: aktywny ? "#3b82f6" : "#64748b", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.15em", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          {s.biggestWin.score && (
            <div style={{ padding: "0 24px 20px", fontSize: 12, color: "#475569" }}>
              Największa wygrana: {s.biggestWin.score} z {s.biggestWin.opponent}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ArchiwumPage() {
  const [sezony, setSezony] = useState(null);
  const [aktywnySezon, setAktywnySezon] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/liga/sezony").then(r => r.json()),
      fetch("/api/ustawienia").then(r => r.json()),
    ]).then(([s, u]) => {
      setSezony(Array.isArray(s) ? s : []);
      setAktywnySezon(u?.aktywny_sezon || null);
    }).catch(() => { setSezony([]); });
  }, []);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #030712; color: #fff; font-family: -apple-system,'Segoe UI',sans-serif; }`}</style>
      <NavBar backLabel="← Strona główna" />

      <div style={{ paddingTop: 64 }}>
        <div style={{ padding: "60px 20px 40px", background: "#030712", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(36px, 7vw, 56px)", color: "#fff", letterSpacing: "0.1em", margin: 0 }}>
            ARCHIWUM SEZONÓW
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>
            Historia wyników i statystyk MKS Drawa Drawno
          </p>
        </div>

        <section style={{ padding: "0 20px 80px", background: "#030712" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {sezony === null ? (
              <div style={{ color: "#334155", textAlign: "center", padding: 40 }}>Ładowanie...</div>
            ) : sezony.length === 0 ? (
              <div style={{ color: "#334155", textAlign: "center", padding: 40 }}>Brak danych sezonów</div>
            ) : (
              sezony.map(s => <SezonCard key={s} sezon={s} aktywny={s === aktywnySezon} />)
            )}

            <div style={{ marginTop: 12, border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12, padding: 32, textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "#334155", letterSpacing: "0.1em" }}>
                Poprzednie sezony będą dodawane w panelu administracyjnym
              </span>
            </div>

            <div style={{ marginTop: 40, textAlign: "center" }}>
              <Link href="/" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", letterSpacing: "0.08em", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "10px 20px", display: "inline-block" }}>
                ← Powrót na stronę główną
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
