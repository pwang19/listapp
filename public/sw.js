const CACHE = 'listapp-v2';
const SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function cacheResponse(request, response) {
  if (response.ok) {
    const clone = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, clone));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only cache our own static files; API calls (e.g. sync) must always hit the network.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Pages: network first so a new deploy shows up on the next launch; cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse('/index.html', response))
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Vite assets are content-hashed, so a cached copy is never stale.
  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request).then((response) => cacheResponse(request, response))
    )
  );
});

// Daily reminder from the send-reminders edge function: { title, body }.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Lists', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w);
      return open ? open.focus() : self.clients.openWindow('/');
    })
  );
});
