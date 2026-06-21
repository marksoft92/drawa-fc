import { prisma } from "@/lib/prisma";
import WideoClient from "./WideoClient";

export const revalidate = 60;

export default async function WideoPage() {
  const [filmy, ustawienia] = await Promise.all([
    prisma.wideo.findMany({ where: { published: true }, orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }] }),
    prisma.ustawienie.findMany(),
  ]);
  const ust = Object.fromEntries(ustawienia.map(r => [r.klucz, r.wartosc]));

  const videoSchema = filmy.slice(0, 10).map(f => {
    const m = f.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    const ytId = m ? m[1] : null;
    return ytId ? {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: f.tytul,
      description: f.opis || `${f.tytul} — MKS Drawa Drawno. Wideo z kanału klubowego.`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      uploadDate: f.createdAt,
      publisher: { "@type": "SportsOrganization", name: "MKS Drawa Drawno", url: "https://mksdrawadrawno.pl" },
    } : null;
  }).filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Wideo" }] },
        ...videoSchema,
      ]) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Wideo MKS Drawa Drawno
      </h1>
      <WideoClient filmy={JSON.parse(JSON.stringify(filmy))} youtubeUrl={ust.youtube || "https://www.youtube.com/@MKS_DRAWA_DRAWNO"} />
    </>
  );
}
