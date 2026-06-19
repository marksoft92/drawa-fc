import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";
import { isDrawa } from "@/lib/ligaUtils";

export const revalidate = 60;

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const m = await prisma.mecz.findUnique({ where: { id } });
  if (!m || m.liga?.toLowerCase().includes("puchar")) return {};
  const opp = isDrawa(m.team1) ? m.team2 : m.team1;
  const home = isDrawa(m.team1);
  return {
    title: `${home ? "Drawa Drawno" : opp} vs ${home ? opp : "Drawa Drawno"} ${m.score || ""} — ${m.date || ""}`,
    description: `Relacja z meczu ${m.team1} — ${m.team2}${m.score ? ` (${m.score})` : ""}. Składy drużyn, strzelcy bramek, przebieg spotkania minuta po minucie. ${m.liga || ""} sezon ${m.sezon}.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/liga/mecz/${id}` },
  };
}

function EventIcon({ typ }) {
  if (typ === "gol" || typ === "samobój") return <span>⚽</span>;
  if (typ === "żółta kartka") return <span>🟨</span>;
  if (typ?.includes("czerwona")) return <span>🟥</span>;
  return <span>🔄</span>;
}

export default async function MeczPage({ params }) {
  const { id } = await params;
  const m = await prisma.mecz.findUnique({ where: { id } });
  if (!m) notFound();

  const drawa1 = isDrawa(m.team1);
  const drawa2 = isDrawa(m.team2);
  const opp = drawa1 ? m.team2 : m.team1;
  const oppSlug = slugify(opp);

  const zdarzenia = Array.isArray(m.wszystkieZdarzenia) ? m.wszystkieZdarzenia : [];
  const sklady = m.sklady || {};
  const skladGosp = sklady.gospodarze || {};
  const skladGosc = sklady.goscie || {};
  const hasSquad = (skladGosp.pierwsza11?.length > 0) || (skladGosc.pierwsza11?.length > 0);

  const allMecze = await prisma.mecz.findMany({
    where: { sezon: m.sezon, NOT: { liga: { contains: "Puchar" } } },
    orderBy: { date: "asc" },
    select: { id: true, team1: true, team2: true, score: true, date: true },
  });
  const ligowe = allMecze.filter(x => !x.score || x.id === m.id || x.score);
  const idx = ligowe.findIndex(x => x.id === m.id);
  const prev = idx > 0 ? ligowe[idx - 1] : null;
  const next = idx < ligowe.length - 1 ? ligowe[idx + 1] : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org", "@type": "SportsEvent",
          name: `${m.team1} vs ${m.team2}`,
          startDate: m.date || undefined,
          homeTeam: { "@type": "SportsTeam", name: m.team1 },
          awayTeam: { "@type": "SportsTeam", name: m.team2 },
          location: drawa1 ? { "@type": "Place", name: "Stadion MKS Drawa Drawno", address: { "@type": "PostalAddress", addressLocality: "Drawno" } } : undefined,
        },
        {
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Liga", item: "https://mksdrawadrawno.pl/liga" },
            { "@type": "ListItem", position: 3, name: `${m.team1} vs ${m.team2}` },
          ],
        },
      ]) }} />
      <NavBar backLabel="← Liga" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 20px 60px" }}>

          {/* Nav prev/next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            {prev ? <Link href={`/liga/mecz/${prev.id}`} style={{ fontSize: 11, color: "#475569", textDecoration: "none" }}>← {isDrawa(prev.team1) ? prev.team2 : prev.team1}</Link> : <span />}
            {next ? <Link href={`/liga/mecz/${next.id}`} style={{ fontSize: 11, color: "#475569", textDecoration: "none" }}>{isDrawa(next.team1) ? next.team2 : next.team1} →</Link> : <span />}
          </div>

          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#334155", marginBottom: 16 }}>{m.liga} · {m.date}</div>

          {/* Wynik hero */}
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "32px 24px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(16px, 5vw, 48px)" }}>
              <div style={{ textAlign: "center" }}>
                {m.herb1 && !m.herb1.includes("flags/0") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image src={drawa1 ? "/logo.png" : (m.herb1 || "/logo.png")} alt={m.team1} width={drawa1 ? 56 : 44} height={drawa1 ? 56 : 44} style={{ objectFit: "contain", borderRadius: 4, marginBottom: 8 }} />
                )}
                <div style={{ fontSize: 13, fontWeight: drawa1 ? 700 : 400, color: drawa1 ? "#3b82f6" : "#e2e8f0" }}>{m.team1}</div>
              </div>

              <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(40px, 10vw, 64px)", color: "#fff", margin: 0, letterSpacing: "0.06em" }}>
                {m.score || "— : —"}
              </h1>

              <div style={{ textAlign: "center" }}>
                {m.herb2 && !m.herb2.includes("flags/0") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image src={drawa2 ? "/logo.png" : (m.herb2 || "/logo.png")} alt={m.team2} width={drawa2 ? 56 : 44} height={drawa2 ? 56 : 44} style={{ objectFit: "contain", borderRadius: 4, marginBottom: 8 }} />
                )}
                <div style={{ fontSize: 13, fontWeight: drawa2 ? 700 : 400, color: drawa2 ? "#3b82f6" : "#e2e8f0" }}>{m.team2}</div>
              </div>
            </div>
            {m.walkower && <div style={{ marginTop: 12, fontSize: 11, color: "#f59e0b", letterSpacing: "0.12em", fontWeight: 700 }}>WALKOWER</div>}
          </div>

          {/* Timeline */}
          {zdarzenia.length > 0 && (
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 14 }}>PRZEBIEG MECZU</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {zdarzenia.map((z, i) => {
                  const isGosp = z.strona === "gospodarze";
                  const isGol = z.typ === "gol" || z.typ === "samobój";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < zdarzenia.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      <div style={{ flex: 1, textAlign: "right", fontSize: 12, color: isGosp ? (isGol ? "#fff" : "#64748b") : "transparent", fontWeight: isGol ? 600 : 400 }}>
                        {isGosp ? z.zawodnik : ""}
                      </div>
                      <div style={{ width: 70, textAlign: "center", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <EventIcon typ={z.typ} />
                        <span style={{ fontSize: 11, color: "#475569" }}>{z.minuta}&apos;</span>
                      </div>
                      <div style={{ flex: 1, fontSize: 12, color: !isGosp ? (isGol ? "#fff" : "#64748b") : "transparent", fontWeight: isGol ? 600 : 400 }}>
                        {!isGosp ? z.zawodnik : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Składy */}
          {hasSquad && (
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 14 }}>SKŁADY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {[{ sklad: skladGosp, label: m.team1, isDr: drawa1 }, { sklad: skladGosc, label: m.team2, isDr: drawa2 }].map(({ sklad, label, isDr }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isDr ? "#3b82f6" : "#94a3b8", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
                    {(sklad.pierwsza11 || []).map((p, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "3px 0" }}>
                        <span style={{ color: "#334155", width: 18, textAlign: "right", flexShrink: 0, fontSize: 10 }}>{p.numer || ""}</span>
                        <span style={{ color: p.gole_w_meczu > 0 ? "#3b82f6" : "#94a3b8" }}>
                          {p.nazwisko}
                        </span>
                        {p.gole_w_meczu > 0 && <span style={{ color: "#3b82f6", fontSize: 11 }}>⚽{p.gole_w_meczu > 1 ? `×${p.gole_w_meczu}` : ""}</span>}
                        {p.kartka_w_meczu && <span style={{ fontSize: 11 }}>{p.kartka_w_meczu === "żółta" ? "🟨" : "🟥"}</span>}
                      </div>
                    ))}
                    {(sklad.rezerwa || []).length > 0 && (
                      <>
                        <div style={{ fontSize: 9, color: "#1e293b", marginTop: 8, marginBottom: 4, letterSpacing: "0.1em" }}>REZERWOWI</div>
                        {(sklad.rezerwa || []).map((p, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "3px 0" }}>
                            <span style={{ color: "#334155", width: 18, textAlign: "right", flexShrink: 0, fontSize: 10 }}>{p.numer || ""}</span>
                            <span style={{ color: "#475569" }}>{p.nazwisko}</span>
                            {p.gole_w_meczu > 0 && <span style={{ color: "#3b82f6", fontSize: 11 }}>⚽{p.gole_w_meczu > 1 ? `×${p.gole_w_meczu}` : ""}</span>}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {m.komentarz && (
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 8 }}>KOMENTARZ</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{m.komentarz}</div>
            </div>
          )}

          <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/liga" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>← LIGA</Link>
            <Link href={`/druzyna/${oppSlug}`} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>HISTORIA VS {opp.toUpperCase()}</Link>
          </div>
        </div>
      </main>
    </>
  );
}
