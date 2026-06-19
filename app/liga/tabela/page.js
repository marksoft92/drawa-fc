import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import { isDrawa } from "@/lib/ligaUtils";

export const revalidate = 60;

export async function generateMetadata() {
  const ust = Object.fromEntries((await prisma.ustawienie.findMany()).map(r => [r.klucz, r.wartosc]));
  const klasa = ust.aktywny_klasa || "B Klasa";
  const sezon = ust.aktywny_sezon || "2025/26";
  return {
    title: `Tabela ${klasa} Zachodniopomorskie ${sezon} — Klasyfikacja, Punktacja`,
    description: `Aktualna tabela ${klasa} Zachodniopomorska sezon ${sezon}. Pozycje, punkty, bramki, bilans meczów, forma drużyn. Sprawdź kto prowadzi w lidze.`,
    alternates: { canonical: "https://mksdrawadrawno.pl/liga/tabela" },
  };
}

export default async function TabelaPage() {
  const ust = Object.fromEntries((await prisma.ustawienie.findMany()).map(r => [r.klucz, r.wartosc]));
  const sezon = ust.aktywny_sezon || "2025/26";
  const klasa = ust.aktywny_klasa || "B Klasa";
  const tabela = await prisma.tabelaDruzyna.findMany({ where: { sezon }, orderBy: { pozycja: "asc" } });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Liga", item: "https://mksdrawadrawno.pl/liga" }, { "@type": "ListItem", position: 3, name: "Tabela" }] }) }} />
      <NavBar backLabel="← Liga" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 20px 60px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#3b82f6", marginBottom: 8 }}>SEZON {sezon}</div>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 6vw, 48px)", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Tabela <span style={{ color: "#3b82f6" }}>{klasa}</span>
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>{klasa} Zachodniopomorskie · {tabela.length} drużyn</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.08)" }}>
                  {["#", "Drużyna", "M", "W", "R", "P", "BZ", "BS", "+/-", "Pkt", "Forma"].map(h => (
                    <th key={h} style={{ padding: "10px 6px", textAlign: h === "Drużyna" ? "left" : "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabela.map(t => {
                  const drawa = isDrawa(t.nazwa);
                  const diff = t.bramkiZd - t.bramkiStr;
                  const forma = t.forma?.split('') || [];
                  return (
                    <tr key={t.pozycja} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: drawa ? "rgba(59,130,246,0.06)" : "transparent" }}>
                      <td style={{ padding: "12px 6px", textAlign: "center", fontSize: 14, color: t.pozycja <= 1 ? "#22c55e" : t.pozycja >= tabela.length - 1 ? "#ef4444" : "#475569", fontWeight: 700 }}>{t.pozycja}</td>
                      <td style={{ padding: "12px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {t.herb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <Image src={drawa ? "/logo.png" : (t.herb || "/logo.png")} alt={t.nazwa} width={drawa ? 28 : 20} height={drawa ? 28 : 20} style={{ objectFit: "contain", borderRadius: 3 }} />
                          )}
                          <span style={{ color: drawa ? "#3b82f6" : "#e2e8f0", fontWeight: drawa ? 700 : 400 }}>{t.nazwa}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", color: "#475569" }}>{t.mecze}</td>
                      <td style={{ textAlign: "center", color: "#22c55e" }}>{t.wygrane}</td>
                      <td style={{ textAlign: "center", color: "#f59e0b" }}>{t.remisy}</td>
                      <td style={{ textAlign: "center", color: "#ef4444" }}>{t.przegrane}</td>
                      <td style={{ textAlign: "center", color: "#475569" }}>{t.bramkiZd}</td>
                      <td style={{ textAlign: "center", color: "#475569" }}>{t.bramkiStr}</td>
                      <td style={{ textAlign: "center", color: diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#475569", fontWeight: 600 }}>{diff > 0 ? `+${diff}` : diff}</td>
                      <td style={{ textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>{t.pkt}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                          {forma.slice(-5).map((f, i) => (
                            <div key={i} style={{ width: 16, height: 16, borderRadius: 3, fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: f === "W" ? "#22c55e" : f === "D" ? "#f59e0b" : f === "L" ? "#ef4444" : "#334155" }}>
                              {f === "W" ? "W" : f === "D" ? "R" : f === "L" ? "P" : "?"}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <Link href="/liga" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>← LIGA</Link>
          </div>
        </div>
      </main>
    </>
  );
}
