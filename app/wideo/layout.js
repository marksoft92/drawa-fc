export const metadata = {
  title: "Wideo",
  description: "Filmy i skróty meczów MKS Drawa Drawno — relacje wideo z rozgrywek, bramki, akcje i kulisy drużyny z YouTube.",
  alternates: { canonical: "https://mksdrawadrawno.pl/wideo" },
  openGraph: {
    title: "Wideo — MKS Drawa Drawno",
    description: "Filmy i skróty meczów MKS Drawa Drawno z YouTube.",
    url: "https://mksdrawadrawno.pl/wideo",
    images: [{ url: "/logo.png" }],
  },
};

export default function WideoLayout({ children }) {
  return children;
}
