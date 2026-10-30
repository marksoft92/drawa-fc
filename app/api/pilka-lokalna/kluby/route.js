import { prisma } from "@/lib/prisma";

export const revalidate = 1800;

// Najnowsze 3 wpisy każdego klubu (tytuł i adres, bez treści) — Klubiq pokazuje je na stronach klubów jako linki do mksdrawadrawno.pl.
export async function GET() {
  const zrodla = await prisma.zrodloFB.findMany({
    where: { wpisy: { some: { published: true } } },
    select: {
      nazwa: true,
      wpisy: { where: { published: true }, select: { tytul: true, slug: true, dataPostu: true, createdAt: true }, orderBy: [{ dataPostu: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], take: 3 },
    },
  });
  const kluby = zrodla.map((z) => ({
    nazwa: z.nazwa,
    wpisy: z.wpisy.map((w) => ({ tytul: w.tytul.replace(/^#+\s*/, ""), url: `https://mksdrawadrawno.pl/pilka-lokalna/${w.slug}`, data: (w.dataPostu || w.createdAt.toISOString()).slice(0, 10) })),
  }));
  return Response.json({ kluby });
}
