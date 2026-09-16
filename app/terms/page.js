import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata = {
  title: "Regulamin serwisu — MKS Drawa Drawno",
  description: "Regulamin i warunki korzystania z serwisu mksdrawadrawno.pl.",
  alternates: { canonical: "https://mksdrawadrawno.pl/terms" },
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

export default async function TermsPage() {
  const ustawienia = await prisma.ustawienie.findMany();
  const ust = Object.fromEntries(ustawienia.map(r => [r.klucz, r.wartosc]));
  const email = ust.emailKlub || "kontakt@mksdrawadrawno.pl";

  return (
    <>
      <NavBar backLabel="← Strona główna" />
      <main style={{ paddingTop: 64, background: "#030712", minHeight: "100vh", color: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "0.06em", marginBottom: 8 }}>
            Regulamin serwisu
          </h1>
          <p style={{ fontSize: 12, color: "#475569", marginBottom: 36 }}>Ostatnia aktualizacja: {LAST_UPDATED}</p>

          <Section title="1. Postanowienia ogólne">
            <p>
              Niniejszy regulamin określa zasady korzystania z serwisu internetowego mksdrawadrawno.pl
              („Serwis"), prowadzonego przez MKS Drawa Drawno z siedzibą przy ul. Choszczeńskiej 85a,
              73-220 Drawno („Klub").
            </p>
          </Section>

          <Section title="2. Charakter serwisu">
            <p>
              Serwis pełni funkcję oficjalnej strony klubu piłkarskiego MKS Drawa Drawno oraz redaguje
              informacje o lokalnej piłce nożnej w województwie zachodniopomorskim w dziale „Piłka lokalna".
            </p>
          </Section>

          <Section title="3. Źródła i charakter treści w dziale „Piłka lokalna”">
            <p style={{ marginBottom: 10 }}>
              Artykuły publikowane w dziale „Piłka lokalna" powstają na podstawie publicznie dostępnych
              informacji publikowanych przez inne kluby piłkarskie na ich oficjalnych profilach w mediach
              społecznościowych. Mają charakter dziennikarsko-informacyjny — są redakcyjnym opracowaniem
              faktów (wynik, skład, terminy), a nie kopią oryginalnej publikacji. Redakcja dokłada starań,
              by treści były rzetelne i zgodne z faktami podanymi przez źródło.
            </p>
            <p>
              Jeżeli reprezentujesz klub, którego dotyczy publikacja, i chcesz zgłosić nieścisłość, sprzeciw
              wobec publikacji lub prośbę o korektę bądź usunięcie artykułu — napisz do nas na adres{" "}
              <a href={`mailto:${email}`} style={{ color: "#3b82f6" }}>{email}</a>. Zgłoszenie rozpatrzymy niezwłocznie.
            </p>
          </Section>

          <Section title="4. Zasady korzystania z funkcji społecznościowych">
            <p style={{ marginBottom: 10 }}>Korzystając z komentarzy, czatu, wiadomości prywatnych lub innych funkcji społecznościowych Serwisu, zobowiązujesz się do:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              <li>nieumieszczania treści bezprawnych, obraźliwych, dyskryminujących lub naruszających dobra osobiste innych osób,</li>
              <li>nieużywania Serwisu do spamu ani działań niezgodnych z jego przeznaczeniem.</li>
            </ul>
            <p>Administrator zastrzega sobie prawo do moderacji, edycji lub usunięcia treści naruszających powyższe zasady oraz do zablokowania konta w przypadku rażących naruszeń.</p>
          </Section>

          <Section title="5. Konto użytkownika">
            <p>Rejestracja konta jest dobrowolna. Użytkownik zobowiązany jest do podania prawdziwych danych i ponosi odpowiedzialność za działania podejmowane w ramach swojego konta.</p>
          </Section>

          <Section title="6. Sklep internetowy">
            <p>
              Zakupy w sklepie dostępnym pod adresem /sklep podlegają przepisom ustawy o prawach konsumenta.
              Konsumentowi przysługuje prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni od
              otrzymania towaru, bez podawania przyczyny. Reklamacje rozpatrywane są zgodnie z przepisami
              Kodeksu cywilnego o rękojmi.
            </p>
          </Section>

          <Section title="7. Typowanie wyników">
            <p>
              Funkcja „Typowanie" ma charakter rozrywkowy i społecznościowy — służy integracji kibiców wokół
              klubu i nie stanowi gry hazardowej ani zakładu wzajemnego w rozumieniu ustawy o grach hazardowych.
              Punkty przyznawane w ramach funkcji nie są wymienialne na nagrody pieniężne, chyba że regulamin
              konkretnej edycji stanowi inaczej.
            </p>
          </Section>

          <Section title="8. Prawa autorskie">
            <p>
              Zawartość Serwisu (teksty własne, zdjęcia, grafiki, kod strony) chroniona jest prawem autorskim
              i stanowi własność Klubu lub jest wykorzystywana za zgodą uprawnionych podmiotów. Kopiowanie
              i rozpowszechnianie treści bez zgody Administratora jest zabronione, z zastrzeżeniem dozwolonego
              użytku wynikającego z przepisów prawa.
            </p>
          </Section>

          <Section title="9. Odpowiedzialność">
            <p>
              Administrator dokłada starań, aby informacje publikowane w Serwisie (wyniki, terminarz,
              statystyki) były aktualne i zgodne z rzeczywistością, jednak nie ponosi odpowiedzialności
              za ewentualne błędy wynikające z opóźnień lub nieścisłości w danych źródłowych.
            </p>
          </Section>

          <Section title="10. Postanowienia końcowe">
            <p>
              W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa polskiego.
              Regulamin może ulec zmianie — aktualna wersja zawsze dostępna jest pod adresem
              mksdrawadrawno.pl/terms. Kontakt w sprawach związanych z regulaminem:{" "}
              <a href={`mailto:${email}`} style={{ color: "#3b82f6" }}>{email}</a>.
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}
