/* حاسبة الكميات — Service Worker
   غيّر VERSION مع كل تحديث للصفحة */
const VERSION = 'v1';
const CACHE = 'qc-' + VERSION;
const CORE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-touch-icon.png'];
const TIMEOUT = 4000;

function noCache(url) {
  const p = url.pathname;
  return p === '/login' || p === '/logout' || p.startsWith('/api/');
}
function cacheable(res) {
  return res && res.ok && res.status === 200 && res.type === 'basic' && !res.redirected;
}
function keyOf(url) { return url.origin + url.pathname; }

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const p of CORE) {
      try {
        const r = await fetch(p, { cache: 'no-store', redirect: 'manual', credentials: 'same-origin' });
        if (cacheable(r)) await c.put(new URL(p, self.location.origin).href, r);
      } catch (_) {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('qc-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const OFFLINE_HTML = '<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>لا يوجد اتصال</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#04110a;color:#e6f2ea;font:17px Tahoma,Arial,sans-serif;text-align:center">' +
  '<div><p>لا يوجد اتصال بالإنترنت<br><small style="color:#8fae9b">الدخول يحتاج اتصالاً</small></p><button onclick="location.reload()" style="min-height:48px;padding:0 24px;border-radius:12px;border:0;background:#34d27f;color:#04140b;font-weight:700;font-size:16px">إعادة المحاولة</button></div></body></html>';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (noCache(url)) {
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
    }
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = keyOf(url);
    const net = fetch(req).then(async (res) => {
      if (cacheable(res)) { try { await cache.put(key, res.clone()); } catch (_) {} }
      return res;
    });
    const timer = new Promise((resolve) => setTimeout(() => resolve('timeout'), TIMEOUT));
    try {
      const first = await Promise.race([net, timer]);
      if (first !== 'timeout') return first;
    } catch (_) { /* لا يوجد اتصال */ }
    const hit = await cache.match(key) || (req.mode === 'navigate' ? await cache.match(url.origin + '/') : undefined);
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    try { return await net; } catch (_) {
      return req.mode === 'navigate'
        ? new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        : Response.error();
    }
  })());
});
