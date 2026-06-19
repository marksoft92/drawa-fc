export const metadata = {
  title: "Transmisja na żywo",
  description:
    "Oglądaj mecze MKS Drawa Drawno na żywo. Transmisje na żywo z rozgrywek A klasy Zachodniopomorskiej.",
  alternates: { canonical: "https://mksdrawadrawno.pl/transmisja" },
  openGraph: {
    title: "Transmisja na żywo — MKS Drawa Drawno",
    description: "Oglądaj mecze MKS Drawa Drawno na żywo. Transmisje z A klasy Zachodniopomorskiej.",
    url: "https://mksdrawadrawno.pl/transmisja",
  },
  robots: { index: true, follow: true },
};

export default function TransmisjaLayout({ children }) {
  return children;
}
