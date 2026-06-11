export default function manifest() {
  return {
    name: 'MKS Drawa Drawno',
    short_name: 'MKS Drawa',
    description: 'Oficjalna strona MKS Drawa Drawno — wyniki, tabela, kadra, aktualności',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#030712',

    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
