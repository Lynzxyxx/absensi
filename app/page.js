"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { SITE_TITLE } from "../lib/config";

export default function Login() {
  const r = useRouter();
  const [f, setF] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  async function masuk(e) {
    e.preventDefault();
    try { await api("/api/login", "POST", { ...f, as: "siswa" }); { const t = new URLSearchParams(window.location.search).get("token"); r.push(t ? "/siswa?token=" + encodeURIComponent(t) : "/siswa"); }; }
    catch (err) { setMsg(err.message); }
  }
  return (
    <div className="wrap" style={{ maxWidth: 400, paddingTop: 60 }}>
      <div className="card">
        <h1>{SITE_TITLE}</h1>
        <p style={{ marginTop: 0 }}>Masuk dengan akun dari wali kelas.</p>
        <form onSubmit={masuk}>
          <label>Username</label>
          <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoComplete="username" />
          <label>Password</label>
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
          {msg && <p className="msg">{msg}</p>}
          <button style={{ marginTop: 12, width: "100%" }}>Masuk</button>
        </form>
      </div>
    </div>
  );
}
