import { json, makeSession, checkPw, list } from "../../../lib/server";
const cookie = (v, age) => `s=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

export async function POST(req) {
  const { username = "", password = "", as = "siswa" } = await req.json();
  let sess = null;
  if (as === "wali") {
    if (username === process.env.WALI_USERNAME && password === process.env.WALI_PASSWORD) sess = { role: "wali" };
  } else {
    const q = await list("siswa", (r) => r.orderByChild("username").equalTo(username.trim().toLowerCase()).limitToFirst(1));
    if (q.length && checkPw(password, q[0].hash)) sess = { role: "siswa", id: q[0].id };
  }
  if (!sess) return json({ error: "Username atau password salah" }, 401);
  return new Response(JSON.stringify({ role: sess.role }), { headers: { "Content-Type": "application/json", "Set-Cookie": cookie(makeSession(sess), 604800) } });
}
export async function DELETE() {
  return new Response("{}", { headers: { "Content-Type": "application/json", "Set-Cookie": cookie("", 0) } });
}
