import NavBar from "@/components/NavBar";
import Link from "next/link";

export const metadata = {
  title: "Współpraca i Sponsoring",
  description: "Zostań sponsorem MKS Drawa Drawno — klub piłkarski z Drawna, woj. zachodniopomorskie. Oferta reklamowa, pakiety sponsorskie, promocja Twojej firmy wśród lokalnej społeczności.",
};

const PACKAGES = [
  {
    name: "PARTNER STRATEGICZNY",
    color: "#f59e0b",
    features: [
      "Logo na koszulkach meczowych (przód)",
      "Logo na stronie głównej (sekcja Hero)",
      "Baner na ogrodzeniu boiska",
      "Wpisy sponsorowane w aktualnościach",
      "Logo na materiałach klubowych i plakatach",
      "Relacje w social media (min. 4x/mies.)",
    ],
  },
  {
    name: "SPONSOR GŁÓWNY",
    color: "#3b82f6",
    features: [
      "Logo na koszulkach (rękaw/tył)",
      "Logo na stronie — sekcja Sponsorzy",
      "Baner na ogrodzeniu boiska",
      "Wpis w aktualnościach o współpracy",
      "Logo na plakatach meczowych",
      "Relacje w social media (min. 2x/mies.)",
    ],
  },
  {
    name: "PARTNER KLUBU",
    color: "#22c55e",
    features: [
      "Logo na stronie — sekcja Sponsorzy",
      "Logo na plakatach meczowych",
      "Wpis w aktualnościach o współpracy",
      "Relacja w social media (1x/mies.)",
    ],
  },
];

const STATS = [
  { value: "1947", label: "ROK ZAŁOŻENIA" },
  { value: "500+", label: "MECZÓW W ARCHIWUM" },
  { value: "20+", label: "LAT UDOKUMENTOWANEJ HISTORII" },
  { value: "1000+", label: "KIBICÓW I SYMPATYKÓW" },
];

export default function WspolpracaPage() {
  return (
    <>
      <NavBar backLabel="← Strona główna" />

      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh" }}>
        <div style={{ padding: "60px 20px 48px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(36px, 7vw, 56px)", color: "#fff", letterSpacing: "0.1em", margin: 0, textShadow: "0 0 60px rgba(59,130,246,0.3)" }}>
            WSPÓŁPRACA
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 12, maxWidth: 600, margin: "12px auto 0", lineHeight: 1.7 }}>
            Zostań partnerem MKS Drawa Drawno i promuj swoją firmę wśród lokalnej społeczności.
            Wspierając klub, budujesz rozpoznawalność marki w regionie.
          </p>
        </div>

        <section style={{ padding: "0 20px 48px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "24px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 32, color: "#3b82f6", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.2em", marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 20px 48px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
              <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Pakiety sponsorskie</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
              {PACKAGES.map((pkg) => (
                <div key={pkg.name} style={{ background: "#0f172a", border: `1px solid ${pkg.color}30`, borderTop: `4px solid ${pkg.color}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 20, color: pkg.color, letterSpacing: "0.1em", marginBottom: 20 }}>
                    {pkg.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {pkg.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ color: pkg.color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "0 20px 48px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
              <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Co zyskujesz?</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
              {[
                { title: "Zasięg lokalny", desc: "Twoje logo widoczne dla kibiców, mieszkańców Drawna i okolicznych miejscowości — na stronie, boisku i w social media." },
                { title: "Profesjonalna prezentacja", desc: "Nowoczesna strona internetowa z tysiącami odsłon. Logo w sekcji sponsorów, artykuły o współpracy, relacje z meczów." },
                { title: "Zaangażowanie społeczne", desc: "Wspieranie lokalnego sportu buduje pozytywny wizerunek firmy. CSR w praktyce — widoczny dla klientów i partnerów." },
                { title: "Elastyczne warunki", desc: "Pakiety dopasowujemy do Twoich potrzeb i budżetu. Możliwość współpracy barterowej. Rozmawiajmy!" },
              ].map((item) => (
                <div key={item.title} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "24px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "0 20px 80px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 28, color: "#fff", letterSpacing: "0.08em", marginBottom: 12 }}>
              ZAINTERESOWANY?
            </div>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 24 }}>
              Skontaktuj się z nami — omówimy szczegóły współpracy i dopasujemy ofertę do Twoich potrzeb.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="mailto:drawa.drawno@zzpn.pl" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 8, color: "#3b82f6", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textDecoration: "none" }}>
                NAPISZ DO NAS
              </a>
              <a href="tel:+48691901479" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, color: "#22c55e", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textDecoration: "none" }}>
                ZADZWOŃ
              </a>
            </div>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none", letterSpacing: "0.1em" }}>
                ← Powrót na stronę główną
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
