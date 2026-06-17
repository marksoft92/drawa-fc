import { getAllOpponents, computeStats } from "@/lib/rywale";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const opponents = await getAllOpponents();

  if (slug) {
    const entry = opponents.get(slug);
    if (!entry) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
    return Response.json({
      ...entry, sezony: [...entry.sezony], stats: computeStats(entry.mecze),
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  }

  const list = [...opponents.values()].map((e) => {
    const s = computeStats(e.mecze);
    const hasPuchar = e.mecze.some(m => m.puchar);
    const hasLiga = e.mecze.some(m => !m.puchar);
    return { nazwa: e.nazwa, slug: e.slug, mecze: s.mecze, wygrane: s.wygrane, remisy: s.remisy, przegrane: s.przegrane, bramkiZdobyte: s.bramkiZdobyte, bramkiStracone: s.bramkiStracone, sezony: e.sezony.size, hasPuchar, hasLiga };
  }).sort((a, b) => b.mecze - a.mecze);

  return Response.json(list, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
