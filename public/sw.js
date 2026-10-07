// Service worker: agar bisa dipasang sebagai aplikasi dan menerima notifikasi. Tanpa cache, data selalu terbaru.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.registration.showNotification(d.judul || "Absen Kelas X.E 2", {
    body: d.isi || "", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: d.url || "/siswa" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/siswa";
  e.waitUntil(self.clients.openWindow(url));
});
