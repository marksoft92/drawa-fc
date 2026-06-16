import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

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
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const newestArticle = artykuly[0]?.updatedAt ?? new Date('2025-08-01');

  return [
    { url: BASE,                  lastModified: newestArticle,        changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/aktualnosci`, lastModified: newestArticle,        changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/statystyki`,  lastModified: new Date('2025-08-01'), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/archiwum`,    lastModified: new Date('2025-08-01'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/transmisja`,  lastModified: new Date('2025-08-01'), changeFrequency: 'weekly',  priority: 0.5 },
    ...newsUrls,
  ];
}
