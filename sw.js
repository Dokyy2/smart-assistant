const CACHE_NAME = "health-assistant-20260625-1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles/main.css?v=20260625-1",
  "./scripts/app.js?v=20260625-1",
  "./data/services.js?v=20260625-1",
  "./data/announcements.js?v=20260625-1",
  "./data/gallery.js?v=20260625-1",
  "./data/gallery.js",
  "./assets/images/assistant-logo.png",
  "./assets/images/01.png",
  "./assets/images/02.png",
  "./assets/images/03.png",
  "./assets/images/04.png",
  "./assets/images/05.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
