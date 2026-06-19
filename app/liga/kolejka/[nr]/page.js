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
    title: `Kolejka ${nr} — ${klasa} Zachodniopomorskie ${sezon} | Wyniki meczów`,
    description: `Wyniki ${kolejka.mecze.length} meczów z ${nr}. kolejki ${klasa} Zachodniopomorska sezon ${sezon}. Strzelcy, składy, szczegóły spotkań.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/liga/kolejka/${nr}` },
  };
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

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {kolejka.mecze.map((m, i) => {
              const hasScore = !!m.score;
              const [g1, g2] = hasScore ? m.score.split(":").map(Number) : [0, 0];
              const drawa1 = isDrawa(m.team1);
              const drawa2 = isDrawa(m.team2);
              const isDrawa = drawa1 || drawa2;

              const strzelcy = Array.isArray(m.strzelcy) ? m.strzelcy : [];
              const gospodarze = strzelcy.filter(s => s.strona === "gospodarze");
              const goscie = strzelcy.filter(s => s.strona === "goscie");

              return (
                <div key={i} style={{
                  background: isDrawa ? "rgba(59,130,246,0.04)" : "#0f172a",
                  border: `1px solid ${isDrawa ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 12, padding: "20px 24px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: drawa1 ? 700 : 400, color: drawa1 ? "#3b82f6" : "#e2e8f0" }}>{m.team1}</div>
                    </div>

                    <div style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 28, minWidth: 70, textAlign: "center",
                      color: hasScore ? "#fff" : "#334155",
                    }}>
                      {hasScore ? m.score : "— : —"}
                    </div>

                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: drawa2 ? 700 : 400, color: drawa2 ? "#3b82f6" : "#e2e8f0" }}>{m.team2}</div>
                    </div>
                  </div>

                  {(gospodarze.length > 0 || goscie.length > 0) && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#475569" }}>
                      <div style={{ textAlign: "right", flex: 1 }}>
                        {gospodarze.map((s, j) => <div key={j}>{s.zawodnik} {s.minuta && `${s.minuta}'`}</div>)}
                      </div>
                      <div style={{ width: 70 }} />
                      <div style={{ textAlign: "left", flex: 1 }}>
                        {goscie.map((s, j) => <div key={j}>{s.zawodnik} {s.minuta && `${s.minuta}'`}</div>)}
                      </div>
                    </div>
                  )}

                  {m.walkower && <div style={{ marginTop: 8, fontSize: 10, color: "#f59e0b", letterSpacing: "0.1em" }}>WALKOWER</div>}
                </div>
              );
            })}
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
