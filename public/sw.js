/* 代码百宝箱 Service Worker：离线可用 + HTML 实时更新。 */
const CACHE = 'code-utils-v1'
const CORE = ['./', './manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const accept = req.headers.get('accept') || ''

  // HTML 走 network-first：保证新版本及时生效，离线时回退缓存
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(req, clone))
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./')))
    )
    return
  }

  // JS/CSS/字体/图片等走 cache-first：带 hash 的资源天生版本化
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(req, clone))
          }
          return res
        })
    )
  )
})
