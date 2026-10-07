import webpush from "web-push";
import crypto from "crypto";
import { db } from "./server";

let siap = false;
function init() {
  if (siap) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  siap = true;
}
export const kunciSub = (endpoint) => crypto.createHash("sha1").update(endpoint).digest("hex");

// Kirim notifikasi ke semua perangkat siswa (ids = null berarti semua siswa). Mengembalikan jumlah perangkat yang menerima.
export async function kirim(ids, payload) {
  init();
  const data = (await db.ref("push").once("value")).val() || {};
  let terkirim = 0;
  const jobs = [];
  for (const [sid, subs] of Object.entries(data)) {
    if (ids && !ids.includes(sid)) continue;
    for (const [k, sub] of Object.entries(subs)) {
      jobs.push(webpush.sendNotification(sub, JSON.stringify(payload)).then(() => { terkirim++; })
        .catch(async (e) => { if (e.statusCode === 404 || e.statusCode === 410) await db.ref(`push/${sid}/${k}`).remove(); }));
    }
  }
  await Promise.all(jobs);
  return terkirim;
}
