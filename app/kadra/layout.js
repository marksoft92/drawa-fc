export const metadata = {
  title: "Kadra",
  description:
    "Kadra MKS Drawa Drawno — zawodnicy, statystyki, pozycje i numery na koszulkach. Poznaj skład drużyny z A klasy Zachodniopomorskiej.",
  alternates: { canonical: "https://mksdrawadrawno.pl/kadra" },
  openGraph: {
    title: "Kadra — MKS Drawa Drawno",
    description: "Skład drużyny MKS Drawa Drawno — zawodnicy, pozycje i statystyki sezonu.",
    url: "https://mksdrawadrawno.pl/kadra",
    images: [{ url: "/logo.png" }],
  },
};

export default function KadraLayout({ children }) {
  return children;
}
