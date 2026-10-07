import crypto from "crypto";
import { db } from "./server";

const tanda = (n, e, c) => crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(`${n}.${e}.${c}`).digest("hex");
const rnd = (a, b) => a + Math.random() * (b - a);

// Buat captcha gambar (SVG). Jawaban tidak disimpan di mana pun, hanya tanda tangan HMAC di dalam token.
export function buatCaptcha() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = Array.from(crypto.randomBytes(5), (b) => chars[b % chars.length]).join("");
  const nonce = crypto.randomBytes(8).toString("hex"), exp = Date.now() + 120000;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><rect width="150" height="50" rx="6" fill="#1e293b"/>`;
  for (let i = 0; i < 6; i++) svg += `<line x1="${rnd(0, 150) | 0}" y1="${rnd(0, 50) | 0}" x2="${rnd(0, 150) | 0}" y2="${rnd(0, 50) | 0}" stroke="#${["475569", "64748b", "3b82f6"][i % 3]}" stroke-width="1.5"/>`;
  [...code].forEach((c, i) => {
    svg += `<text x="${14 + i * 26}" y="${rnd(32, 38).toFixed(0)}" font-size="${rnd(24, 30).toFixed(0)}" font-family="monospace" font-weight="700" fill="${["#e2e8f0", "#93c5fd", "#fde68a", "#a7f3d0"][i % 4]}" transform="rotate(${rnd(-22, 22).toFixed(0)} ${18 + i * 26} 26)">${c}</text>`;
  });
  return { token: `${nonce}.${exp}.${tanda(nonce, exp, code)}`, svg: svg + "</svg>" };
}

// Cek jawaban. Token ditandai terpakai lebih dulu, jadi tiap token hanya boleh dicoba satu kali.
export async function cekCaptcha(token = "", jawab = "") {
  const [n, e, s] = String(token).split(".");
  if (!n || !e || !s || !/^[a-f0-9]{16}$/.test(n) || !(Number(e) > Date.now())) return false;
  const res = await db.ref(`captcha/${n}`).transaction((c) => (c ? undefined : Date.now()));
  if (!res.committed) return false;
  const a = Buffer.from(tanda(n, e, String(jawab).trim().toUpperCase())), b = Buffer.from(s);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
