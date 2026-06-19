import { prisma } from "@/lib/prisma";
import StatystykiClient from "./StatystykiClient";

export const revalidate = 60;

export default async function StatystykiPage() {
  const ustawienia = await prisma.ustawienie.findMany();
  const ust = Object.fromEntries(ustawienia.map(r => [r.klucz, r.wartosc]));
  const sezon = ust.aktywny_sezon || "2025/26";

  const mecze = await prisma.mecz.findMany({
    where: { sezon },
    orderBy: { date: "asc" },
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Statystyki" }] }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Statystyki MKS Drawa Drawno
      </h1>
      <StatystykiClient initialMecze={JSON.parse(JSON.stringify(mecze))} />
    </>
  );
}
