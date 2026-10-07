"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Captcha from "../../Captcha";
import { api } from "../../../lib/api";
import { SITE_TITLE } from "../../../lib/config";

export default function LoginWali() {
  const r = useRouter();
  const [f, setF] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(""), [cap, setCap] = useState({ token: "", jawab: "" }), [ulang, setUlang] = useState(0);
  async function masuk(e) {
    e.preventDefault();
    try { await api("/api/login", "POST", { ...f, as: "wali", captchaToken: cap.token, captcha: cap.jawab }); r.push("/admin/walikelas/dashboard"); }
    catch (err) { setMsg(err.message); setUlang((u) => u + 1); }
  }
  return (
    <div className="wrap" style={{ maxWidth: 400, paddingTop: 60 }}>
      <div className="card">
        <h1>{SITE_TITLE}</h1><p className="l" style={{ margin: 0 }}>Wali kelas</p>
        <p style={{ marginTop: 0 }}>Halaman login khusus wali kelas.</p>
        <form onSubmit={masuk}>
          <label>Username</label>
          <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoComplete="username" />
          <label>Password</label>
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
          <Captcha ulang={ulang} onChange={setCap} />
          {msg && <p className="msg">{msg}</p>}
          <button style={{ marginTop: 12, width: "100%" }}>Masuk</button>
        </form>
      </div>
    </div>
  );
}
