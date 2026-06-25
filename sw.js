const CACHE_NAME = "health-assistant-20260626-3";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles/main.css?v=20260626-2",
  "./scripts/app.js?v=20260626-2",
  "./data/services.js?v=20260626-3",
  "./data/announcements.js?v=20260625-1",
  "./data/gallery.js?v=20260625-1",
  "./data/gallery.js",
  "./assets/images/assistant-logo.png",
  "./assets/images/01.png",
  "./assets/images/02.png",
  "./assets/images/03.png",
  "./assets/images/04.png",
  "./assets/images/05.png",
  "./assets/audio/00 المقدمة.mp3",
  "./assets/audio/01 تسجيل الميلاد.mp3",
  "./assets/audio/02 التطعيمات.mp3",
  "./assets/audio/03 تسجيل الوفاه.mp3",
  "./assets/audio/04 تنمية الاسرة.mp3",
  "./assets/audio/05 الاجازات والعطلات الرسمية.mp3",
  "./assets/audio/06 التأمين الصحى.mp3"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isFreshAsset =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (isFreshAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
