import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 600;

const BASE = "https://mksdrawadrawno.pl";

export async function GET() {
  const [artykuly, wpisyLigowe] = await Promise.all([
    prisma.artykul.findMany({
      where: { published: true },
      select: { slug: true, title: true, updatedAt: true, tags: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.wpisLigowy.findMany({
      where: { published: true },
      select: { slug: true, tytul: true, updatedAt: true, tags: true, zrodlo: { select: { nazwa: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const entries = [
    ...artykuly.map(a => ({
      url: `${BASE}/aktualnosci/${a.slug}`,
      title: a.title,
      date: a.updatedAt,
      keywords: a.tags?.join(", ") || "",
    })),
    ...wpisyLigowe.map(w => ({
      url: `${BASE}/pilka-lokalna/${w.slug}`,
      title: w.tytul?.replace(/^#+\s*/, "") || "",
      date: w.updatedAt,
      keywords: [...(w.tags?.length ? w.tags : []), w.zrodlo?.nazwa, "piłka lokalna", "zachodniopomorskie"].filter(Boolean).join(", "),
    })),
  ].filter(e => e.title);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.map(e => `  <url>
    <loc>${e.url}</loc>
    <news:news>
      <news:publication>
        <news:name>MKS Drawa Drawno</news:name>
        <news:language>pl</news:language>
      </news:publication>
      <news:publication_date>${new Date(e.date).toISOString()}</news:publication_date>
      <news:title>${escapeXml(e.title)}</news:title>
      ${e.keywords ? `<news:keywords>${escapeXml(e.keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
