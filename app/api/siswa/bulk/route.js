import crypto from "crypto";
import { db, json, need, hashPw, list } from "../../../../lib/server";

export async function POST(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const { daftar = "", passwordSama = "" } = await req.json();
  const namaList = daftar.split(/\r?\n/).map((x) => x.trim().replace(/\s+/g, " ")).filter(Boolean);
  if (!namaList.length) return json({ error: "Tempel minimal satu nama" }, 400);
  if (namaList.length > 200) return json({ error: "Maksimal 200 nama sekaligus" }, 400);
  if (passwordSama && passwordSama.length < 4) return json({ error: "Password minimal 4 karakter" }, 400);
  const dipakai = new Set((await list("siswa")).map((d) => d.username));
  dipakai.add((process.env.WALI_USERNAME || "").toLowerCase());
  const upd = {}, hasil = [];
  for (const nama of namaList) {
    // Username otomatis: huruf kecil, tanpa titik, pakai spasi (contoh: "budi santoso")
    const dasar = nama.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim() || "siswa";
    let u = dasar, n = 1;
    while (dipakai.has(u)) u = dasar + ++n;
    dipakai.add(u);
    const password = passwordSama || String(crypto.randomInt(100000, 1000000));
    upd[db.ref("siswa").push().key] = { nama, username: u, hash: hashPw(password) };
    hasil.push({ nama, username: u, password });
  }
  await db.ref("siswa").update(upd);
  return json({ hasil });
}
