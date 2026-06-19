import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = await prisma.sponsor.findUnique({ where: { slug } });
  if (!s || !s.aktywny) return {};
  return {
    title: `${s.nazwa} — Sponsor MKS Drawa Drawno`,
    description: s.opis || `${s.nazwa} — partner i sponsor MKS Drawa Drawno. Wspiera lokalny sport w Drawnie.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/sponsor/${slug}` },
    openGraph: {
      title: `${s.nazwa} — Sponsor MKS Drawa Drawno`,
      description: s.opis || `${s.nazwa} wspiera MKS Drawa Drawno.`,
      images: s.logo ? [{ url: s.logo }] : [{ url: "/logo.png" }],
    },
  };
}

export default async function SponsorPage({ params }) {
  const { slug } = await params;
  const s = await prisma.sponsor.findUnique({ where: { slug } });
  if (!s || !s.aktywny) notFound();

  const paragraphs = s.opisDlugi ? s.opisDlugi.split("\n\n").filter(Boolean) : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org", "@type": "Organization",
          name: s.nazwa,
          url: s.href || undefined,
          logo: s.logo || undefined,
          sameAs: [s.facebook, s.instagram, s.href].filter(Boolean),
          sponsor: { "@type": "SportsOrganization", name: "MKS Drawa Drawno", url: "https://mksdrawadrawno.pl" },
        },
        {
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Współpraca", item: "https://mksdrawadrawno.pl/wspolpraca" },
            { "@type": "ListItem", position: 3, name: s.nazwa },
          ],
        },
      ]) }} />
      <NavBar backLabel="← Współpraca" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
            {s.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt={s.nazwa} style={{ height: 72, objectFit: "contain", borderRadius: 8, background: "rgba(255,255,255,0.04)", padding: 12 }} />
            )}
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#22c55e", marginBottom: 6 }}>SPONSOR MKS DRAWA DRAWNO</div>
              <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "0.06em", color: "#fff", margin: 0 }}>
                {s.nazwa}
              </h1>
              {s.opis && <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 8, lineHeight: 1.6 }}>{s.opis}</p>}
            </div>
          </div>

          {/* Linki */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            {s.href && (
              <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", fontSize: 12, fontWeight: 600, textDecoration: "none", letterSpacing: "0.06em" }}>
                🌐 Strona WWW
              </a>
            )}
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "rgba(24,119,242,0.1)", border: "1px solid rgba(24,119,242,0.3)", color: "#1877f2", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Facebook
              </a>
            )}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "rgba(225,48,108,0.1)", border: "1px solid rgba(225,48,108,0.3)", color: "#e1306c", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Instagram
              </a>
            )}
          </div>

          {/* Długi opis */}
          {paragraphs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8 }}>{p}</p>
              ))}
            </div>
          )}

          {!s.opisDlugi && s.opis && (
            <div style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, marginBottom: 40 }}>
              {s.opis}
            </div>
          )}

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/wspolpraca" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>
              ← WSPÓŁPRACA
            </Link>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>
              STRONA GŁÓWNA
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
