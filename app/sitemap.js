import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BASE = 'https://mksdrawadrawno.pl';

export default async function sitemap() {
  const artykuly = await prisma.artykul.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const newsUrls = artykuly.map(a => ({
    url: `${BASE}/aktualnosci/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: BASE,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/aktualnosci`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/statystyki`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/archiwum`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/transmisja`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    ...newsUrls,
  ];
}
