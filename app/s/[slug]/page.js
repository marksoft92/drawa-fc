import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import ShareButtons from "@/components/ShareButtons";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = await prisma.strona.findUnique({ where: { slug } });
  if (!s || !s.published) return {};
  return {
    title: s.tytul,
    description: s.metaOpis || s.tresc.slice(0, 160),
    alternates: { canonical: `https://mksdrawadrawno.pl/s/${slug}` },
    openGraph: {
      title: `${s.tytul} — MKS Drawa Drawno`,
      description: s.metaOpis || s.tresc.slice(0, 160),
      url: `https://mksdrawadrawno.pl/s/${slug}`,
    },
  };
}

export default async function StronaPage({ params }) {
  const { slug } = await params;
  const s = await prisma.strona.findUnique({ where: { slug } });
  if (!s || !s.published) notFound();

  const paragraphs = s.tresc.split("\n\n").filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: s.tytul }] }) }} />
      <NavBar backLabel="← Strona główna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "0.06em", color: "#fff", lineHeight: 1.15, marginBottom: 28 }}>
            {s.tytul}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
            {paragraphs.map((p, i) => {
              const isHeader = /^[A-ZŁŚÓĄŻŹĆĘŃ\s!—–]+$/.test(p.trim()) && p.trim().length < 80;
              return isHeader
                ? <p key={i} style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.08em", marginTop: 8 }}>{p}</p>
                : <p key={i} style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8 }}>{p}</p>;
            })}
          </div>

          <ShareButtons url={`https://mksdrawadrawno.pl/s/${slug}`} title={s.tytul} />

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", fontSize: 12, letterSpacing: "0.12em", textDecoration: "none", fontWeight: 600 }}>
              ← STRONA GŁÓWNA
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
