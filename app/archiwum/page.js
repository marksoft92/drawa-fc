"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { computeTeamStats } from "@/lib/computeStats";

const isDrawa = (n) => n?.toLowerCase().includes("drawa");

function SezonCard({ sezon, aktywny }) {
  const [tabela, setTabela] = useState(null);
  const [mecze, setMecze] = useState(null);

  useEffect(() => {
    const enc = encodeURIComponent(sezon);
    Promise.all([
      fetch(`/api/liga/tabela?sezon=${enc}`).then((r) => r.json()),
      fetch(`/api/liga/mecze?sezon=${enc}`).then((r) => r.json()),
    ])
      .then(([t, m]) => {
        setTabela(Array.isArray(t) ? t : []);
        setMecze(Array.isArray(m) ? m : []);
      })
      .catch(() => { setTabela([]); setMecze([]); });
  }, [sezon]);

  const loading = tabela === null || mecze === null;
  const s = mecze ? computeTeamStats(mecze) : null;
  const row = tabela ? tabela.find((r) => isDrawa(r.nazwa)) : null;

  return (
    <div style={{ background: "#0f172a", border: aktywny ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)", borderLeft: aktywny ? "4px solid #3b82f6" : "4px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.08em" }}>SEZON {sezon}</div>
          {row && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Pozycja: {row.pozycja}. miejsce</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {aktywny && <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>AKTYWNY</div>}
          {row?.pozycja === 1 && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>MISTRZOSTWO</div>}
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
          {s.biggestWin.score && <div style={{ padding: "0 24px 20px", fontSize: 12, color: "#475569" }}>Największa wygrana: {s.biggestWin.score} z {s.biggestWin.opponent}</div>}
        </>
      )}
    </div>
  );
}

