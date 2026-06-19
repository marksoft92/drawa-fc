import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";
import { groupByKolejka, isDrawa } from "@/lib/ligaUtils";

export const revalidate = 60;

async function getData(nr) {
  const ust = Object.fromEntries((await prisma.ustawienie.findMany()).map(r => [r.klucz, r.wartosc]));
  const sezon = ust.aktywny_sezon || "2025/26";
  const klasa = ust.aktywny_klasa || "B Klasa";
  const mecze = await prisma.mecz.findMany({ where: { sezon }, orderBy: { date: "asc" } });
  const kolejki = groupByKolejka(mecze);
  const kolejka = kolejki.find(k => k.nr === Number(nr));
  return { kolejka, kolejki, klasa, sezon };
}

export async function generateMetadata({ params }) {
  const { nr } = await params;
  const { kolejka, klasa, sezon } = await getData(nr);
  if (!kolejka) return {};
  return {
    title: `Kolejka ${nr} — ${klasa} Zachodniopomorskie ${sezon} | Wyniki, składy, strzelcy`,
    description: `Wyniki ${kolejka.mecze.length} meczów z ${nr}. kolejki ${klasa} Zachodniopomorska sezon ${sezon}. Składy drużyn, strzelcy bramek, kartki i przebieg spotkań.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/liga/kolejka/${nr}` },
  };
}

