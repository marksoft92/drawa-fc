import NavBar from "@/components/NavBar";
import NewsletterClient from "./NewsletterClient";

export const metadata = {
  title: "Newsletter — MKS Drawa Drawno | Bądź na bieżąco",
  description: "Zapisz się do newslettera MKS Drawa Drawno — wyniki meczów, relacje, zapowiedzi spotkań i aktualności klubowe prosto na Twój email. Dołącz do kibiców Drawy!",
  alternates: { canonical: "https://mksdrawadrawno.pl/newsletter" },
  keywords: ["newsletter MKS Drawa", "newsletter piłka nożna Drawno", "wyniki Drawa Drawno email", "kibic Drawa Drawno"],
  openGraph: {
    title: "Newsletter MKS Drawa Drawno",
    description: "Zapisz się i otrzymuj wyniki, relacje i zapowiedzi meczów prosto na email.",
    url: "https://mksdrawadrawno.pl/newsletter",
    images: [{ url: "/opengraph-image" }],
  },
};

export default function NewsletterPage() {
  return (
    <>
      <NavBar backLabel="Strona główna" />
      <NewsletterClient />
    </>
  );
}
