import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

const BASE = 'https://mksdrawadrawno.pl';

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isDrawa(n) { return n?.toLowerCase().includes("drawa drawno"); }

export default async function sitemap() {
  const [artykuly, archiwum, players, ustawieniaRows, meczeAll, strony, sponsorzy, wpisyLigowe] = await Promise.all([
    prisma.artykul.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.archiwumSezon.findMany({
      include: { mecze: { select: { team1: true, team2: true } } },
    }),
    prisma.player.findMany({
      where: { user: { active: true } },
      select: { imieNazwisko: true, updatedAt: true },
    }),
    prisma.ustawienie.findMany(),
    prisma.mecz.findMany({ orderBy: { date: 'asc' } }),
    prisma.strona.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.sponsor.findMany({ where: { aktywny: true, NOT: { slug: null } }, select: { slug: true, updatedAt: true } }),
    prisma.wpisLigowy.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const newsUrls = artykuly.map(a => ({
    url: `${BASE}/aktualnosci/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const opponents = new Set();
  for (const s of archiwum) {
    for (const m of s.mecze) {
      const dHome = isDrawa(m.team1);
      const dAway = isDrawa(m.team2);
      if (!dHome && !dAway) continue;
      const opp = dHome ? m.team2 : m.team1;
      if (opp && !isDrawa(opp)) opponents.add(slugify(opp));
    }
  }

  const opponentUrls = [...opponents].map(slug => ({
    url: `${BASE}/druzyna/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const newestArticle = artykuly[0]?.updatedAt ?? new Date('2025-08-01');

  return [
    { url: BASE,                  lastModified: newestArticle,        changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/aktualnosci`, lastModified: newestArticle,        changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/wspolpraca`,  lastModified: new Date('2025-08-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/statystyki`,  lastModified: new Date('2025-08-01'), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/kadra`,       lastModified: new Date(),              changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/galeria`,     lastModified: new Date(),              changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/wideo`,       lastModified: new Date(),              changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/archiwum`,    lastModified: new Date('2025-08-01'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/transmisja`,  lastModified: new Date('2025-08-01'), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/typowanie`,   lastModified: new Date(),              changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/newsletter`,  lastModified: new Date(),              changeFrequency: 'monthly', priority: 0.6 },
    ...newsUrls,
    ...players.map(p => ({
      url: `${BASE}/kadra/${slugify(p.imieNazwisko)}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...opponentUrls,
    { url: `${BASE}/liga`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/liga/tabela`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    ...meczeAll
      .filter(m => !m.liga?.toLowerCase().includes('puchar'))
      .map(m => ({
        url: `${BASE}/liga/mecz/${m.id}`,
        lastModified: m.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })),
    ...strony.map(s => ({
      url: `${BASE}/s/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...sponsorzy.filter(s => s.slug).map(s => ({
      url: `${BASE}/sponsor/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
    { url: `${BASE}/pilka-lokalna`, lastModified: wpisyLigowe[0]?.updatedAt ?? new Date(), changeFrequency: 'daily', priority: 0.8 },
    ...wpisyLigowe.map(w => ({
      url: `${BASE}/pilka-lokalna/${w.slug}`,
      lastModified: w.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ];
}