function ArchiwumSezonCard({ s }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const isPuchar = s.liga.toLowerCase().includes("puchar");
  const drawaRow = detail?.tabela?.find((r) => isDrawa(r.nazwa));
  const drawaMecze = detail?.mecze || [];

  const wins = drawaMecze.filter((m) => {
    if (!m.score) return false;
    const [g1, g2] = m.score.split(":").map(Number);
    const dHome = isDrawa(m.team1);
    return dHome ? g1 > g2 : g2 > g1;
  }).length;
  const draws = drawaMecze.filter((m) => {
    if (!m.score) return false;
    const [g1, g2] = m.score.split(":").map(Number);
    return g1 === g2;
  }).length;
  const losses = drawaMecze.length - wins - draws;

  useEffect(() => {
    if (open && !detail) {
      fetch(`/api/archiwum?sezonId=${s.id}`)
        .then((r) => r.json())
        .then(setDetail)
        .catch(() => {});
    }
  }, [open, s.id, detail]);

  const resultColor = (m) => {
    if (!m.score) return "#334155";
    const [g1, g2] = m.score.split(":").map(Number);
    const dHome = isDrawa(m.team1);
    const dGoals = dHome ? g1 : g2;
    const oGoals = dHome ? g2 : g1;
    if (dGoals > oGoals) return "#22c55e";
    if (dGoals < oGoals) return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderLeft: isPuchar ? "4px solid #f59e0b" : "4px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, textAlign: "left" }}
      >
        <div>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 20, color: "#fff", letterSpacing: "0.08em" }}>
            {s.sezon || "—"}{" "}
            <span style={{ fontSize: 13, color: isPuchar ? "#f59e0b" : "#475569", fontFamily: "inherit" }}>{s.liga}</span>
          </div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
            {s._count.mecze} meczów{drawaRow ? ` · ${drawaRow.pozycja}. miejsce` : ""}
            {!open && ` · ${wins}W ${draws}R ${losses}P`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {drawaRow?.pozycja === 1 && <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700 }}>1. MIEJSCE</span>}
          <span style={{ color: "#475569", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {!detail ? (
            <div style={{ padding: 20, color: "#334155", fontSize: 12 }}>Ładowanie...</div>
          ) : (
            <>
              {detail.tabela.length > 0 && (
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.15em", marginBottom: 8 }}>TABELA</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ color: "#334155", fontSize: 10 }}>
                        <th style={{ textAlign: "left", padding: "4px 0" }}>#</th>
                        <th style={{ textAlign: "left" }}>Drużyna</th>
                        <th style={{ textAlign: "center", width: 30 }}>M</th>
                        <th style={{ textAlign: "center", width: 30, fontWeight: 700 }}>Pkt</th>
                        <th style={{ textAlign: "center", width: 30 }}>W</th>
                        <th style={{ textAlign: "center", width: 30 }}>R</th>
                        <th style={{ textAlign: "center", width: 30 }}>P</th>
                        <th style={{ textAlign: "center", width: 60 }}>Bramki</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.tabela.map((t) => (
                        <tr key={t.pozycja} style={{ color: isDrawa(t.nazwa) ? "#3b82f6" : "#94a3b8", fontWeight: isDrawa(t.nazwa) ? 700 : 400, background: isDrawa(t.nazwa) ? "rgba(59,130,246,0.05)" : "transparent" }}>
                          <td style={{ padding: "3px 0" }}>{t.pozycja}.</td>
                          <td>{t.nazwa}</td>
                          <td style={{ textAlign: "center" }}>{t.mecze}</td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{t.pkt}</td>
                          <td style={{ textAlign: "center" }}>{t.wygrane}</td>
                          <td style={{ textAlign: "center" }}>{t.remisy}</td>
                          <td style={{ textAlign: "center" }}>{t.przegrane}</td>
                          <td style={{ textAlign: "center" }}>{t.bramki}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.15em", marginBottom: 8 }}>MECZE DRAWY</div>
                {detail.mecze.map((m, i) => {
                  const hasStrzelcy = Array.isArray(m.strzelcy) && m.strzelcy.length > 0;
                  return (
                    <div key={i} style={{ padding: "6px 0", borderBottom: i < detail.mecze.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, color: "#334155", minWidth: 70, flexShrink: 0 }}>{m.date}</span>
                        <span style={{ fontSize: 12, color: isDrawa(m.team1) ? "#e2e8f0" : "#64748b", fontWeight: isDrawa(m.team1) ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.team1}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: resultColor(m), flexShrink: 0 }}>{m.score || "—"}</span>
                        <span style={{ fontSize: 12, color: isDrawa(m.team2) ? "#e2e8f0" : "#64748b", fontWeight: isDrawa(m.team2) ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.team2}</span>
                      </div>
                      {m.kolejka && <span style={{ fontSize: 9, color: "#1e293b", flexShrink: 0 }}>kol. {m.kolejka}</span>}
                      {hasStrzelcy && <span style={{ fontSize: 9, color: "#22c55e" }}>⚽ relacja</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ArchiwumPage() {
  const [sezony, setSezony] = useState(null);
  const [aktywnySezon, setAktywnySezon] = useState(null);
  const [archiwum, setArchiwum] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/liga/sezony").then((r) => r.json()),
      fetch("/api/ustawienia").then((r) => r.json()),
      fetch("/api/archiwum").then((r) => r.json()),
    ])
      .then(([s, u, a]) => {
        setSezony(Array.isArray(s) ? s : []);
        setAktywnySezon(u?.aktywny_sezon || null);
        setArchiwum(Array.isArray(a) ? a : []);
      })
      .catch(() => { setSezony([]); setArchiwum([]); });
  }, []);

  const ligowe = archiwum?.filter((s) => !s.liga.toLowerCase().includes("puchar")) || [];
  const pucharowe = archiwum?.filter((s) => s.liga.toLowerCase().includes("puchar")) || [];

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
            Historia MKS Drawa Drawno od 2006 roku · wyniki, tabele i statystyki
          </p>
        </div>

        <section style={{ padding: "0 20px 40px", background: "#030712" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2 }} />
              <div style={{ fontSize: 20, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Bieżące sezony</div>
            </div>

            {sezony === null ? (
              <div style={{ color: "#334155", padding: 24 }}>Ładowanie...</div>
            ) : sezony.length === 0 ? (
              <div style={{ color: "#334155", padding: 24 }}>Brak danych</div>
            ) : (
              sezony.map((s) => <SezonCard key={s} sezon={s} aktywny={s === aktywnySezon} />)
            )}
          </div>
        </section>

        <section style={{ padding: "0 20px 40px", background: "#030712" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2 }} />
              <div style={{ fontSize: 20, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
                Historia ligowa
                <span style={{ fontSize: 13, color: "#334155", marginLeft: 12 }}>{ligowe.length} sezonów</span>
              </div>
            </div>

            {archiwum === null ? (
              <div style={{ color: "#334155", padding: 24 }}>Ładowanie...</div>
            ) : ligowe.length === 0 ? (
              <div style={{ color: "#334155", padding: 24 }}>Brak danych</div>
            ) : (
              ligowe.map((s) => <ArchiwumSezonCard key={s.id} s={s} />)
            )}
          </div>
        </section>

        {pucharowe.length > 0 && (
          <section style={{ padding: "0 20px 40px", background: "#030712" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 4, height: 24, background: "#f59e0b", borderRadius: 2 }} />
                <div style={{ fontSize: 20, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
                  Puchar Polski
                  <span style={{ fontSize: 13, color: "#334155", marginLeft: 12 }}>{pucharowe.length} edycji</span>
                </div>
              </div>
              {pucharowe.map((s) => <ArchiwumSezonCard key={s.id} s={s} />)}
            </div>
          </section>
        )}

        <div style={{ padding: "0 20px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", letterSpacing: "0.08em", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "10px 20px", display: "inline-block" }}>
            ← Powrót na stronę główną
          </Link>
        </div>
      </div>
    </>
  );
}
