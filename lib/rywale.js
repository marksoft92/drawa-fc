import { prisma } from "./prisma";

export function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function isDrawa(n) { return n?.toLowerCase().includes("drawa drawno"); }

function addMatch(opponents, opp, match, sezonLabel) {
  const oppSlug = slugify(opp);
  if (!opponents.has(oppSlug)) {
    opponents.set(oppSlug, { nazwa: opp, slug: oppSlug, mecze: [], sezony: new Set() });
  }
  const entry = opponents.get(oppSlug);
  entry.sezony.add(sezonLabel);
  entry.mecze.push({ ...match, puchar: !!(match.liga && match.liga.toLowerCase().includes("puchar")) });
}

export function computeStats(mecze) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const m of mecze) {
    if (!m.score) continue;
    const [g1, g2] = m.score.split(":").map(Number);
    if (isNaN(g1)) continue;
    const dH = isDrawa(m.team1);
    const dG = dH ? g1 : g2, oG = dH ? g2 : g1;
    gf += dG; ga += oG;
    if (dG > oG) w++; else if (dG === oG) d++; else l++;
  }
  return { mecze: mecze.length, wygrane: w, remisy: d, przegrane: l, bramkiZdobyte: gf, bramkiStracone: ga };
}

export async function getAllOpponents() {
  const [archSezony, biezaceMecze] = await Promise.all([
    prisma.archiwumSezon.findMany({ include: { mecze: true } }),
    prisma.mecz.findMany({ select: { team1: true, team2: true, score: true, date: true, sezon: true, liga: true } }),
  ]);

  const opponents = new Map();

  for (const s of archSezony) {
    for (const m of s.mecze) {
      const dHome = isDrawa(m.team1);
      const dAway = isDrawa(m.team2);
      if (!dHome && !dAway) continue;
      const opp = dHome ? m.team2 : m.team1;
      if (!opp || isDrawa(opp)) continue;
      addMatch(opponents, opp, {
        date: m.date, score: m.score, team1: m.team1, team2: m.team2,
        sezon: s.sezon, liga: s.liga, kolejka: m.kolejka,
      }, s.sezon || s.liga);
    }
  }

  for (const m of biezaceMecze) {
    const dHome = isDrawa(m.team1);
    const dAway = isDrawa(m.team2);
    if (!dHome && !dAway) continue;
    const opp = dHome ? m.team2 : m.team1;
    if (!opp || isDrawa(opp)) continue;
    addMatch(opponents, opp, {
      date: m.date, score: m.score, team1: m.team1, team2: m.team2,
      sezon: m.sezon, liga: m.liga, kolejka: null,
    }, m.sezon || m.liga || "Bieżący sezon");
  }

  for (const entry of opponents.values()) {
    entry.mecze.sort((a, b) => {
      const sa = a.sezon || ""; const sb = b.sezon || "";
      if (sa !== sb) return sa.localeCompare(sb);
      const ka = a.kolejka || 0; const kb = b.kolejka || 0;
      if (ka !== kb) return ka - kb;
      return (a.date || "").localeCompare(b.date || "");
    });
  }

  return opponents;
}
