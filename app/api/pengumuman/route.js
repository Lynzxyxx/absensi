import { db, json, need, getSession, list } from "../../../lib/server";
import { kirim } from "../../../lib/push";

export async function GET() {
  if (!getSession()) return json({ error: "Silakan login" }, 401);
  return json((await list("pengumuman", (r) => r.orderByChild("at").limitToLast(5))).sort((a, b) => b.at - a.at));
}
export async function POST(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const { judul = "", isi = "" } = await req.json();
  if (!judul.trim() || !isi.trim()) return json({ error: "Isi judul dan pesan" }, 400);
  const data = { judul: judul.trim().slice(0, 80), isi: isi.trim().slice(0, 300), at: Date.now() };
  await db.ref("pengumuman").push(data);
  let terkirim = 0;
  try { terkirim = await kirim(null, { ...data, url: "/siswa" }); } catch (e) { return json({ error: "Pengumuman tersimpan, tapi notifikasi gagal dikirim." }, 500); }
  return json({ terkirim });
}
