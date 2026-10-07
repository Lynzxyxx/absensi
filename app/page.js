"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { SITE_TITLE } from "../lib/config";
import Captcha from "./Captcha";

export default function Login() {
  const r = useRouter(), vid = useRef(null);
  const [f, setF] = useState({ username: "", password: "" }), [cap, setCap] = useState({ token: "", jawab: "" }), [ulang, setUlang] = useState(0);
  const [msg, setMsg] = useState(""), [mute, setMute] = useState(true), [lihat, setLihat] = useState(false);

  useEffect(() => {
    const v = vid.current; if (!v) return;
    v.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause(); else v.play().catch(() => {});
  }, []);
  function suara() { const v = vid.current; v.muted = !v.muted; setMute(v.muted); if (!v.muted) v.play().catch(() => {}); }

  async function masuk(e) {
    e.preventDefault();
    try {
      await api("/api/login", "POST", { ...f, as: "siswa", captchaToken: cap.token, captcha: cap.jawab });
      const t = new URLSearchParams(window.location.search).get("token");
      r.push(t ? "/siswa?token=" + encodeURIComponent(t) : "/siswa");
    } catch (err) { setMsg(err.message); setUlang((u) => u + 1); }
  }
  return (
    <div className="gelap">
      <div className="vid">
        <video ref={vid} src="/login.mp4" poster="/login-poster.jpg" autoPlay muted loop playsInline />
        <button type="button" className="suara" onClick={suara}>{mute ? "🔇 Aktifkan suara" : "🔊 Matikan suara"}</button>
      </div>
      <div className="konten">
        <div style={{ fontSize: 34, lineHeight: 1 }}>👋</div>
        <h1 style={{ margin: "6px 0 0" }}>Halo!</h1>
        <p style={{ margin: "2px 0 0", color: "#94a3b8" }}>Selamat datang di {SITE_TITLE}</p>
        <form className="card" onSubmit={masuk}>
          <label>Username</label>
          <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoComplete="username" />
          <label>Password</label>
          <div className="pw">
            <input type={lihat ? "text" : "password"} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
            <button type="button" className="sec" onClick={() => setLihat(!lihat)}>{lihat ? "Sembunyi" : "Lihat"}</button>
          </div>
          <Captcha ulang={ulang} onChange={setCap} />
          {msg && <p className="msg">{msg}</p>}
          <button style={{ marginTop: 12, width: "100%" }}>Masuk</button>
        </form>
      </div>
    </div>
  );
}
