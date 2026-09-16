import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata = {
  title: "Polityka prywatności — MKS Drawa Drawno",
  description: "Polityka prywatności serwisu mksdrawadrawno.pl — zasady przetwarzania danych osobowych, pliki cookie oraz prawa użytkownika.",
  alternates: { canonical: "https://mksdrawadrawno.pl/privacy" },
};

const LAST_UPDATED = "16 września 2026";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const ustawienia = await prisma.ustawienie.findMany();
  const ust = Object.fromEntries(ustawienia.map(r => [r.klucz, r.wartosc]));
  const email = ust.emailKlub || "kontakt@mksdrawadrawno.pl";

  return (
    <>
      <NavBar backLabel="← Strona główna" />
      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "0.06em", marginBottom: 8 }}>
            Polityka prywatności
          </h1>
          <p style={{ fontSize: 12, color: "#475569", marginBottom: 36 }}>Ostatnia aktualizacja: {LAST_UPDATED}</p>

          <Section title="1. Administrator danych">
            <p>
              Administratorem danych osobowych przetwarzanych w związku z korzystaniem z serwisu mksdrawadrawno.pl
              jest MKS Drawa Drawno, ul. Choszczeńska 85a, 73-220 Drawno („Administrator", „Klub").
              Kontakt w sprawach ochrony danych: <a href={`mailto:${email}`} style={{ color: "#3b82f6" }}>{email}</a>.
            </p>
          </Section>

          <Section title="2. Jakie dane zbieramy i w jakim celu">
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <li><strong style={{ color: "#cbd5e1" }}>Konto użytkownika</strong> — przy rejestracji konta (np. zawodnika, działacza) zbieramy imię i nazwisko, adres e-mail oraz dane niezbędne do prowadzenia profilu sportowego. Podstawa: realizacja umowy / zgoda.</li>
              <li><strong style={{ color: "#cbd5e1" }}>Dane zawodników małoletnich</strong> — w przypadku profili niepełnoletnich zawodników dane przetwarzane są za zgodą rodzica lub opiekuna prawnego, wyłącznie w zakresie niezbędnym do prowadzenia dokumentacji sportowej klubu.</li>
              <li><strong style={{ color: "#cbd5e1" }}>Komentarze</strong> — treść komentarza oraz dane powiązane z kontem. Podstawa: zgoda / prawnie uzasadniony interes (moderacja).</li>
              <li><strong style={{ color: "#cbd5e1" }}>Czat i wiadomości prywatne</strong> — treść wiadomości i załączone pliki, przechowywane w celu umożliwienia komunikacji w Serwisie.</li>
              <li><strong style={{ color: "#cbd5e1" }}>Newsletter</strong> — adres e-mail podany dobrowolnie. Podstawa: zgoda. Wypisanie możliwe w każdej chwili linkiem w stopce wiadomości.</li>
              <li><strong style={{ color: "#cbd5e1" }}>Powiadomienia push</strong> — za zgodą przeglądarki. Zgodę można cofnąć w ustawieniach przeglądarki.</li>
              <li><strong style={{ color: "#cbd5e1" }}>Sklep internetowy</strong> — dane niezbędne do realizacji zamówienia (imię i nazwisko, adres dostawy, e-mail, ewentualnie dane do faktury). Podstawa: realizacja umowy sprzedaży.</li>
            </ul>
          </Section>

          <Section title="3. Pliki cookie i technologie analityczne / reklamowe">
            <p style={{ marginBottom: 10 }}>Serwis wykorzystuje pliki cookie oraz podobne technologie:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Cookie niezbędne do działania Serwisu (logowanie, koszyk sklepu) — nie wymagają zgody.</li>
              <li>Google Analytics — analiza ruchu i statystyk odwiedzin, za zgodą wyrażoną w bannerze cookie.</li>
              <li>Google AdSense / reklamy Google — wyświetlanie reklam, w tym spersonalizowanych, za zgodą użytkownika.</li>
              <li>Google News / Subscribe with Google (Reader Revenue Manager) — technologia umożliwiająca subskrypcje i wsparcie czytelnicze za pośrednictwem Google.</li>
            </ul>
            <p style={{ marginTop: 10 }}>Zgodę na cookie inne niż niezbędne można w każdej chwili wycofać w ustawieniach przeglądarki lub w bannerze zgody wyświetlanym przy pierwszej wizycie.</p>
          </Section>

          <Section title="4. Odbiorcy danych">
            <p>
              Dane mogą być przekazywane podmiotom wspierającym działanie Serwisu: dostawcy hostingu,
              Google LLC (Analytics, AdSense, Subscribe with Google) na zasadach określonych w ich politykach
              prywatności, oraz — w przypadku zamówień w sklepie — firmom kurierskim realizującym dostawę.
            </p>
          </Section>

          <Section title="5. Okres przechowywania danych">
            <p>
              Dane przechowujemy przez okres niezbędny do realizacji celów, dla których zostały zebrane,
              a następnie — przez okres wynikający z przepisów prawa (np. przepisów podatkowych dla dokumentów
              sprzedaży) lub do momentu wycofania zgody.
            </p>
          </Section>

          <Section title="6. Twoje prawa">
            <p>
              Zgodnie z RODO przysługuje Ci prawo do: dostępu do danych, sprostowania, usunięcia
              („prawo do bycia zapomnianym"), ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu
              wobec przetwarzania. Przysługuje Ci również prawo wniesienia skargi do Prezesa Urzędu Ochrony
              Danych Osobowych (UODO). W celu realizacji swoich praw skontaktuj się z nami pod adresem podanym w pkt 1.
            </p>
          </Section>

          <Section title="7. Bezpieczeństwo danych">
            <p>Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych przed nieuprawnionym dostępem, utratą lub zniszczeniem.</p>
          </Section>

          <Section title="8. Zmiany polityki prywatności">
            <p>Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej polityce. Aktualna wersja zawsze dostępna jest pod adresem mksdrawadrawno.pl/privacy.</p>
          </Section>
        </div>
      </main>
    </>
  );
}
