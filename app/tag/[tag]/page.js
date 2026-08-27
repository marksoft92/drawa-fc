import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function resolveTag(tagSlug) {
  const [artykuly, wpisy] = await Promise.all([
    prisma.artykul.findMany({ select: { tags: true } }),
    prisma.wpisLigowy.findMany({ select: { tags: true } }),
  ]);
  const allTags = new Set([
    ...artykuly.flatMap(a => a.tags),
    ...wpisy.flatMap(w => w.tags || []),
  ]);
  return [...allTags].find(t => slugify(t) === tagSlug) || null;
}

// Buduj statycznie tylko najpopularniejsze tagi — rzadkie/jednorazowe
// wyrenderują się on-demand przy pierwszym wejściu i trafią do cache.
export async function generateStaticParams() {
  try {
    const [artykuly, wpisy] = await Promise.all([
      prisma.artykul.findMany({ where: { published: true }, select: { tags: true } }),
      prisma.wpisLigowy.findMany({ where: { published: true }, select: { tags: true } }),
    ]);
    const counts = new Map();
    for (const t of [...artykuly.flatMap(a => a.tags), ...wpisy.flatMap(w => w.tags || [])]) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    const topTags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100).map(([t]) => t);
    return topTags.map(t => ({ tag: slugify(t) }));
  } catch { return []; }
}

export async function generateMetadata({ params }) {
  const { tag } = await params;
  const tagName = await resolveTag(tag);
  if (!tagName) return {};
  return {
    title: `${tagName} — artykuły i aktualności | MKS Drawa Drawno`,
    description: `Wszystkie artykuły i wiadomości oznaczone tagiem „${tagName}" — zachodniopomorska piłka nożna, MKS Drawa Drawno i ligowe aktualności.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/tag/${tag}` },
    openGraph: {
      title: `${tagName} | MKS Drawa Drawno`,
      description: `Artykuły z tagiem: ${tagName}`,
      url: `https://mksdrawadrawno.pl/tag/${tag}`,
    },
  };
}

export default async function TagPage({ params }) {
  const { tag } = await params;
  const tagName = await resolveTag(tag);
  if (!tagName) notFound();

  const [artykuly, wpisy] = await Promise.all([
    prisma.artykul.findMany({
      where: { published: true, tags: { has: tagName } },
      select: { slug: true, title: true, excerpt: true, thumbnail: true, kolor: true, date: true },
      orderBy: { date: "desc" },
    }),
    prisma.wpisLigowy.findMany({
      where: { published: true, tags: { has: tagName } },
      include: { zrodlo: { select: { nazwa: true, herb: true } } },
      orderBy: [{ dataPostu: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
  ]);

  const fmtDate = (d) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return ""; }
  };

  const totalCount = artykuly.length + wpisy.length;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .tag-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
        .tag-card:hover { border-color: rgba(59,130,246,0.3); }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
          { "@type": "ListItem", position: 2, name: "Aktualności", item: "https://mksdrawadrawno.pl/aktualnosci" },
          { "@type": "ListItem", position: 3, name: tagName },
        ],
      }) }} />

      <NavBar backLabel="← Aktualności" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "3px 10px", borderRadius: 4, letterSpacing: "0.15em", fontWeight: 700 }}>
              TAG
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: "clamp(28px, 5vw, 42px)",
            letterSpacing: "0.08em", color: "#fff",
            lineHeight: 1.1, marginBottom: 8,
          }}>
            {tagName}
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>
            {totalCount} {totalCount === 1 ? "artykuł" : totalCount < 5 ? "artykuły" : "artykułów"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {artykuly.map(a => (
              <Link key={a.slug} href={`/aktualnosci/${a.slug}`} style={{ textDecoration: "none" }}>
                <div className="tag-card" style={{ display: "flex", gap: 16, padding: 16, borderTop: `3px solid ${a.kolor || "#3b82f6"}` }}>
                  {a.thumbnail && (
                    <img src={a.thumbnail} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>AKTUALNOŚCI</div>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4, lineHeight: 1.4 }}>{a.title}</h2>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.excerpt}</p>
                    <span style={{ fontSize: 11, color: "#334155", marginTop: 6, display: "block" }}>{a.date}</span>
                  </div>
                </div>
              </Link>
            ))}

            {wpisy.map(w => {
              const title = w.tytul?.replace(/^#+\s*/, "") || "";
              const excerpt = w.tresc.split("\n").filter(l => l.trim()).slice(0, 2).join(" ").slice(0, 160);
              const thumb = w.miniaturka || (Array.isArray(w.obrazki) ? w.obrazki[0] : null) || null;
              return (
                <Link key={w.slug} href={`/pilka-lokalna/${w.slug}`} style={{ textDecoration: "none" }}>
                  <div className="tag-card" style={{ display: "flex", gap: 16, padding: 16 }}>
                    {thumb && (
                      <img src={thumb} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {w.zrodlo?.herb && <img src={w.zrodlo.herb} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.08em" }}>{w.zrodlo?.nazwa?.toUpperCase()}</span>
                      </div>
                      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4, lineHeight: 1.4 }}>{title}</h2>
                      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{excerpt}</p>
                      <span style={{ fontSize: 11, color: "#334155", marginTop: 6, display: "block" }}>{fmtDate(w.dataPostu || w.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Link href="/aktualnosci" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
              ← Wszystkie aktualności
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
