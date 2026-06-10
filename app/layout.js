import "./globals.css";

const BASE_URL = "https://mksdrawadrawno.pl";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MKS Drawa Drawno — Oficjalna Strona Klubu",
    template: "%s | MKS Drawa Drawno",
  },
  description:
    "Oficjalna strona MKS Drawa Drawno. Wyniki, tabela, terminarz, kadra i aktualności z Klasy B Zachodniopomorskiej.",
  keywords: [
    "MKS Drawa Drawno", "Drawa Drawno", "piłka nożna Drawno",
    "Klasa B Zachodniopomorska", "MKS Drawa", "wyniki mecze Drawno",
    "tabela Klasa B", "terminarz Drawno", "klub piłkarski Drawno",
  ],
  authors: [{ name: "MKS Drawa Drawno", url: BASE_URL }],
  creator: "MKS Drawa Drawno",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "MKS Drawa Drawno",
    title: "MKS Drawa Drawno — Oficjalna Strona Klubu",
    description: "Wyniki, tabela, terminarz, kadra i aktualności MKS Drawa Drawno z Klasy B Zachodniopomorskiej.",
    locale: "pl_PL",
    images: [
      {
        url: "/logo.png",
        width: 850,
        height: 850,
        alt: "MKS Drawa Drawno — herb klubu",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MKS Drawa Drawno",
    description: "Wyniki, tabela, terminarz i aktualności MKS Drawa Drawno.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
