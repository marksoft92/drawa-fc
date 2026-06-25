import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const zrodla = await prisma.zrodloFB.findMany({ select: { nazwa: true } });
    return zrodla.map(z => ({ slug: slugify(z.nazwa) }));
  } catch { return []; }
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l")
    .replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanTitle(t) { return t?.replace(/^#+\s*/, "") || ""; }

async function getKlub(slug) {
  const zrodla = await prisma.zrodloFB.findMany({ select: { id: true, nazwa: true, herb: true, fbUrl: true } });
  return zrodla.find(z => slugify(z.nazwa) === slug) || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const klub = await getKlub(slug);
  if (!klub) return {};
  return {
    title: `${klub.nazwa} — aktualności, wyniki, transfery | Piłka lokalna`,
    description: `Najnowsze wiadomości z klubu ${klub.nazwa}. Wyniki meczów, transfery, zapowiedzi spotkań i aktualności z zachodniopomorskiej piłki lokalnej.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/klub/${slug}` },
    openGraph: {
      title: `${klub.nazwa} — piłka lokalna`,
      description: `Aktualności, wyniki i transfery klubu ${klub.nazwa}.`,
      url: `https://mksdrawadrawno.pl/klub/${slug}`,
      ...(klub.herb && { images: [`https://mksdrawadrawno.pl${klub.herb}`] }),
    },
  };
}

export default async function KlubPage({ params }) {
  const { slug } = await params;
  const klub = await getKlub(slug);
  if (!klub) notFound();

  const wpisy = await prisma.wpisLigowy.findMany({
    where: { zrodloId: klub.id, published: true },
    select: { slug: true, tytul: true, tresc: true, miniaturka: true, dataPostu: true, createdAt: true, obrazki: true },
    orderBy: [{ dataPostu: "desc" }, { createdAt: "desc" }],
  });

  const fmtDate = (d) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return ""; }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .klub-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
        .klub-card:hover { border-color: rgba(59,130,246,0.3); }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "SportsTeam",
          name: klub.nazwa,
          url: `https://mksdrawadrawno.pl/klub/${slug}`,
          sport: "Piłka nożna",
          ...(klub.herb && { logo: `https://mksdrawadrawno.pl${klub.herb}` }),
          memberOf: {
            "@type": "SportsOrganization",
            name: "Zachodniopomorski Związek Piłki Nożnej",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${klub.nazwa} — aktualności`,
          url: `https://mksdrawadrawno.pl/klub/${slug}`,
          description: `Najnowsze wiadomości z klubu ${klub.nazwa}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: wpisy.length,
            itemListElement: wpisy.slice(0, 20).map((w, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://mksdrawadrawno.pl/pilka-lokalna/${w.slug}`,
              name: cleanTitle(w.tytul),
            })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Piłka lokalna", item: "https://mksdrawadrawno.pl/pilka-lokalna" },
            { "@type": "ListItem", position: 3, name: klub.nazwa },
          ],
        },
      ]) }} />

      <NavBar backLabel="← Piłka lokalna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

          {/* Club header */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
            {klub.herb ? (
              <img src={klub.herb} alt={klub.nazwa} style={{ width: 72, height: 72, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#3b82f6", fontWeight: 700 }}>
                {klub.nazwa.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: "clamp(28px, 5vw, 42px)",
                letterSpacing: "0.06em", color: "#fff", lineHeight: 1.1,
              }}>
                {klub.nazwa}
              </h1>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                {wpisy.length} {wpisy.length === 1 ? "artykuł" : wpisy.length < 5 ? "artykuły" : "artykułów"} · Zachodniopomorskie
              </p>
            </div>
          </div>

          {/* Facebook link */}
          {klub.fbUrl && (
            <a href={klub.fbUrl} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
              background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 8, color: "#3b82f6", fontSize: 13, textDecoration: "none", marginBottom: 32,
            }}>
              Facebook klubu →
            </a>
          )}

          {/* Articles list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {wpisy.map(w => {
              const title = cleanTitle(w.tytul);
              const excerpt = w.tresc.split("\n").filter(l => l.trim()).slice(0, 2).join(" ").slice(0, 180);
              const images = Array.isArray(w.obrazki) ? w.obrazki : [];
              const thumb = w.miniaturka || images[0] || null;

              return (
                <Link key={w.slug} href={`/pilka-lokalna/${w.slug}`} style={{ textDecoration: "none" }}>
                  <div className="klub-card" style={{ display: "flex", gap: 16, padding: 16 }}>
                    {thumb && (
                      <img src={thumb} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4, lineHeight: 1.4 }}>
                        {title}
                      </h2>
                      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {excerpt}
                      </p>
                      <span style={{ fontSize: 11, color: "#475569", marginTop: 6, display: "block" }}>
                        {fmtDate(w.dataPostu || w.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!wpisy.length && (
            <div style={{ textAlign: "center", padding: 60, color: "#475569", fontSize: 14 }}>
              Brak opublikowanych artykułów dla tego klubu.
            </div>
          )}

          {/* Back */}
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Link href="/pilka-lokalna" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
              ← Wszystkie wiadomości ligowe
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
