import admin from "firebase-admin";
import crypto from "crypto";
import { cookies } from "next/headers";

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }), databaseURL: process.env.FIREBASE_DATABASE_URL });
}
export const db = admin.database();
export const safe = (x) => typeof x === "string" && /^[\w-]+$/.test(x);
export async function list(path, q) {
  const snap = await (q ? q(db.ref(path)) : db.ref(path)).once("value");
  const out = [];
  snap.forEach((c) => { out.push({ id: c.key, ...c.val() }); });
  return out;
}
export const json = (d, status = 200) => Response.json(d, { status });
export const today = (d = new Date()) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

const sign = (v) => crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(v).digest("base64url");
export function makeSession(data) {
  const p = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + 7 * 864e5 })).toString("base64url");
  return p + "." + sign(p);
}
export function getSession() {
  const c = cookies().get("s")?.value;
  if (!c) return null;
  const [p, s] = c.split(".");
  if (!p || !s || s !== sign(p)) return null;
  const d = JSON.parse(Buffer.from(p, "base64url").toString());
  return d.exp > Date.now() ? d : null;
}
export function need(role) { const s = getSession(); return s && s.role === role ? s : null; }
export const hashPw = (pw, salt = crypto.randomBytes(8).toString("hex")) => salt + ":" + crypto.scryptSync(pw, salt, 32).toString("hex");
export function checkPw(pw, h) {
  const a = Buffer.from(hashPw(pw, h.split(":")[0])), b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
