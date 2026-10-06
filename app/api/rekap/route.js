import { db, json, need, list, safe } from "../../../lib/server";
const STATUS = ["hadir", "sakit", "izin", "terlambat", "alpha"];
const addDays = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const tgl = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || "");

export async function GET(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const start = new URL(req.url).searchParams.get("start");
  if (!tgl(start)) return json({ error: "Tanggal tidak valid" }, 400);
  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i)); // Senin - Sabtu
  const rentang = (r) => r.orderByChild("date").startAt(days[0]).endAt(days[5]);
  const [sw, sesi, rec] = await Promise.all([list("siswa"), list("sesi", rentang), list("absen", rentang)]);
  const now = Date.now();
  const siswa = sw.map((d) => ({ id: d.id, nama: d.nama })).sort((a, b) => a.nama.localeCompare(b.nama)).map((s) => {
    const hari = {}, total = Object.fromEntries(STATUS.map((k) => [k, 0]));
    for (const date of days) {
      const r = rec.filter((x) => x.siswaId === s.id && x.date === date);
      const pick = r.find((x) => x.manual) || r.sort((a, b) => b.at - a.at)[0];
      // Alpha otomatis: ada token hari itu yang sudah kedaluwarsa dan siswa tidak absen
      hari[date] = pick ? pick.status : sesi.some((x) => x.date === date && x.expiresAt < now) ? "alpha" : "";
      if (hari[date]) total[hari[date]]++;
    }
    return { ...s, hari, total };
  });
  return json({ days, siswa });
}
export async function PATCH(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const { siswaId, date, status } = await req.json();
  if (!safe(siswaId) || !tgl(date)) return json({ error: "Data tidak valid" }, 400);
  const ref = db.ref(`absen/manual_${siswaId}_${date}`);
  if (!status) await ref.remove();
  else if (STATUS.includes(status)) await ref.set({ siswaId, date, status, manual: true, at: Date.now() });
  else return json({ error: "Status tidak valid" }, 400);
  return json({ ok: true });
}