function MatchCard({ m }) {
  const hasScore = !!m.score;
  const drawa1 = isDrawa(m.team1);
  const drawa2 = isDrawa(m.team2);
  const isDraMatch = drawa1 || drawa2;

  const zdarzenia = Array.isArray(m.wszystkieZdarzenia) ? m.wszystkieZdarzenia : [];
  const goleGosp = zdarzenia.filter(z => z.typ === "gol" && z.strona === "gospodarze");
  const goleGosc = zdarzenia.filter(z => z.typ === "gol" && z.strona === "goscie");
  const kartkiAll = zdarzenia.filter(z => z.typ?.includes("kartka"));

  const sklady = m.sklady || {};
  const skladGosp = sklady.gospodarze || {};
  const skladGosc = sklady.goscie || {};
  const hasSquad = (skladGosp.pierwsza11?.length > 0) || (skladGosc.pierwsza11?.length > 0);

  return (
    <div style={{
      background: isDraMatch ? "rgba(59,130,246,0.04)" : "#0f172a",
      border: `1px solid ${isDraMatch ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Wynik */}
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            {m.herb1 && !m.herb1.includes("flags/0") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={drawa1 ? "/logo.png" : m.herb1} alt={m.team1} width={drawa1 ? 28 : 22} height={drawa1 ? 28 : 22} style={{ objectFit: "contain", borderRadius: 3 }} />
            )}
            <span style={{ fontSize: 14, fontWeight: drawa1 ? 700 : 400, color: drawa1 ? "#3b82f6" : "#e2e8f0" }}>{m.team1}</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 32, minWidth: 80, textAlign: "center", color: hasScore ? "#fff" : "#334155" }}>
          {hasScore ? m.score : "— : —"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: drawa2 ? 700 : 400, color: drawa2 ? "#3b82f6" : "#e2e8f0" }}>{m.team2}</span>
            {m.herb2 && !m.herb2.includes("flags/0") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={drawa2 ? "/logo.png" : m.herb2} alt={m.team2} width={drawa2 ? 28 : 22} height={drawa2 ? 28 : 22} style={{ objectFit: "contain", borderRadius: 3 }} />
            )}
          </div>
        </div>
      </div>

      {m.walkower && <div style={{ padding: "0 24px 12px", fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", fontWeight: 700 }}>WALKOWER</div>}

      {/* Timeline zdarzeń */}
      {zdarzenia.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 24px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", marginBottom: 10 }}>PRZEBIEG MECZU</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {zdarzenia.map((z, i) => {
              const isGosp = z.strona === "gospodarze";
              const isGol = z.typ === "gol" || z.typ === "samobój";
              const isYellow = z.typ === "żółta kartka";
              const isRed = z.typ?.includes("czerwona");
              const icon = isGol ? "⚽" : isYellow ? "🟨" : isRed ? "🟥" : "🔄";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 12, gap: 6, flexDirection: isGosp ? "row" : "row-reverse" }}>
                  <div style={{ flex: 1, textAlign: isGosp ? "right" : "left", color: isGol ? "#fff" : "#64748b", fontWeight: isGol ? 600 : 400 }}>
                    {isGosp && <>{z.zawodnik}{isGol && z.wynik_po ? <span style={{ color: "#334155", fontSize: 10 }}> ({z.wynik_po})</span> : null}</>}
                  </div>
                  <div style={{ width: 50, textAlign: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11 }}>{icon}</span>
                    <span style={{ fontSize: 10, color: "#475569", marginLeft: 3 }}>{z.minuta}&apos;</span>
                  </div>
                  <div style={{ flex: 1, textAlign: isGosp ? "left" : "right", color: isGol ? "#fff" : "#64748b", fontWeight: isGol ? 600 : 400 }}>
                    {!isGosp && <>{z.zawodnik}{isGol && z.wynik_po ? <span style={{ color: "#334155", fontSize: 10 }}> ({z.wynik_po})</span> : null}</>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Składy */}
      {hasSquad && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 24px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", marginBottom: 10 }}>SKŁADY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[{ sklad: skladGosp, label: m.team1, isDrawa: drawa1 }, { sklad: skladGosc, label: m.team2, isDrawa: drawa2 }].map(({ sklad, label, isDrawa: isDr }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isDr ? "#3b82f6" : "#475569", letterSpacing: "0.08em", marginBottom: 6 }}>{label.toUpperCase()}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {(sklad.pierwsza11 || []).map((p, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <span style={{ color: "#334155", width: 16, textAlign: "right", flexShrink: 0, fontSize: 10 }}>{p.numer || ""}</span>
                      <span style={{ color: p.gole_w_meczu > 0 ? "#3b82f6" : "#94a3b8" }}>
                        {p.nazwisko}
                        {p.gole_w_meczu > 0 && <span style={{ color: "#3b82f6", marginLeft: 4 }}>⚽{p.gole_w_meczu > 1 ? `×${p.gole_w_meczu}` : ""}</span>}
                        {p.kartka_w_meczu && <span style={{ marginLeft: 4 }}>{p.kartka_w_meczu === "żółta" ? "🟨" : "🟥"}</span>}
                      </span>
                    </div>
                  ))}
                  {(sklad.rezerwa || []).length > 0 && (
                    <>
                      <div style={{ fontSize: 9, color: "#1e293b", marginTop: 4, letterSpacing: "0.1em" }}>REZERWA</div>
                      {(sklad.rezerwa || []).map((p, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                          <span style={{ color: "#334155", width: 16, textAlign: "right", flexShrink: 0, fontSize: 10 }}>{p.numer || ""}</span>
                          <span style={{ color: p.gole_w_meczu > 0 ? "#3b82f6" : "#475569" }}>
                            {p.nazwisko}
                            {p.gole_w_meczu > 0 && <span style={{ color: "#3b82f6", marginLeft: 4 }}>⚽{p.gole_w_meczu > 1 ? `×${p.gole_w_meczu}` : ""}</span>}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function KolejkaPage({ params }) {
  const { nr } = await params;
  const { kolejka, kolejki, klasa, sezon } = await getData(nr);
  if (!kolejka) notFound();

  const nrNum = Number(nr);
  const prev = kolejki.find(k => k.nr === nrNum - 1);
  const next = kolejki.find(k => k.nr === nrNum + 1);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Liga", item: "https://mksdrawadrawno.pl/liga" }, { "@type": "ListItem", position: 3, name: `Kolejka ${nr}` }] }) }} />
      <NavBar backLabel="← Liga" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 20px 60px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            {prev ? <Link href={`/liga/kolejka/${prev.nr}`} style={{ fontSize: 12, color: "#475569", textDecoration: "none" }}>← Kolejka {prev.nr}</Link> : <span />}
            {next ? <Link href={`/liga/kolejka/${next.nr}`} style={{ fontSize: 12, color: "#475569", textDecoration: "none" }}>Kolejka {next.nr} →</Link> : <span />}
          </div>

          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#3b82f6", marginBottom: 8 }}>{klasa} · SEZON {sezon}</div>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(32px, 7vw, 52px)", letterSpacing: "0.06em", margin: "0 0 4px" }}>
            Kolejka <span style={{ color: "#3b82f6" }}>{nr}</span>
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>{kolejka.date} · {kolejka.mecze.length} meczów</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {kolejka.mecze.map((m, i) => <MatchCard key={i} m={m} />)}
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/liga" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>← WSZYSTKIE KOLEJKI</Link>
            <Link href="/liga/tabela" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>TABELA</Link>
          </div>
        </div>
      </main>
    </>
  );
}
