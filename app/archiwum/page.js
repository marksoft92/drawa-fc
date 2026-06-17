"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { computeTeamStats } from "@/lib/computeStats";

const isDrawa = (n) => n?.toLowerCase().includes("drawa drawno");

const SectionLabel = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
    <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>{children}</div>
  </div>
);

const resultBadge = (score, team1, team2) => {
  if (!score) return { label: "—", color: "#334155", bg: "transparent" };
  const [g1, g2] = score.split(":").map(Number);
  const dHome = isDrawa(team1);
  const dGoals = dHome ? g1 : g2;
  const oGoals = dHome ? g2 : g1;
  if (dGoals > oGoals) return { label: "W", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (dGoals < oGoals) return { label: "P", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  return { label: "R", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
};

function SezonCard({ sezon, aktywny }) {
  const [tabela, setTabela] = useState(null);
  const [mecze, setMecze] = useState(null);

  useEffect(() => {
    const enc = encodeURIComponent(sezon);
    Promise.all([
      fetch(`/api/liga/tabela?sezon=${enc}`).then((r) => r.json()),
      fetch(`/api/liga/mecze?sezon=${enc}`).then((r) => r.json()),
    ])
      .then(([t, m]) => { setTabela(Array.isArray(t) ? t : []); setMecze(Array.isArray(m) ? m : []); })
      .catch(() => { setTabela([]); setMecze([]); });
  }, [sezon]);

  const loading = tabela === null || mecze === null;
  const s = mecze ? computeTeamStats(mecze) : null;
  const row = tabela ? tabela.find((r) => isDrawa(r.nazwa)) : null;

  return (
    <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderLeft: aktywny ? "4px solid #3b82f6" : "4px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.08em" }}>SEZON {sezon}</div>
          {row && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{row.pozycja}. miejsce</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {aktywny && <span style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>AKTYWNY</span>}
          {row?.pozycja === 1 && <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>MISTRZOSTWO</span>}
        </div>
      </div>
      {loading ? (
        <div style={{ padding: 24, color: "#334155", fontSize: 12 }}>Ładowanie...</div>
      ) : s && (
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 12 }}>
          {[
            { v: row?.pkt ?? "—", l: "PKT" },
            { v: s.total, l: "MECZÓW" },
            { v: s.wins, l: "W" },
            { v: s.draws, l: "R" },
            { v: s.losses, l: "P" },
            { v: `${s.golesFor}:${s.golesAgainst}`, l: "BRAMKI" },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 28, color: "#3b82f6", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.2em", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiwumSezonCard({ s }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const isPuchar = s.liga.toLowerCase().includes("puchar");

  useEffect(() => {
    if (open && !detail) {
      fetch(`/api/archiwum?sezonId=${s.id}`).then((r) => r.json()).then(setDetail).catch(() => {});
    }
  }, [open, s.id, detail]);

  const drawaRow = detail?.tabela?.find((r) => isDrawa(r.nazwa));

  return (
    <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderLeft: isPuchar ? "4px solid #f59e0b" : "4px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.2)", transition: "border-color 0.2s" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: open ? "rgba(255,255,255,0.02)" : "none", border: "none", cursor: "pointer", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, textAlign: "left" }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.08em" }}>{s.sezon || "—"}</span>
            <span style={{ fontSize: 12, color: isPuchar ? "#f59e0b" : "#64748b", letterSpacing: "0.06em" }}>{s.liga}</span>
          </div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>
            {s._count.mecze} meczów{s._count.tabela > 0 ? ` · ${s._count.tabela} drużyn` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {drawaRow?.pozycja === 1 && <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 20, padding: "4px 10px", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}>1. MIEJSCE</span>}
          <span style={{ color: "#475569", fontSize: 10, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {!detail ? (
            <div style={{ padding: 24, color: "#334155", fontSize: 12 }}>Ładowanie...</div>
          ) : (
            <>
              {detail.tabela.length > 0 && (
                <div style={{ padding: "16px 16px 8px", overflowX: "auto" }}>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.2em", marginBottom: 10, fontWeight: 600 }}>TABELA</div>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px", minWidth: 480 }}>
                    <thead>
                      <tr>
                        {["#", "Drużyna", "M", "W", "R", "P", "Bramki", "Pkt"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: h === "Drużyna" ? "left" : "center", fontSize: 9, color: "#475569", letterSpacing: "0.15em", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.tabela.map((t, i) => {
                        const highlight = isDrawa(t.nazwa);
                        return (
                          <tr key={i} style={{ background: highlight ? "linear-gradient(90deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <span style={{ width: 22, height: 22, borderRadius: "50%", background: highlight ? "#3b82f6" : "transparent", border: highlight ? "none" : "1px solid rgba(255,255,255,0.08)", color: highlight ? "#fff" : "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{t.pozycja}</span>
                            </td>
                            <td style={{ padding: "8px", fontSize: 13, fontWeight: highlight ? 700 : 400, color: highlight ? "#fff" : "#94a3b8" }}>{t.nazwa}</td>
                            {[t.mecze, t.wygrane, t.remisy, t.przegrane].map((v, j) => (
                              <td key={j} style={{ padding: "8px", textAlign: "center", fontSize: 12, color: highlight ? "#cbd5e1" : "#64748b" }}>{v}</td>
                            ))}
                            <td style={{ padding: "8px", textAlign: "center", fontSize: 12, color: highlight ? "#cbd5e1" : "#64748b" }}>{t.bramki}</td>
                            <td style={{ padding: "8px", textAlign: "center", fontSize: 15, fontWeight: 800, color: highlight ? "#3b82f6" : "#94a3b8", fontFamily: "'Bebas Neue', Impact, sans-serif" }}>{t.pkt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ padding: "16px 16px 20px" }}>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.2em", marginBottom: 10, fontWeight: 600 }}>MECZE DRAWY</div>
                {detail.mecze.map((m, i) => {
                  const { label, color, bg } = resultBadge(m.score, m.team1, m.team2);
                  const hasRelacja = Array.isArray(m.strzelcy) && m.strzelcy.length > 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 8, marginBottom: 2, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "#334155", minWidth: 72, flexShrink: 0 }}>{m.date}</span>
                      {m.kolejka && <span style={{ fontSize: 9, color: "#1e293b", background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>kol. {m.kolejka}</span>}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: isDrawa(m.team1) ? "#fff" : "#64748b", fontWeight: isDrawa(m.team1) ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textAlign: "right" }}>{m.team1}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color, background: bg, borderRadius: 6, padding: "2px 8px", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em", flexShrink: 0, minWidth: 44, textAlign: "center" }}>{m.score || "—"}</span>
                        <span style={{ fontSize: 12, color: isDrawa(m.team2) ? "#fff" : "#64748b", fontWeight: isDrawa(m.team2) ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{m.team2}</span>
                      </div>
                      {hasRelacja && <span style={{ fontSize: 8, color: "#22c55e", letterSpacing: "0.1em", flexShrink: 0 }}>RELACJA</span>}
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
  const [rywale, setRywale] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/liga/sezony").then((r) => r.json()),
      fetch("/api/ustawienia").then((r) => r.json()),
      fetch("/api/archiwum").then((r) => r.json()),
      fetch("/api/druzyny").then((r) => r.json()),
    ])
      .then(([s, u, a, r]) => {
        setSezony(Array.isArray(s) ? s : []);
        setAktywnySezon(u?.aktywny_sezon || null);
        setArchiwum(Array.isArray(a) ? a : []);
        setRywale(Array.isArray(r) ? r : []);
      })
      .catch(() => { setSezony([]); setArchiwum([]); });
  }, []);

  const ligowe = archiwum?.filter((s) => !s.liga.toLowerCase().includes("puchar")) || [];
  const pucharowe = archiwum?.filter((s) => s.liga.toLowerCase().includes("puchar")) || [];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #030712; color: #fff; font-family: -apple-system,'Segoe UI',sans-serif; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }`}</style>
      <NavBar backLabel="← Strona główna" />

      <main style={{ paddingTop: 64 }}>
        <div style={{ padding: "60px 20px 48px", background: "#030712", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(40px, 8vw, 64px)", color: "#fff", letterSpacing: "0.1em", margin: 0, textShadow: "0 0 60px rgba(59,130,246,0.3)" }}>
            ARCHIWUM
          </h1>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 8, letterSpacing: "0.2em" }}>
            HISTORIA MKS DRAWA DRAWNO OD 2006 ROKU
          </p>
        </div>

        <section style={{ padding: "0 20px 48px", background: "#030712" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SectionLabel>Bieżące sezony</SectionLabel>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Dane z bieżącego scrapera</div>
            <div style={{ marginTop: 24 }}>
              {sezony === null ? (
                <div style={{ color: "#334155", padding: 24, fontSize: 13 }}>Ładowanie...</div>
              ) : sezony.length === 0 ? (
                <div style={{ color: "#334155", padding: 24, fontSize: 13 }}>Brak danych</div>
              ) : (
                sezony.map((s) => <SezonCard key={s} sezon={s} aktywny={s === aktywnySezon} />)
              )}
            </div>
          </div>
        </section>

        <section style={{ padding: "0 20px 48px", background: "#030712" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SectionLabel>Historia ligowa</SectionLabel>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{ligowe.length} sezonów · 2006–2022</div>
            <div style={{ marginTop: 24 }}>
              {archiwum === null ? (
                <div style={{ color: "#334155", padding: 24, fontSize: 13 }}>Ładowanie...</div>
              ) : ligowe.length === 0 ? (
                <div style={{ color: "#334155", padding: 24, fontSize: 13 }}>Brak danych</div>
              ) : (
                ligowe.map((s) => <ArchiwumSezonCard key={s.id} s={s} />)
              )}
            </div>
          </div>
        </section>

        {pucharowe.length > 0 && (
          <section style={{ padding: "0 20px 48px", background: "#030712" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 4, height: 24, background: "#f59e0b", borderRadius: 2, boxShadow: "0 0 12px rgba(245,158,11,0.5)" }} />
                <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Puchar Polski</div>
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{pucharowe.length} edycji</div>
              <div style={{ marginTop: 24 }}>
                {pucharowe.map((s) => <ArchiwumSezonCard key={s.id} s={s} />)}
              </div>
            </div>
          </section>
        )}

        {rywale && rywale.length > 0 && (
          <section style={{ padding: "0 20px 48px", background: "#030712" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
                <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
                  Rywale Drawy
                  <span style={{ fontSize: 13, color: "#334155", marginLeft: 12 }}>{rywale.length} drużyn</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>Historia spotkań z każdą drużyną, z którą grała Drawa od 2002 roku</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {rywale.map((r) => (
                  <Link key={r.slug} href={`/druzyna/${r.slug}`} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 14px", textDecoration: "none", fontSize: 12, color: "#94a3b8", transition: "border-color 0.2s, color 0.2s", display: "inline-flex", alignItems: "center", gap: 6 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
                  >
                    {r.nazwa}
                    <span style={{ fontSize: 10, color: "#334155" }}>{r.mecze}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div style={{ padding: "0 20px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <Link
            href="/"
            style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", letterSpacing: "0.14em", fontWeight: 600, border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "12px 32px", display: "inline-block", transition: "background 0.2s, border-color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.08)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
          >
            POWRÓT NA STRONĘ GŁÓWNĄ
          </Link>
        </div>
      </main>
    </>
  );
}
