import { json, need, list } from "../../../lib/server";
import { kirim } from "../../../lib/push";

export async function POST() {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const sesi = (await list("sesi", (r) => r.orderByChild("createdAt").limitToLast(1)))[0];
  if (!sesi || sesi.expiresAt <= Date.now()) return json({ error: "Tidak ada token yang sedang aktif" }, 400);
  const sudah = new Set((await list("absen", (r) => r.orderByChild("sesiId").equalTo(sesi.id))).map((x) => x.siswaId));
  const belum = (await list("siswa")).map((x) => x.id).filter((id) => !sudah.has(id));
  let terkirim = 0;
  try { terkirim = belum.length ? await kirim(belum, { judul: "Jangan lupa absen!", isi: "Token absen masih aktif. Segera isi absenmu.", url: `/siswa?token=${sesi.token}` }) : 0; }
  catch { return json({ error: "Notifikasi gagal dikirim." }, 500); }
  return json({ terkirim, belum: belum.length });
}
