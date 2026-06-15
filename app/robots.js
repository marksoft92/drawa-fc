export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/panel', '/admin', '/login', '/konto', '/api/'],
      },
    ],
    sitemap: 'https://mksdrawadrawno.pl/sitemap.xml',
  };
}
