const CACHE_NAME = "inkscreen-studio-v7";
const VERSION = "0.4.2";
const ASSETS = [
  "./",
  "./index.html",
  `./styles.css?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  `./manifest.json?v=${VERSION}`,
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const request = event.request;
  const isDocument = request.mode === "navigate" || request.destination === "document";
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return isDocument ? caches.match("./index.html") : undefined;
      }))
  );
});
