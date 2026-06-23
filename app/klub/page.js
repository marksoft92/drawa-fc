import Link from "next/link";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l")
    .replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const metadata = {
  title: "Kluby piłkarskie — zachodniopomorska piłka lokalna | MKS Drawa Drawno",
  description: "Lista klubów piłkarskich z województwa zachodniopomorskiego. Aktualności, wyniki meczów i transfery z B-klasy, klasy okręgowej i IV ligi.",
  alternates: { canonical: "https://mksdrawadrawno.pl/klub" },
  openGraph: {
    title: "Kluby piłkarskie — zachodniopomorska piłka lokalna",
    description: "Lista klubów piłkarskich z województwa zachodniopomorskiego.",
    url: "https://mksdrawadrawno.pl/klub",
  },
};

export default async function KlubyPage() {
  const zrodla = await prisma.zrodloFB.findMany({
    select: { id: true, nazwa: true, herb: true, _count: { select: { wpisy: { where: { published: true } } } } },
    orderBy: { nazwa: "asc" },
  });

  const kluby = zrodla.map(z => ({
    ...z,
    slug: slugify(z.nazwa),
    count: z._count.wpisy,
  }));

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .klub-item { background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; transition: border-color 0.2s; }
        .klub-item:hover { border-color: rgba(59,130,246,0.3); }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Kluby piłkarskie — zachodniopomorskie",
          url: "https://mksdrawadrawno.pl/klub",
          description: "Lista klubów piłkarskich z województwa zachodniopomorskiego",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: kluby.length,
            itemListElement: kluby.map((k, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://mksdrawadrawno.pl/klub/${k.slug}`,
              name: k.nazwa,
            })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Kluby" },
          ],
        },
      ]) }} />

      <NavBar backLabel="← Strona główna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

          <h1 style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: "clamp(28px, 5vw, 42px)",
            letterSpacing: "0.1em", color: "#fff", marginBottom: 8,
          }}>
            Kluby piłkarskie
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
            {kluby.length} klubów z województwa zachodniopomorskiego
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {kluby.map(k => (
              <Link key={k.id} href={`/klub/${k.slug}`} style={{ textDecoration: "none" }}>
                <div className="klub-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                  {k.herb ? (
                    <img src={k.herb} alt="" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#3b82f6", fontWeight: 700, flexShrink: 0 }}>
                      {k.nazwa.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {k.nazwa}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>
                      {k.count} {k.count === 1 ? "artykuł" : k.count < 5 ? "artykuły" : "artykułów"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
