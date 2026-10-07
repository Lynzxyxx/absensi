import { db, json, need } from "../../../../lib/server";
import { kunciSub } from "../../../../lib/push";

export async function POST(req) {
  const s = need("siswa");
  if (!s) return json({ error: "Silakan login" }, 401);
  const sub = await req.json();
  if (!sub?.endpoint || !sub?.keys) return json({ error: "Data langganan tidak valid" }, 400);
  await db.ref(`push/${s.id}/${kunciSub(sub.endpoint)}`).set({ endpoint: sub.endpoint, expirationTime: sub.expirationTime || null, keys: sub.keys });
  return json({ ok: true });
}
