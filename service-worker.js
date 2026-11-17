// Retire the previous root-scoped editor worker after the directory migration.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => /^inkscreen-studio-v\d+$/.test(key)).map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
