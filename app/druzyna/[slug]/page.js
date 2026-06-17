import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { getAllOpponents, computeStats, isDrawa } from "@/lib/rywale";

export const dynamic = "force-dynamic";

async function getData(slug) {
  const opponents = await getAllOpponents();
  const entry = opponents.get(slug);
  if (!entry) return null;
  return { ...entry, sezony: [...entry.sezony], stats: computeStats(entry.mecze) };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) return {};
  const { nazwa, stats } = data;
  return {
    title: `Drawa Drawno vs ${nazwa} — historia meczów i statystyki`,
    description: `Historia spotkań MKS Drawa Drawno z ${nazwa}. ${stats.mecze} meczów, ${stats.wygrane} zwycięstw Drawy, ${stats.bramkiZdobyte} strzelonych goli. Sprawdź wyniki, bilans i szczegóły wszystkich spotkań.`,
    openGraph: {
      title: `Drawa Drawno vs ${nazwa}`,
      description: `${stats.mecze} meczów, bilans: ${stats.wygrane}W-${stats.remisy}R-${stats.przegrane}P. Historia spotkań z archiwum MKS Drawa Drawno.`,
      images: [{ url: "/logo.png" }],
    },
  };
}

export default async function DruzynaPage({ params }) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) notFound();

  const { nazwa, mecze, sezony, stats } = data;

  const resultColor = (m) => {
    if (!m.score) return "#334155";
    const [g1, g2] = m.score.split(":").map(Number);
    const dH = isDrawa(m.team1);
    const dG = dH ? g1 : g2, oG = dH ? g2 : g1;
    if (dG > oG) return "#22c55e";
    if (dG < oG) return "#ef4444";
    return "#f59e0b";
  };
  const resultLabel = (m) => {
    if (!m.score) return "—";
    const [g1, g2] = m.score.split(":").map(Number);
    const dH = isDrawa(m.team1);
    if ((dH ? g1 : g2) > (dH ? g2 : g1)) return "W";
    if (g1 === g2) return "R";
    return "P";
  };

  return (
    <>
      <NavBar backLabel="← Archiwum" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "WebPage",
        name: `Drawa Drawno vs ${nazwa} — historia meczów`,
        description: `${stats.mecze} meczów między MKS Drawa Drawno a ${nazwa}. Bilans: ${stats.wygrane}-${stats.remisy}-${stats.przegrane}.`,
        isPartOf: { "@type": "WebSite", name: "MKS Drawa Drawno", url: "https://mksdrawadrawno.pl" },
      }) }} />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <section style={{ padding: "60px 20px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#475569", marginBottom: 12 }}>HISTORIA SPOTKAŃ</div>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 6vw, 48px)", color: "#fff", letterSpacing: "0.06em", margin: 0 }}>
            <span style={{ color: "#3b82f6" }}>DRAWA DRAWNO</span> vs {nazwa.toUpperCase()}
          </h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>{sezony.length} wspólnych sezonów · {stats.mecze} meczów</div>
        </section>

        <section style={{ padding: "0 20px 48px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
            {[
              { v: stats.mecze, l: "MECZÓW", c: "#3b82f6" },
              { v: stats.wygrane, l: "ZWYCIĘSTW", c: "#22c55e" },
              { v: stats.remisy, l: "REMISÓW", c: "#f59e0b" },
              { v: stats.przegrane, l: "PORAŻEK", c: "#ef4444" },
              { v: stats.bramkiZdobyte, l: "GOLI STRZELONYCH", c: "#3b82f6" },
              { v: stats.bramkiStracone, l: "GOLI STRACONYCH", c: "#64748b" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 30, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.15em", marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 20px 48px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
              <h2 style={{ fontSize: 22, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", margin: 0 }}>Wszystkie mecze</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {mecze.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#334155", minWidth: 72, flexShrink: 0 }}>{m.date || "—"}</span>
                  <span style={{ width: 22, height: 22, borderRadius: 4, background: `${resultColor(m)}18`, color: resultColor(m), fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{resultLabel(m)}</span>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: isDrawa(m.team1) ? "#fff" : "#64748b", fontWeight: isDrawa(m.team1) ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textAlign: "right" }}>{m.team1}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: resultColor(m), fontFamily: "'Bebas Neue', Impact, sans-serif", flexShrink: 0, minWidth: 40, textAlign: "center" }}>{m.score || "—"}</span>
                    <span style={{ fontSize: 12, color: isDrawa(m.team2) ? "#fff" : "#64748b", fontWeight: isDrawa(m.team2) ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{m.team2}</span>
                  </div>
                  <span style={{ fontSize: 9, color: "#1e293b", flexShrink: 0 }}>{m.sezon}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "0 20px 48px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>O rywalach</h2>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.8, margin: 0 }}>
              {nazwa} to jeden z {stats.mecze >= 15 ? "najczęstszych" : stats.mecze >= 8 ? "regularnych" : "historycznych"} rywali MKS Drawa Drawno.
              Drużyny spotkały się łącznie {stats.mecze} razy w {sezony.length} sezon{sezony.length === 1 ? "ie" : "ach"}.
              Bilans dla Drawy: {stats.wygrane} zwycięstw, {stats.remisy} remisów i {stats.przegrane} porażek.
              {stats.bramkiZdobyte > stats.bramkiStracone
                ? ` Drawa strzeliła więcej goli (${stats.bramkiZdobyte}:${stats.bramkiStracone}).`
                : stats.bramkiZdobyte < stats.bramkiStracone
                  ? ` Bilans bramkowy na korzyść rywala (${stats.bramkiZdobyte}:${stats.bramkiStracone}).`
                  : ` Bilans bramkowy wyrównany (${stats.bramkiZdobyte}:${stats.bramkiStracone}).`}
            </p>
          </div>
        </section>

        <div style={{ padding: "0 20px 80px", maxWidth: 700, margin: "0 auto", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/archiwum" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", letterSpacing: "0.12em", fontWeight: 600, border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "10px 24px" }}>ARCHIWUM</Link>
          <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.12em", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 24px" }}>STRONA GŁÓWNA</Link>
        </div>
      </main>
    </>
  );
}
