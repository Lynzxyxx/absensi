import { api } from "./api";
const b64 = (x) => { const raw = atob((x + "=".repeat((4 - (x.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))); };
// Notifikasi lokal: muncul selama aplikasi terbuka (tanpa server push, tanpa variabel tambahan).
const aktif = () => typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && localStorage.getItem("notif") === "1";

async function tampil(judul, isi, url = "/siswa") {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(judul, { body: isi, icon: "/icon-192.png", badge: "/icon-192.png", data: { url } });
  } catch { try { new Notification(judul, { body: isi }); } catch {} }
}

export async function aktifkanNotif(pengumuman = []) {
  if (!("Notification" in window)) throw new Error("Browser ini belum mendukung notifikasi");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.");
  localStorage.setItem("n_peng", String(Math.max(0, ...pengumuman.map((x) => x.at)))); // pengumuman lama tidak dimunculkan lagi
  let mode = "1"; // "1" = notifikasi lokal (aplikasi terbuka), "push" = masuk walau aplikasi tertutup
  try {
    const { key } = await api("/api/push/kunci");
    if (key && "PushManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }));
      await api("/api/push/daftar", "POST", sub.toJSON());
      mode = "push";
    }
  } catch {}
  localStorage.setItem("notif", mode);
  await tampil("Notifikasi aktif", mode === "push" ? "Kamu akan diberi tahu soal token dan pengumuman, juga saat aplikasi tertutup." : "Kamu akan diberi tahu soal token dan pengumuman selama aplikasi terbuka.");
  return mode;
}

export function cekNotif(d, pengumuman) {
  if (!aktif()) return;
  const terakhir = Number(localStorage.getItem("n_peng") || 0);
  const baru = pengumuman.filter((x) => x.at > terakhir).sort((a, b) => a.at - b.at);
  if (baru.length) { baru.slice(-3).forEach((x) => tampil(x.judul, x.isi)); localStorage.setItem("n_peng", String(baru[baru.length - 1].at)); }
  const s = d.sesiAktif;
  if (s && !s.sudah) {
    if (localStorage.getItem("n_sesi") !== s.id) { localStorage.setItem("n_sesi", s.id); tampil("Token absen dibuka", "Segera isi absen sebelum token berakhir."); }
    if ((s.pengingatAt || 0) > Number(localStorage.getItem("n_ping") || 0)) { localStorage.setItem("n_ping", String(s.pengingatAt)); tampil("Jangan lupa absen!", "Token absen masih aktif. Segera isi absenmu."); }
  }
}

// Unduh APK dari server. Selalu tersedia, termasuk di aplikasi yang sudah terpasang.
export async function unduhApk() {
  try { const r = await fetch("/absen-kelas.apk", { method: "HEAD" }); if (!r.ok) return "File APK belum tersedia di server."; }
  catch { return "Tidak bisa memeriksa file APK. Periksa koneksi internet."; }
  const a = document.createElement("a"); a.href = "/absen-kelas.apk"; a.download = "absen-kelas.apk";
  document.body.appendChild(a); a.click(); a.remove();
  return "Mengunduh APK…";
}
