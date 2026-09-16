import { prisma } from "@/lib/prisma";
import PilkaLokalnaClient from "./PilkaLokalnaClient";

export const revalidate = 120;

const PER_PAGE = 24;
const BASE_URL = "https://mksdrawadrawno.pl/pilka-lokalna";

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page, 10) || 1);
  const zrodlo = sp?.zrodlo || "";

  const qs = new URLSearchParams();
  if (zrodlo) qs.set("zrodlo", zrodlo);
  if (page > 1) qs.set("page", String(page));
  const canonical = qs.toString() ? `${BASE_URL}?${qs.toString()}` : BASE_URL;

  const suffix = page > 1 ? ` — strona ${page}` : "";
  const title = `Piłka lokalna — zachodniopomorskie aktualności z ligi${suffix} | MKS Drawa Drawno`;
  const description = "Najnowsze wiadomości z ponad 150 klubów piłkarskich województwa zachodniopomorskiego. Transfery, wyniki meczów i zapowiedzi spotkań z B-klasy, klasy okręgowej i IV ligi.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function PilkaLokalnaPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page, 10) || 1);
  const zrodloId = sp?.zrodlo || "";

  const where = { published: true, ...(zrodloId ? { zrodloId } : {}) };

  const [wpisy, total, zrodla] = await Promise.all([
    prisma.wpisLigowy.findMany({
      where,
      include: { zrodlo: { select: { nazwa: true, herb: true } } },
      orderBy: [{ dataPostu: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.wpisLigowy.count({ where }),
    prisma.zrodloFB.findMany({
      where: { wpisy: { some: { published: true } } },
      select: { id: true, nazwa: true, herb: true },
      orderBy: { nazwa: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
          { "@type": "ListItem", position: 2, name: "Piłka lokalna" },
        ],
      }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Piłka lokalna — aktualności z ligi
      </h1>
      <PilkaLokalnaClient
        wpisy={JSON.parse(JSON.stringify(wpisy))}
        zrodla={zrodla}
        total={total}
        page={page}
        totalPages={totalPages}
        perPage={PER_PAGE}
        currentZrodloId={zrodloId}
      />
    </>
  );
}
