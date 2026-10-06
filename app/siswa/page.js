"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { SITE_TITLE } from "../../lib/config";

export default function Siswa() {
  const r = useRouter();
  const [d, setD] = useState(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("hadir"), [catatan, setCatatan] = useState("");
  const [msg, setMsg] = useState({ t: "", ok: false });
  const load = () => api("/api/absen").then(setD).catch(() => r.replace("/" + window.location.search));
  useEffect(() => { load(); const t = new URLSearchParams(window.location.search).get("token"); if (t) setToken(t.toUpperCase()); }, []);
  async function kirim(e) {
    e.preventDefault();
    try { await api("/api/absen", "POST", { token, status, catatan }); setMsg({ t: "Absen berhasil dicatat", ok: true }); setToken(""); setCatatan(""); load(); }
    catch (err) { setMsg({ t: err.message, ok: false }); }
  }
  async function keluar() { await api("/api/login", "DELETE"); r.replace("/"); }
  if (!d) return <div className="wrap"><p className="load"><span className="spin" />Memuat…</p></div>;
  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <div className="top"><div><h1>{SITE_TITLE}</h1><div style={{ fontSize: "1.2rem", fontWeight: 600 }}>👋 Hai, {d.username}</div></div><button className="sec" onClick={keluar}>Keluar</button></div>
      <form className="card" onSubmit={kirim}>
        <h2>Isi absen</h2>
        <label>Token dari wali kelas</label>
        <input value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} placeholder="ISI TOKEN DARI WALKEL!!" />
        <label>Status kehadiran</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="hadir">Hadir</option><option value="sakit">Sakit</option><option value="izin">Izin</option>
        </select>
        {status !== "hadir" && <>
          <label>Penjelasan (wajib, supaya guru tahu alasannya)</label>
          <textarea rows={3} maxLength={300} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="PENJELASAN"
            style={{ width: "100%", font: "inherit", padding: 8, border: "1px solid #c5ccd4", borderRadius: 6 }} />
        </>}
        {msg.t && <p className={msg.ok ? "ok" : "msg"}>{msg.t}</p>}
        <button style={{ marginTop: 12, width: "100%" }}>Kirim absen</button>
        <p style={{ fontSize: ".85rem" }}>Terlambat? Hubungi wali kelas agar statusnya diubah.</p>
      </form>
      <div className="card">
        <h2>Absen hari ini</h2>
        {d.records.length === 0 ? <p>Belum ada absen hari ini.</p> :
          d.records.map((x, i) => <div key={i}>{x.status} · {new Date(x.at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })}{x.catatan ? ` · ${x.catatan}` : ""}</div>)}
      </div>
    </div>
  );
}
