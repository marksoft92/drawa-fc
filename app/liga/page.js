import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import LigaClient from "./LigaClient";
import { isDrawa } from "@/lib/ligaUtils";

export const revalidate = 60;

export async function generateMetadata() {
  const ust = Object.fromEntries((await prisma.ustawienie.findMany()).map(r => [r.klucz, r.wartosc]));
  const klasa = ust.aktywny_klasa || "B Klasa";
  const sezon = ust.aktywny_sezon || "2025/26";
  return {
    title: `${klasa} Zachodniopomorskie — Tabela, Wyniki, Terminarz | Sezon ${sezon}`,
    description: `${klasa} Zachodniopomorska — aktualna tabela ligowa, wyniki meczów, terminarz i statystyki sezonu ${sezon}. Składy drużyn, strzelcy, przebieg spotkań.`,
    alternates: { canonical: "https://mksdrawadrawno.pl/liga" },
    openGraph: {
      title: `${klasa} Zachodniopomorskie — Tabela i Wyniki`,
      description: `Tabela, wyniki i terminarz ${klasa} Zachodniopomorska sezon ${sezon}.`,
      url: "https://mksdrawadrawno.pl/liga",
    },
  };
}

export default async function LigaPage() {
  const ust = Object.fromEntries((await prisma.ustawienie.findMany()).map(r => [r.klucz, r.wartosc]));
  const sezon = ust.aktywny_sezon || "2025/26";
  const klasa = ust.aktywny_klasa || "B Klasa";

  const [tabelaData, meczeData] = await Promise.all([
    prisma.tabelaDruzyna.findMany({ where: { sezon }, orderBy: { pozycja: "asc" } }),
    prisma.mecz.findMany({ where: { sezon }, orderBy: { date: "asc" } }),
  ]);

  const ligowe = meczeData.filter(m => !m.liga?.toLowerCase().includes('puchar'));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Liga" }] }) }} />
      <NavBar backLabel="← Strona główna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>
        <div style={{ padding: "48px 20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#3b82f6", marginBottom: 12 }}>SEZON {sezon}</div>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(32px, 7vw, 56px)", letterSpacing: "0.06em", margin: 0 }}>
            {klasa} <span style={{ color: "#3b82f6" }}>Zachodniopomorskie</span>
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 8, marginBottom: 32 }}>
            {tabelaData.length} drużyn · {ligowe.filter(m => m.score).length} rozegranych meczów
          </p>
        </div>

        {/* Tabela */}
        <section style={{ padding: "0 20px 40px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2 }} />
              <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", fontWeight: "normal" }}>Tabela</span>
            </h2>
            <Link href="/liga/tabela" style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none", letterSpacing: "0.1em", fontWeight: 600 }}>PEŁNA TABELA →</Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["#", "Drużyna", "M", "W", "R", "P", "BZ:BS", "Pkt"].map(h => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: h === "Drużyna" ? "left" : "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabelaData.map(t => {
                  const drawa = isDrawa(t.nazwa);
                  return (
                    <tr key={t.pozycja} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: drawa ? "rgba(59,130,246,0.06)" : "transparent" }}>
                      <td style={{ padding: "10px 6px", textAlign: "center", fontSize: 12, color: t.pozycja <= 1 ? "#22c55e" : "#475569", fontWeight: 700 }}>{t.pozycja}</td>
                      <td style={{ padding: "10px 6px", display: "flex", alignItems: "center", gap: 8 }}>
                        {t.herb && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={drawa ? "/logo.png" : t.herb} alt={t.nazwa} width={drawa ? 28 : 20} height={drawa ? 28 : 20} style={{ objectFit: "contain", borderRadius: 3 }} />
                        )}
                        <span style={{ color: drawa ? "#3b82f6" : "#e2e8f0", fontWeight: drawa ? 700 : 400 }}>{t.nazwa}</span>
                      </td>
                      <td style={{ textAlign: "center", color: "#475569" }}>{t.mecze}</td>
                      <td style={{ textAlign: "center", color: "#22c55e" }}>{t.wygrane}</td>
                      <td style={{ textAlign: "center", color: "#f59e0b" }}>{t.remisy}</td>
                      <td style={{ textAlign: "center", color: "#ef4444" }}>{t.przegrane}</td>
                      <td style={{ textAlign: "center", color: "#475569" }}>{t.bramkiZd}:{t.bramkiStr}</td>
                      <td style={{ textAlign: "center", color: "#fff", fontWeight: 700 }}>{t.pkt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mecze — client component z rozwijaniem */}
        <section style={{ padding: "0 20px 60px", maxWidth: 900, margin: "0 auto" }}>
          <LigaClient mecze={JSON.parse(JSON.stringify(ligowe))} />
        </section>
      </main>

      <style>{`.liga-card:hover { transform: translateY(-2px); border-color: rgba(59,130,246,0.3) !important; }`}</style>
    </>
  );
}
