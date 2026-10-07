import { api } from "./api";
const b64 = (s) => { const raw = atob((s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))); };

export async function aktifkanNotif() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw new Error("Browser ini belum mendukung notifikasi");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.");
  const { key } = await api("/api/push/kunci");
  if (!key) throw new Error("Notifikasi belum diatur di server");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }));
  await api("/api/push/daftar", "POST", sub.toJSON());
}
