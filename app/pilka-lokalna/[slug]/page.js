import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import ShareButtons from "@/components/ShareButtons";
import { prisma } from "@/lib/prisma";

export const revalidate = 120;

function cleanTitle(t) { return t?.replace(/^#+\s*/, '') || ''; }
function cleanDesc(tresc) {
  return tresc.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).join(' ').slice(0, 160);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const w = await prisma.wpisLigowy.findUnique({ where: { slug }, include: { zrodlo: { select: { nazwa: true } } } });
  if (!w || !w.published) return {};
  const title = cleanTitle(w.tytul);
  const desc = cleanDesc(w.tresc);
  return {
    title: `${title} | Piłka lokalna`,
    description: desc,
    alternates: { canonical: `https://mksdrawadrawno.pl/pilka-lokalna/${w.slug}` },
    openGraph: {
      title: `${title} | Piłka lokalna — MKS Drawa Drawno`,
      description: desc,
      url: `https://mksdrawadrawno.pl/pilka-lokalna/${w.slug}`,
      ...(w.miniaturka && { images: [`https://mksdrawadrawno.pl${w.miniaturka}`] }),
    },
  };
}

export default async function WpisPage({ params }) {
  const { slug } = await params;
  const w = await prisma.wpisLigowy.findUnique({
    where: { slug },
    include: { zrodlo: { select: { nazwa: true, herb: true, fbUrl: true } } },
  });
  if (!w || !w.published) notFound();

  const title = cleanTitle(w.tytul);
  const images = Array.isArray(w.obrazki) ? w.obrazki : [];
  const paragraphs = w.tresc.split("\n\n").filter(Boolean).map(p => p.replace(/^#+\s*/, ''));
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return ""; }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
        .wl-p { font-size: 15px; color: #94a3b8; line-height: 1.8; }
        @media (max-width: 640px) { .wl-p { font-size: 14px; } }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: cleanDesc(w.tresc),
          datePublished: w.createdAt,
          image: w.miniaturka ? `https://mksdrawadrawno.pl${w.miniaturka}` : "https://mksdrawadrawno.pl/logo.png",
          author: { "@type": "Organization", name: w.zrodlo?.nazwa || "Piłka lokalna" },
          publisher: {
            "@type": "SportsOrganization",
            name: "MKS Drawa Drawno",
            logo: { "@type": "ImageObject", url: "https://mksdrawadrawno.pl/logo.png" },
          },
          mainEntityOfPage: `https://mksdrawadrawno.pl/pilka-lokalna/${w.slug}`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Piłka lokalna", item: "https://mksdrawadrawno.pl/pilka-lokalna" },
            { "@type": "ListItem", position: 3, name: title },
          ],
        },
      ]) }} />

      <NavBar backLabel="← Piłka lokalna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px 80px" }}>

          {/* Source badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            {w.zrodlo?.herb && (
              <img src={w.zrodlo.herb} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
            )}
            <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>{w.zrodlo?.nazwa}</span>
            <span style={{ fontSize: 12, color: "#475569", marginLeft: "auto" }}>{fmtDate(w.createdAt)}</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            letterSpacing: "0.06em", color: "#fff",
            lineHeight: 1.15, marginBottom: 28,
          }}>
            {title}
          </h1>

          {/* Hero image */}
          {w.miniaturka && (
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 32, background: "#000", border: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={w.miniaturka} alt={title} style={{ display: "block", width: "100%", maxHeight: 520, objectFit: "contain" }} />
            </div>
          )}

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
            {paragraphs.map((p, i) => (
              <p key={i} className="wl-p">{p}</p>
            ))}
          </div>

          {/* Gallery */}
          {images.length > 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 40 }}>
              {images.map((img, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <img src={img} alt={`${title} — zdjęcie ${i + 1}`} style={{ display: "block", width: "100%", height: "auto" }} />
                </div>
              ))}
            </div>
          )}

          {/* Source link */}
          {w.zrodlo?.fbUrl && (
            <div style={{ marginBottom: 32, padding: "12px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Źródło: </span>
              <a href={w.zrodlo.fbUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none" }}>
                {w.zrodlo.nazwa} na Facebooku
              </a>
            </div>
          )}

          {/* Share */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <ShareButtons url={`https://mksdrawadrawno.pl/pilka-lokalna/${w.slug}`} title={title} />
          </div>

          {/* Back link */}
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Link href="/pilka-lokalna" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
              ← Wszystkie wiadomości ligowe
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
