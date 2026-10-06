import { db, json, need, hashPw, list, safe } from "../../../lib/server";

export async function GET() {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  return json((await list("siswa")).map((d) => ({ id: d.id, nama: d.nama, username: d.username })).sort((a, b) => a.nama.localeCompare(b.nama)));
}
export async function POST(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const { nama = "", username = "", password = "" } = await req.json();
  if (!nama.trim() || !username.trim() || password.length < 4) return json({ error: "Isi nama, username, dan password (min. 4 karakter)" }, 400);
  const u = username.trim().toLowerCase();
  if (u === (process.env.WALI_USERNAME || "").toLowerCase() || (await list("siswa", (r) => r.orderByChild("username").equalTo(u).limitToFirst(1))).length)
    return json({ error: "Username sudah dipakai" }, 409);
  await db.ref("siswa").push({ nama: nama.trim(), username: u, hash: hashPw(password) });
  return json({ ok: true });
}
export async function PUT(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const { id, password = "" } = await req.json();
  if (!safe(id)) return json({ error: "ID tidak valid" }, 400);
  if (password.length < 4) return json({ error: "Password minimal 4 karakter" }, 400);
  await db.ref(`siswa/${id}`).update({ hash: hashPw(password) });
  return json({ ok: true });
}
export async function DELETE(req) {
  if (!need("wali")) return json({ error: "Tidak diizinkan" }, 401);
  const id = new URL(req.url).searchParams.get("id");
  if (!safe(id)) return json({ error: "ID tidak valid" }, 400);
  await db.ref(`siswa/${id}`).remove();
  return json({ ok: true });
}
