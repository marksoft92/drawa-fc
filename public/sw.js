const CACHE = 'drawa-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('manifest.webmanifest')) return;
  if (e.request.url.includes('/api/')) return;
  if (e.request.url.includes('/konto')) return;
  if (e.request.url.includes('/admin')) return;
  if (e.request.url.includes('/panel')) return;
  if (e.request.url.includes('/login')) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: 'MKS Drawa', body: e.data.text() }; }

  const targetPath = data.url || '/panel';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // nie pokazuj powiadomienia jeśli użytkownik już jest na tej stronie i ją widzi
      const alreadyThere = clients.some((c) => {
        try {
          const path = new URL(c.url).pathname;
          return path.startsWith(targetPath) && c.visibilityState === 'visible';
        } catch { return false; }
      });
      if (alreadyThere) return;

      return self.registration.showNotification(data.title || 'MKS Drawa', {
        body: data.body || '',
        icon: '/android-chrome-192x192.png',
        data: { url: targetPath },
      });
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.navigate(url); return existing.focus(); }
      return self.clients.openWindow(url);
    })
  );
});
