import "./globals.css";

export const metadata = {
  title: "MKS Drawa Drawno — Oficjalna Strona Klubu",
  description:
    "Oficjalna strona MKS Drawa Drawno. Wyniki, tabela, terminarz, kadra i aktualności z Klasy B Zachodniopomorskiej.",
  keywords: ["MKS Drawa", "Drawno", "piłka nożna", "Klasa B", "Zachodniopomorskie"],
  openGraph: {
    title: "MKS Drawa Drawno",
    description: "Oficjalna strona klubu piłkarskiego MKS Drawa Drawno",
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
