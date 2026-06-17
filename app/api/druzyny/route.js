import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isDrawa(n) { return n?.toLowerCase().includes("drawa drawno"); }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  const sezony = await prisma.archiwumSezon.findMany({
    include: { mecze: true },
  });

  const opponents = new Map();

  for (const s of sezony) {
    for (const m of s.mecze) {
      const dHome = isDrawa(m.team1);
      const dAway = isDrawa(m.team2);
      if (!dHome && !dAway) continue;
      const opp = dHome ? m.team2 : m.team1;
      if (!opp || isDrawa(opp)) continue;

      const oppSlug = slugify(opp);
      if (!opponents.has(oppSlug)) {
        opponents.set(oppSlug, { nazwa: opp, slug: oppSlug, mecze: [], sezony: new Set() });
      }
      const entry = opponents.get(oppSlug);
      entry.sezony.add(s.sezon || s.liga);
      entry.mecze.push({
        date: m.date, score: m.score, team1: m.team1, team2: m.team2,
        sezon: s.sezon, liga: s.liga, kolejka: m.kolejka,
      });
    }
  }

  if (slug) {
    const entry = opponents.get(slug);
    if (!entry) return Response.json({ error: "Nie znaleziono" }, { status: 404 });

    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    for (const m of entry.mecze) {
      if (!m.score) continue;
      const [g1, g2] = m.score.split(":").map(Number);
      if (isNaN(g1)) continue;
      const dHome = isDrawa(m.team1);
      const dGoals = dHome ? g1 : g2;
      const oGoals = dHome ? g2 : g1;
      gf += dGoals; ga += oGoals;
      if (dGoals > oGoals) w++; else if (dGoals === oGoals) d++; else l++;
    }

    return Response.json({
      ...entry,
      sezony: [...entry.sezony],
      stats: { mecze: entry.mecze.length, wygrane: w, remisy: d, przegrane: l, bramkiZdobyte: gf, bramkiStracone: ga },
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  }

  const list = [...opponents.values()].map((e) => {
    let w = 0, d = 0, l = 0;
    for (const m of e.mecze) {
      if (!m.score) continue;
      const [g1, g2] = m.score.split(":").map(Number);
      if (isNaN(g1)) continue;
      const dHome = isDrawa(m.team1);
      if ((dHome ? g1 : g2) > (dHome ? g2 : g1)) w++; else if (g1 === g2) d++; else l++;
    }
    return { nazwa: e.nazwa, slug: e.slug, mecze: e.mecze.length, wygrane: w, remisy: d, przegrane: l, sezony: e.sezony.size };
  }).sort((a, b) => b.mecze - a.mecze);

  return Response.json(list, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
