export const metadata = {
  title: "Sklep",
  description: "Sklep z gadżetami klubowymi MKS Drawa Drawno — szaliki, koszulki, kubki i więcej.",
  alternates: { canonical: "https://mksdrawadrawno.pl/sklep" },
  openGraph: {
    title: "Sklep — MKS Drawa Drawno",
    description: "Gadżety klubowe MKS Drawa Drawno.",
    url: "https://mksdrawadrawno.pl/sklep",
    images: [{ url: "/logo.png" }],
  },
};

export default function SklepLayout({ children }) {
  return children;
}
