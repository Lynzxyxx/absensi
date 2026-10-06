import { db, json, need, list, safe, today } from "../../../lib/server";
const STATUS = ["hadir", "sakit", "izin", "terlambat", "alpha"];
const addDays = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const tgl = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || "");
const weekday = (d) => { const k = new Date(d + "T00:00:00Z").getUTCDay(); return k >= 1 && k <= 5; }; // Senin - Jumat

export async function GET(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const u = new URL(req.url).searchParams, mode = u.get("mode") || "minggu", tg = u.get("tgl") || today();
  if (!tgl(tg) || !["hari", "minggu", "semua"].includes(mode)) return json({ error: "Permintaan tidak valid" }, 400);
  let days = null;
  if (mode === "hari") days = [today()];
  else if (mode === "minggu") { const mon = addDays(tg, -((new Date(tg + "T00:00:00Z").getUTCDay() + 6) % 7)); days = Array.from({ length: 5 }, (_, i) => addDays(mon, i)); }
  const rentang = (r) => (days ? r.orderByChild("date").startAt(days[0]).endAt(days[days.length - 1]) : r);
  const [sw, sesi, rec] = await Promise.all([list("siswa"), list("sesi", rentang), list("absen", rentang)]);
  days = (days || [...new Set(sesi.map((x) => x.date))].sort()).filter(weekday);
  const now = Date.now();
  const siswa = sw.map((d) => ({ id: d.id, nama: d.nama })).sort((a, b) => a.nama.localeCompare(b.nama)).map((s) => {
    const hari = {}, cat = {}, total = Object.fromEntries(STATUS.map((k) => [k, 0]));
    for (const date of days) {
      const r = rec.filter((x) => x.siswaId === s.id && x.date === date).sort((a, b) => b.at - a.at);
      const pick = r.find((x) => x.manual) || r[0];
      // Alpha otomatis: ada token hari itu yang sudah kedaluwarsa dan siswa tidak absen
      hari[date] = pick ? pick.status : sesi.some((x) => x.date === date && x.expiresAt < now) ? "alpha" : "";
      if (hari[date]) total[hari[date]]++;
      const asli = r.find((x) => !x.manual && x.catatan);
      if (asli && ["sakit", "izin"].includes(hari[date])) cat[date] = asli.catatan;
    }
    return { ...s, hari, cat, total };
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
