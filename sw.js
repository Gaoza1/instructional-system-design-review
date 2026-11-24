const CACHE_NAME = "instructional-system-design-mooc-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./1%20%E6%A6%82%E8%AE%BA.html",
  "./2%20%E6%95%99%E5%AD%A6%E7%9B%AE%E6%A0%87%E5%88%86%E6%9E%90.html",
  "./3%20%E5%AD%A6%E4%B9%A0%E8%80%85%E7%89%B9%E5%BE%81%E5%88%86%E6%9E%90.html",
  "./4%20%E6%95%99%E5%AD%A6%E6%A8%A1%E5%BC%8F%E4%B8%8E%E7%AD%96%E7%95%A5%E7%9A%84%E9%80%89%E6%8B%A9%E5%92%8C%E8%AE%BE%E8%AE%A1.html",
  "./5%20%E5%AD%A6%E4%B9%A0%E7%8E%AF%E5%A2%83%E8%AE%BE%E8%AE%A1.html",
  "./6%20%E6%95%99%E5%AD%A6%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E7%BB%93%E6%9E%9C%E7%9A%84%E8%AF%84%E4%BB%B7.html",
  "./7%20%E6%95%99%E5%AD%A6%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E5%BA%94%E7%94%A8%E6%A1%88%E4%BE%8B%E5%88%86%E6%9E%90.html",
  "./8%20%E6%95%99%E5%AD%A6%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E5%8F%91%E5%B1%95%E7%9A%84%E6%96%B0%E5%8A%A8%E5%90%91.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("./index.html")) ||
            new Response("离线页面尚未缓存，请联网后重新打开一次。", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
