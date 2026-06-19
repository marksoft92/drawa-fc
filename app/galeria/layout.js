export const metadata = {
  title: "Galeria",
  description:
    "Galeria zdjęć MKS Drawa Drawno — fotorelacje z meczów, albumy z rozgrywek A klasy Zachodniopomorskiej.",
  alternates: { canonical: "https://mksdrawadrawno.pl/galeria" },
  openGraph: {
    title: "Galeria — MKS Drawa Drawno",
    description: "Fotorelacje z meczów MKS Drawa Drawno — albumy i zdjęcia z rozgrywek.",
    url: "https://mksdrawadrawno.pl/galeria",
    images: [{ url: "/logo.png" }],
  },
};

export default function GaleriaLayout({ children }) {
  return children;
}
