import crypto from "crypto";
import { db, json, need, today, list } from "../../../lib/server";
import { kirim } from "../../../lib/push";

export async function GET() {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  return json((await list("sesi", (r) => r.orderByChild("createdAt").limitToLast(10))).sort((a, b) => b.createdAt - a.createdAt));
}
export async function POST(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const b = await req.json(), now = Date.now();
  let expiresAt;
  if (b.sampai) {
    // Jam berakhir hari ini (WIB), format HH:MM
    if (!/^\d{2}:\d{2}$/.test(b.sampai)) return json({ error: "Format jam tidak valid" }, 400);
    expiresAt = Date.parse(`${today()}T${b.sampai}:00+07:00`);
    if (!(expiresAt > now)) return json({ error: "Jam berakhir harus lebih dari jam sekarang" }, 400);
  } else {
    expiresAt = now + Math.min(Math.max(parseInt(b.menit) || 10, 1), 600) * 60000;
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const token = Array.from(crypto.randomBytes(6), (x) => chars[x % chars.length]).join("");
  await db.ref("sesi").push({ token, date: today(), createdAt: now, expiresAt });
  try { await kirim(null, { judul: "Token absen dibuka", isi: "Segera isi absen sebelum token berakhir.", url: `/siswa?token=${token}` }); } catch {}
  return json({ ok: true });
}
