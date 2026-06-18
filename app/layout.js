import "./globals.css";
import GlobalAudio from "@/components/GlobalAudio";
import ServiceWorker from "@/components/ServiceWorker";
import SplashScreen from "@/components/SplashScreen";
import DrawaChat from "@/components/DrawaChat";
import AntiCopy from "@/components/AntiCopy";

const BASE_URL = "https://mksdrawadrawno.pl";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MKS Drawa Drawno — Oficjalna Strona Klubu",
    template: "%s | MKS Drawa Drawno",
  },
  description:
    "Oficjalna strona MKS Drawa Drawno — klub piłkarski z Drawna, woj. zachodniopomorskie. Wyniki na żywo, tabela ligowa, terminarz meczów, kadra, galeria zdjęć i aktualności. Założony w 1947 roku.",
  keywords: [
    "MKS Drawa Drawno", "Drawa Drawno", "piłka nożna Drawno",
    "klub piłkarski Drawno", "wyniki Drawa Drawno", "tabela Drawa",
    "terminarz meczów Drawno", "B klasa zachodniopomorska",
    "zachodniopomorskie piłka nożna", "amatorska piłka nożna Drawno",
    "kadra Drawa Drawno", "mecze Drawno", "liga Drawno",
    "historia klubu Drawno", "archiwum wyników Drawa",
  ],
  authors: [{ name: "MKS Drawa Drawno", url: BASE_URL }],
  creator: "MKS Drawa Drawno",
  robots: { index: true, follow: true },
  other: {
    copyright: `© ${new Date().getFullYear()} MKS Drawa Drawno. Wszelkie prawa zastrzeżone. Projekt i kod strony są chronione prawem autorskim.`,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "MKS Drawa Drawno",
    title: "MKS Drawa Drawno — Oficjalna Strona Klubu",
    description: "Oficjalna strona MKS Drawa Drawno. Wyniki, tabela, terminarz, kadra i aktualności. Klub założony w 1947 roku.",
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
    card: "summary_large_image",
    title: "MKS Drawa Drawno",
    description: "Oficjalna strona MKS Drawa Drawno — wyniki, tabela, kadra. Klub założony w 1947.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MKS Drawa',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
        <script
          defer
          src="/a.js"
          data-website-id="02c455f0-bd76-4de5-a89c-69c0a8709ea0"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            name: "MKS Drawa Drawno",
            alternateName: "Drawa Drawno",
            url: "https://mksdrawadrawno.pl",
            logo: "https://mksdrawadrawno.pl/logo.png",
            foundingDate: "1947",
            sport: "Piłka nożna",
            location: {
              "@type": "Place",
              name: "Stadion MKS Drawa Drawno",
              address: {
                "@type": "PostalAddress",
                streetAddress: "ul. Choszczeńska 85a",
                addressLocality: "Drawno",
                postalCode: "73-220",
                addressRegion: "zachodniopomorskie",
                addressCountry: "PL",
              },
            },
            sameAs: [
              "https://www.facebook.com/profile.php?id=100031740656452",
              "https://www.instagram.com/mksdrawadrawno/",
            ],
          }) }}
        />
        <AntiCopy />
        <ServiceWorker />
        <GlobalAudio />
        <SplashScreen />
        <DrawaChat />
        {children}
      </body>
    </html>
  );
}
