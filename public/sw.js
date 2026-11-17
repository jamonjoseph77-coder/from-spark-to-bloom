const CACHE_NAME = "cinema-shell-v1";

// Keep navigation and authenticated API/media requests network-first.
// This worker enables installation without caching private account data,
// playback URLs, or licensed media on a shared device.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
