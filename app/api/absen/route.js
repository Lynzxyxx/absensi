import { db, json, need, today, list } from "../../../lib/server";

export async function GET() {
  const s = need("siswa");
  if (!s) return json({ error: "Silakan login" }, 401);
  const me = (await db.ref(`siswa/${s.id}`).once("value")).val();
  if (!me) return json({ error: "Akun tidak ditemukan" }, 401);
  const rec = (await list("absen", (r) => r.orderByChild("siswaId").equalTo(s.id))).filter((x) => x.date === today());
  return json({ nama: me.nama, username: me.username, records: rec.sort((a, b) => b.at - a.at) });
}
export async function POST(req) {
  const s = need("siswa");
  if (!s) return json({ error: "Silakan login" }, 401);
  const { token = "", status, catatan = "" } = await req.json();
  const cat = String(catatan).trim().slice(0, 300);
  if (!["hadir", "sakit", "izin"].includes(status)) return json({ error: "Status tidak valid" }, 400);
  if (status !== "hadir" && cat.length < 3) return json({ error: "Isi penjelasan untuk sakit atau izin" }, 400);
  const sesi = (await list("sesi", (r) => r.orderByChild("token").equalTo(token.trim().toUpperCase()))).find((x) => x.expiresAt > Date.now());
  if (!sesi) return json({ error: "Token salah atau sudah kedaluwarsa" }, 400);
  const data = { sesiId: sesi.id, siswaId: s.id, date: sesi.date, status, at: Date.now(), ...(status !== "hadir" ? { catatan: cat } : {}) };
  const res = await db.ref(`absen/${sesi.id}_${s.id}`).transaction((cur) => (cur ? undefined : data));
  if (!res.committed) return json({ error: "Kamu sudah absen di sesi ini" }, 409);
  return json({ ok: true });
}
