import { notFound } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import ArticleGallery from '@/components/ArticleGallery';
import Komentarze from '@/components/Komentarze';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = await prisma.artykul.findUnique({ where: { slug } });
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `https://mksdrawadrawno.pl/aktualnosci/${a.slug}` },
    openGraph: {
      title: `${a.title} | MKS Drawa Drawno`,
      description: a.excerpt,
      url: `https://mksdrawadrawno.pl/aktualnosci/${a.slug}`,
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const a = await prisma.artykul.findUnique({ where: { slug, published: true } });
  if (!a) notFound();

  const photos = Array.isArray(a.photos) ? a.photos : [];
  const hasRealPhotos =
    photos.length > 1 ||
    (photos[0]?.src && !photos[0].src.includes('logo.png'));

  const paragraphs = a.content.split('\n\n').filter(Boolean);

  const podobneIds = Array.isArray(a.podobne) ? a.podobne : [];
  const podobne = podobneIds.length > 0
    ? await prisma.artykul.findMany({
        where: { id: { in: podobneIds }, published: true },
        select: { slug: true, title: true, thumbnail: true, date: true, kolor: true },
      })
    : [];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .article-p { font-size: 15px; color: #94a3b8; line-height: 1.8; }
        .article-h { font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.08em; margin-top: 8px; }
        @media (max-width: 640px) { .article-p { font-size: 14px; } }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            datePublished: a.date,
            dateModified: a.updatedAt?.toISOString?.() || a.date,
            image: a.thumbnail ? `https://mksdrawadrawno.pl${a.thumbnail}` : "https://mksdrawadrawno.pl/logo.png",
            author: { "@type": "SportsOrganization", name: "MKS Drawa Drawno", url: "https://mksdrawadrawno.pl" },
            publisher: {
              "@type": "SportsOrganization",
              name: "MKS Drawa Drawno",
              logo: { "@type": "ImageObject", url: "https://mksdrawadrawno.pl/logo.png" },
            },
            mainEntityOfPage: `https://mksdrawadrawno.pl/aktualnosci/${a.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
              { "@type": "ListItem", position: 2, name: "Aktualności", item: "https://mksdrawadrawno.pl/aktualnosci" },
              { "@type": "ListItem", position: 3, name: a.title },
            ],
          },
        ]) }}
      />

      <NavBar backLabel="← Aktualności" />

      <main style={{ paddingTop: 64, background: '#030712', minHeight: '100vh' }}>
        <article style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 80px' }}>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            {(a.tags || []).map((tag) => (
              <span key={tag} style={{
                fontSize: 10, color: a.kolor || '#3b82f6',
                background: `${a.kolor || '#3b82f6'}1a`,
                padding: '3px 10px', borderRadius: 4,
                letterSpacing: '0.15em', fontWeight: 700,
              }}>
                {tag.toUpperCase()}
              </span>
            ))}
            <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{a.date}</span>
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '0.06em', color: '#fff',
            lineHeight: 1.15, marginBottom: 28,
          }}>
            {a.title}
          </h1>

          {photos[0]?.src && (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 32, background: '#000', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0].src} alt={photos[0].caption || a.title}
                style={{ display: 'block', width: '100%', maxHeight: hasRealPhotos ? 520 : 220, objectFit: 'contain', background: hasRealPhotos ? '#000' : '#0f172a' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
            {paragraphs.map((p, i) => {
              const imgMatch = p.trim().match(/^\[img:(.+)\]$/);
              if (imgMatch) {
                return (
                  <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', lineHeight: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgMatch[1]} alt={a.title} style={{ display: 'block', width: '100%', height: 'auto' }} />
                  </div>
                );
              }
              const isHeader = /^[A-ZŁŚÓĄŻŹĆĘŃ\s!—–]+$/.test(p.trim()) && p.trim().length < 80;
              return isHeader
                ? <p key={i} className="article-h">{p}</p>
                : <p key={i} className="article-p">{p}</p>;
            })}
          </div>

          {photos.length > 1 && <ArticleGallery photos={photos} />}

          {podobne.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#475569', marginBottom: 16 }}>PODOBNE ARTYKUŁY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {podobne.map(p => (
                  <Link key={p.slug} href={`/aktualnosci/${p.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderTop: `3px solid ${p.kolor || '#3b82f6'}`, borderRadius: 10, overflow: 'hidden' }}>
                      {p.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35, marginBottom: 6 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: '#334155' }}>{p.date}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Komentarze typ="artykul" targetId={a.id} />

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/aktualnosci" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 8,
              border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6',
              fontSize: 12, letterSpacing: '0.12em', textDecoration: 'none', fontWeight: 600,
            }}>
              ← WSZYSTKIE AKTUALNOŚCI
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
