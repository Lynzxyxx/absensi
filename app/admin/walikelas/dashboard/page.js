"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { SITE_TITLE } from "../../../../lib/config";

const KODE = { hadir: "H", sakit: "S", izin: "I", terlambat: "T", alpha: "A" };
const hariIni = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const senin = (d) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Wali() {
  const r = useRouter();
  const [siswa, setSiswa] = useState([]), [sesi, setSesi] = useState([]), [rekap, setRekap] = useState(null);
  const [mode, setMode] = useState("menit"), [jam, setJam] = useState(""), [menit, setMenit] = useState(10), [tgl, setTgl] = useState(hariIni()), [now, setNow] = useState(Date.now());
  const [f, setF] = useState({ nama: "", username: "", password: "" }), [msg, setMsg] = useState("");
  const [daftar, setDaftar] = useState(""), [pwSama, setPwSama] = useState(""), [hasil, setHasil] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([api("/api/siswa"), api("/api/sesi"), api("/api/rekap?start=" + senin(tgl))]);
      setSiswa(a); setSesi(b); setRekap(c);
    } catch (e) { e.status === 401 ? r.replace("/admin/walikelas") : setMsg(e.message); }
  }, [tgl]);
  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const last = sesi[0], aktif = last && last.expiresAt > now;
  useEffect(() => { if (last && !aktif) loadAll(); }, [aktif]); // token habis -> alpha langsung terhitung

  useEffect(() => { if (!aktif) return; const i = setInterval(loadAll, 5000); return () => clearInterval(i); }, [aktif, loadAll]); // perbarui otomatis saat token aktif
  const run = async (fn) => { try { setMsg(""); await fn(); await loadAll(); } catch (e) { setMsg(e.message); } };
  const sisa = aktif ? Math.ceil((last.expiresAt - now) / 1000) : 0;


  const buatBanyak = () => run(async () => { const d = await api("/api/siswa/bulk", "POST", { daftar, passwordSama: pwSama }); setHasil(d.hasil); setDaftar(""); });
  const salin = () => navigator.clipboard.writeText(hasil.map((x) => `${x.nama}\t${x.username}\t${x.password}`).join("\n")).then(() => setMsg("Daftar akun disalin"));
  async function pdfAkun() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text("Akun siswa " + SITE_TITLE, 14, 15);
    autoTable(doc, { startY: 22, head: [["No", "Nama", "Username", "Password"]], body: hasil.map((x, i) => [i + 1, x.nama, x.username, x.password]) });
    doc.save("akun-siswa.pdf");
  }

  async function unduhPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14); doc.text(`Rekap Absen Mingguan (${rekap.days[0]} s/d ${rekap.days[5]})`, 14, 15);
    doc.setFontSize(9); doc.text("H=Hadir  S=Sakit  I=Izin  T=Terlambat  A=Alpha", 14, 21);
    autoTable(doc, {
      startY: 25,
      head: [["No", "Nama", ...rekap.days.map((d, i) => `${NAMA_HARI[i]} ${d.slice(8)}`), "H", "S", "I", "T", "A"]],
      body: rekap.siswa.map((s, i) => [i + 1, s.nama, ...rekap.days.map((d) => KODE[s.hari[d]] || "-"),
        s.total.hadir, s.total.sakit, s.total.izin, s.total.terlambat, s.total.alpha]),
    });
    doc.save(`rekap-absen-${rekap.days[0]}.pdf`);
  }

  return (
    <div className="wrap">
      <div className="top"><h1>{SITE_TITLE} · Wali kelas</h1>
        <button className="sec" onClick={async () => { await api("/api/login", "DELETE"); r.replace("/admin/walikelas"); }}>Keluar</button></div>
      {msg && <p className="msg">{msg}</p>}
      {!rekap && <p className="load"><span className="spin" />Memuat data…</p>}

      <div className="card">
        <h2>Token absen</h2>
        <div className="row">
          <div><label>Atur masa berlaku</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="menit">Durasi (menit)</option><option value="jam">Berakhir pukul</option>
            </select></div>
          {mode === "menit"
            ? <div><label>Berlaku (menit)</label><input type="number" min="1" value={menit} onChange={(e) => setMenit(e.target.value)} /></div>
            : <div><label>Berakhir pukul (WIB)</label><input type="time" value={jam} onChange={(e) => setJam(e.target.value)} /></div>}
          <button onClick={() => run(() => api("/api/sesi", "POST", mode === "menit" ? { menit } : { sampai: jam }))}>Buat token</button>
        </div>
        {last && <p>Token terakhir: <span className="token">{last.token}</span><br />
          {aktif ? `Berlaku ${Math.floor(sisa / 60)}:${String(sisa % 60).padStart(2, "0")} lagi` : "Sudah kedaluwarsa"}</p>}
      </div>

      <div className="card">
        <h2>Akun siswa ({siswa.length})</h2>
        <div className="row">
          <div><label>Nama</label><input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></div>
          <div><label>Username</label><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div><label>Password</label><input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <button onClick={() => run(async () => { await api("/api/siswa", "POST", f); setF({ nama: "", username: "", password: "" }); })}>Tambah siswa</button>
        </div>
        <div style={{ margin: "12px 0" }}>
          <p className="t">Tambah banyak siswa</p>
          <label>Tempel daftar nama (satu nama per baris)</label>
          <textarea rows={5} value={daftar} onChange={(e) => setDaftar(e.target.value)} placeholder={"Budi Santoso\nCitra Lestari"}
            style={{ width: "100%", font: "inherit", padding: 8, border: "1px solid #c5ccd4", borderRadius: 6 }} />
          <div className="row">
            <div><label>(kosongkan untuk password acak)</label><input value={pwSama} onChange={(e) => setPwSama(e.target.value)} /></div>
            <button onClick={buatBanyak}>Buat akun</button>
          </div>
          {hasil && <div style={{ marginTop: 12 }}>
            <p className="ok">Akun dibuat. Catat sekarang, password tidak bisa dilihat lagi.</p>
            <div className="scroll"><table><thead><tr><th>Nama</th><th>Username</th><th>Password</th></tr></thead>
              <tbody>{hasil.map((x, i) => <tr key={i}><td>{x.nama}</td><td>{x.username}</td><td>{x.password}</td></tr>)}</tbody></table></div>
            <div className="row" style={{ marginTop: 8 }}><button className="sec" onClick={salin}>Salin</button><button className="sec" onClick={pdfAkun}>Unduh PDF</button><button className="bad" onClick={() => setHasil(null)}>Tutup</button></div>
          </div>}
        </div>
        <div className="scroll"><table><tbody>
          {siswa.map((s) => <tr key={s.id}><td>{s.nama}</td><td>{s.username}</td><td>
            <button className="sec" onClick={() => { const p = prompt("Password baru untuk " + s.nama); if (p) run(() => api("/api/siswa", "PUT", { id: s.id, password: p })); }}>Ganti password</button>{" "}
            <button className="bad" onClick={() => confirm("Hapus " + s.nama + "?") && run(() => api("/api/siswa?id=" + s.id, "DELETE"))}>Hapus</button></td></tr>)}
        </tbody></table></div>
      </div>

      <div className="card">
        <h2>Rekap mingguan</h2>
        <div className="row">
          <div><label>Pilih tanggal dalam minggu</label><input type="date" value={tgl} onChange={(e) => e.target.value && setTgl(e.target.value)} /></div>
          <button className="sec" onClick={loadAll}>Segarkan</button>
          <button onClick={unduhPdf} disabled={!rekap}>Unduh PDF</button>
        </div>
        {rekap && <div className="scroll" style={{ marginTop: 12 }}><table>
          <thead><tr><th>Nama</th>{rekap.days.map((d, i) => <th key={d}>{NAMA_HARI[i]} {d.slice(8)}</th>)}</tr></thead>
          <tbody>{rekap.siswa.map((s) => <tr key={s.id}><td>{s.nama}</td>
            {rekap.days.map((d) => <td key={d}>
              <select value={s.hari[d]} onChange={(e) => run(() => api("/api/rekap", "PATCH", { siswaId: s.id, date: d, status: e.target.value }))}>
                <option value="">-</option>{Object.keys(KODE).map((k) => <option key={k} value={k}>{k}</option>)}
              </select></td>)}</tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}
