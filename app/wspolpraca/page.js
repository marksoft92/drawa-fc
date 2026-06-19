import NavBar from "@/components/NavBar";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata = {
  title: "Sponsoring i Współpraca — MKS Drawa Drawno | Reklama lokalna Drawno",
  description: "Zostań sponsorem MKS Drawa Drawno — klubu piłkarskiego z 78-letnią tradycją z Drawna, woj. zachodniopomorskie. Reklama na boisku, stronie internetowej i social media. Oferta sponsoringu, pakiety reklamowe, współpraca barterowa.",
  alternates: { canonical: "https://mksdrawadrawno.pl/wspolpraca" },
  keywords: ["sponsoring klubu piłkarskiego", "reklama Drawno", "sponsor piłka nożna zachodniopomorskie", "współpraca sportowa", "reklama lokalna zachodniopomorskie", "MKS Drawa Drawno sponsor"],
  openGraph: {
    title: "Zostań sponsorem MKS Drawa Drawno",
    description: "Promuj swoją firmę wśród lokalnej społeczności. Reklama na boisku, stronie i social media. Klub z 78-letnią tradycją.",
    url: "https://mksdrawadrawno.pl/wspolpraca",
    images: [{ url: "/opengraph-image" }],
  },
};

export default async function WspolpracaPage() {
  const [sponsorzy, archStats] = await Promise.all([
    prisma.sponsor.findMany({ where: { aktywny: true }, orderBy: { kolejnosc: "asc" }, select: { nazwa: true, logo: true, href: true, opis: true } }),
    (async () => {
      const sezony = await prisma.archiwumSezon.findMany({
        where: { NOT: { liga: { contains: "Puchar" } } },
        select: { sezon: true, mecze: { select: { score: true, team1: true, team2: true } } },
      });
      let mecze = 0, gole = 0, wygrane = 0;
      const uniq = new Set();
      for (const s of sezony) { if (s.sezon) uniq.add(s.sezon); for (const m of s.mecze) { if (!m.score) continue; mecze++; const [g1, g2] = m.score.split(":").map(Number); if (isNaN(g1)) continue; const dH = m.team1?.toLowerCase().includes("drawa drawno"); gole += dH ? g1 : g2; if ((dH ? g1 : g2) > (dH ? g2 : g1)) wygrane++; } }
      return { sezony: uniq.size, mecze, gole, wygrane };
    })(),
  ]);

  const SL = ({ children, color = "#3b82f6" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div style={{ width: 4, height: 28, background: color, borderRadius: 2, boxShadow: `0 0 12px ${color}99` }} />
      <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", margin: 0 }}>{children}</h2>
    </div>
  );

  const faqItems = [
    { q: "Ile kosztuje współpraca?", a: "Nie mamy sztywnego cennika. Koszty zależą od formy współpracy, czasu trwania i zakresu. Rozmawiamy indywidualnie i szukamy rozwiązania, które pasuje obu stronom. Dla lokalnych firm z Drawna i okolic mamy specjalne warunki." },
    { q: "Czy mogę współpracować barterowo?", a: "Jak najbardziej. Sprzęt sportowy, usługi transportowe, materiały budowlane, catering na mecze — wszystko, co pomaga klubowi funkcjonować, jest dla nas wartościowe." },
    { q: "Na jak długo zobowiązuje współpraca?", a: "Minimum to zazwyczaj jeden sezon (runda jesienna + wiosenna), ale możemy umówić się na krótsze okresy — np. patronat jednego meczu lub turnieju." },
    { q: "Jak sprawdzę efekty?", a: "Dostaniesz dostęp do statystyk odwiedzin strony. Dla social media przygotujemy raport zasięgów. Przy banerach — zdjęcia z meczów. Chcemy, żebyś widział wartość współpracy." },
    { q: "Czy wystawiacie faktury?", a: "Tak, klub jest zarejestrowanym stowarzyszeniem. Wystawiamy faktury i umowy sponsorskie." },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Współpraca i Sponsoring" },
          ],
        },
      ]) }} />

      <NavBar backLabel="← Strona główna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff" }}>

        {/* ═══ HERO ═══ */}
        <section style={{ position: "relative", padding: "80px 20px 60px", textAlign: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center top, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />
          <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.35em", color: "#3b82f6", marginBottom: 16 }}>MKS DRAWA DRAWNO · OD 1947</div>
            <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(40px, 8vw, 72px)", letterSpacing: "0.06em", lineHeight: 1, margin: 0, textShadow: "0 0 60px rgba(59,130,246,0.3)" }}>
              RAZEM BUDUJEMY<br />
              <span style={{ color: "#3b82f6" }}>HISTORIĘ</span>
            </h1>
            <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.8, marginTop: 20, maxWidth: 560, margin: "20px auto 0" }}>
              Drawa Drawno to nie tylko piłka nożna. To społeczność, tradycja i serce małego miasta na Pomorzu Zachodnim. Szukamy partnerów, którzy chcą być częścią tej historii.
            </p>
          </div>
        </section>

        {/* ═══ LICZBY ═══ */}
        <section style={{ padding: "0 20px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { v: "1947", l: "ROK ZAŁOŻENIA", c: "#3b82f6" },
              { v: `${archStats.sezony + 1}`, l: "SEZONÓW LIGOWYCH", c: "#3b82f6" },
              { v: `${archStats.mecze}+`, l: "ROZEGRANYCH MECZÓW", c: "#22c55e" },
              { v: `${archStats.gole}+`, l: "STRZELONYCH GOLI", c: "#f59e0b" },
              { v: "73-220", l: "DRAWNO · ZACHODNIOPOMORSKIE", c: "#64748b" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "24px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 30, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.2em", marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ DLACZEGO MY ═══ */}
        <section style={{ padding: "0 20px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SL>Dlaczego warto z nami?</SL>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.7 }}>
              MKS Drawa Drawno to jeden z najstarszych klubów piłkarskich w regionie. Gramy nieprzerwanie, angażujemy lokalną młodzież i budujemy społeczność wokół sportu. Współpraca z nami to inwestycja w rozpoznawalność Twojej marki tam, gdzie to naprawdę działa — wśród ludzi.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {[
                {
                  icon: "🌐",
                  title: "Profesjonalna strona internetowa",
                  desc: "Nowoczesna strona z wynikami na żywo, transmisją meczów, galerią zdjęć i aktualnościami. Twoje logo widoczne dla każdego odwiedzającego — 24/7, przez cały sezon.",
                },
                {
                  icon: "📱",
                  title: "Social media i zasięg",
                  desc: "Aktywne profile na Facebooku i Instagramie. Relacje z meczów, materiały wideo, zdjęcia — Twoja marka obecna w treściach, które ludzie udostępniają dalej.",
                },
                {
                  icon: "🏟️",
                  title: "Widoczność na boisku",
                  desc: "Banery reklamowe wokół boiska widoczne podczas każdego meczu domowego. Kibice, rodziny, goście — Twoja reklama w naturalnym otoczeniu, bez blokerów.",
                },
                {
                  icon: "🤝",
                  title: "Bliskość społeczności",
                  desc: "Drawno i okolice to kilka tysięcy mieszkańców, którzy znają klub osobiście. Twoja firma jako sponsor to nie abstrakcja — to sąsiad, który wspiera to co ważne.",
                },
                {
                  icon: "📰",
                  title: "Treści i artykuły",
                  desc: "Dedykowane artykuły na stronie klubu, wspomnienia o Twojej firmie w relacjach meczowych. Stały content, który pracuje na Twoją widoczność w Google.",
                },
                {
                  icon: "📊",
                  title: "Mierzalne efekty",
                  desc: "Dostęp do statystyk odwiedzin strony. Wiesz ile osób widziało Twoje logo, ile razy kliknięto link. Transparentna współpraca oparta na danych.",
                },
              ].map((item) => (
                <div key={item.title} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "28px 24px", transition: "border-color 0.2s" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FORMY WSPÓŁPRACY ═══ */}
        <section style={{ padding: "0 20px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SL color="#f59e0b">Formy współpracy</SL>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.7 }}>
              Nie mamy sztywnego cennika — każdą współpracę dopasowujemy indywidualnie. Możliwości jest dużo, a my jesteśmy otwarci na Twoje pomysły. Oto co możemy zaproponować:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { title: "Logo na stronie internetowej", desc: "Sekcja sponsorów na stronie głównej — widoczna dla każdego odwiedzającego. Logo z linkiem do Twojej strony. Świetne dla SEO.", tag: "DIGITAL" },
                { title: "Baner reklamowy na boisku", desc: "Baner na ogrodzeniu boiska — widoczny podczas meczów, treningów i wydarzeń klubowych. Format i lokalizacja do ustalenia.", tag: "BOISKO" },
                { title: "Artykuł sponsorowany", desc: "Dedykowany artykuł na stronie klubu o Twojej firmie, produkcie lub usłudze. SEO backlink + stała widoczność w archiwum aktualności.", tag: "CONTENT" },
                { title: "Patron meczu / kolejki", desc: "Twoja firma jako patron danego meczu — wzmianka w relacji, na plakacie meczowym i w social media. Idealne na okazje i promocje.", tag: "EVENT" },
                { title: "Współpraca barterowa", desc: "Nie zawsze musi to być przelew. Usługi, produkty, sprzęt sportowy — porozmawiajmy, co możemy zrobić razem.", tag: "BARTER" },
                { title: "Wsparcie młodzieży i akademii", desc: "Pomoc w organizacji zajęć dla dzieci i młodzieży. Twoja firma jako fundator sprzętu, nagród, wyjazdów. Buduje wizerunek odpowiedzialnej marki.", tag: "CSR" },
                { title: "Social media i materiały", desc: "Posty sponsorowane na Facebooku i Instagramie. Zdjęcia i filmy z Twoim brandem. Oznaczenia, tagi, relacje z meczów.", tag: "SOCIAL" },
                { title: "Naming rights / patronat", desc: "Dla większych partnerów — patronat nad obiektem, turniejem, sezonem. Trwała obecność w nazewnictwie i komunikacji klubu.", tag: "PREMIUM" },
              ].map((item) => (
                <div key={item.title} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 20, flexShrink: 0, marginTop: 2 }}>{item.tag}</span>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ OBECNI PARTNERZY ═══ */}
        {sponsorzy.length > 0 && (
          <section style={{ padding: "0 20px 64px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <SL color="#22c55e">Nasi obecni partnerzy</SL>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>
                Dziękujemy firmom, które już nas wspierają. Dołącz do tego grona.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {sponsorzy.map((s) => (
                  <div key={s.nazwa} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: s.opis ? 10 : 0 }}>
                      {s.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logo} alt={s.nazwa} style={{ height: 40, objectFit: "contain", opacity: 0.85, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{s.nazwa}</div>
                        {s.href && (
                          <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#3b82f6", textDecoration: "none" }}>
                            {s.href.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                          </a>
                        )}
                      </div>
                    </div>
                    {s.opis && <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{s.opis}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ FAQ ═══ */}
        <section style={{ padding: "0 20px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <SL>Najczęstsze pytania</SL>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {faqItems.map(({ q, a }) => (
                <div key={q} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{q}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section style={{ padding: "0 20px 80px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: "48px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 300, height: 150, background: "radial-gradient(ellipse, rgba(59,130,246,0.12), transparent 70%)", pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 5vw, 40px)", color: "#fff", letterSpacing: "0.06em", marginBottom: 12 }}>
                POROZMAWIAJMY
              </div>
              <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px" }}>
                Bez zobowiązań. Opowiedz nam o swojej firmie, a my zaproponujemy formę współpracy, która ma sens dla obu stron.
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                <a href="mailto:drawa.drawno@zzpn.pl" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 10, color: "#60a5fa", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", transition: "background 0.2s" }}>
                  NAPISZ DO NAS
                </a>
                <a href="tel:+48691901479" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: "#22c55e", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", transition: "background 0.2s" }}>
                  691 901 479
                </a>
              </div>

              <div style={{ fontSize: 12, color: "#334155" }}>
                drawa.drawno@zzpn.pl · Prezes — Jakub Zygała
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", gap: 24 }}>
              <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.1em", transition: "color 0.2s" }}>STRONA GŁÓWNA</Link>
              <Link href="/archiwum" style={{ fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.1em", transition: "color 0.2s" }}>ARCHIWUM</Link>
              <Link href="/aktualnosci" style={{ fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.1em", transition: "color 0.2s" }}>AKTUALNOŚCI</Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
