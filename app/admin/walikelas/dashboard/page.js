"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { SITE_TITLE } from "../../../../lib/config";

const KODE = { hadir: "H", sakit: "S", izin: "I", terlambat: "T", alpha: "A" };
const hariIni = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const NM = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const lbl = (d) => `${NM[new Date(d + "T00:00:00Z").getUTCDay()]} ${d.slice(8)}/${d.slice(5, 7)}`;
const MENU = [["token", "Buat token"], ["siswa", "Daftar nama siswa"], ["rekap", "Rekapan"], ["info", "Pengumuman"]];
const JUDUL = { hari: "Hari ini", minggu: "Minggu ini", semua: "Semua" };

export default function Wali() {
  const r = useRouter();
  const [menu, setMenu] = useState("token"), [buka, setBuka] = useState(false), [origin, setOrigin] = useState("");
  const [siswa, setSiswa] = useState([]), [sesi, setSesi] = useState([]), [rekap, setRekap] = useState(null);
  const [mode, setMode] = useState("menit"), [jam, setJam] = useState(""), [menit, setMenit] = useState(10);
  const [rmode, setRmode] = useState("minggu"), [tgl, setTgl] = useState(hariIni()), [now, setNow] = useState(Date.now());
  const [f, setF] = useState({ nama: "", username: "", password: "" }), [msg, setMsg] = useState(""), [info, setInfo] = useState("");
  const [daftar, setDaftar] = useState(""), [pwSama, setPwSama] = useState(""), [hasil, setHasil] = useState(null);
  const [jd, setJd] = useState(""), [isiInfo, setIsiInfo] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([api("/api/siswa"), api("/api/sesi"), api(`/api/rekap?mode=${rmode}&tgl=${tgl}`)]);
      setSiswa(a); setSesi(b); setRekap(c);
    } catch (e) { e.status === 401 ? r.replace("/admin/walikelas") : setMsg(e.message); }
  }, [tgl, rmode]);
  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { setOrigin(window.location.origin); const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const last = sesi[0], aktif = last && last.expiresAt > now;
  useEffect(() => { if (last && !aktif) loadAll(); }, [aktif]); // token habis -> alpha langsung terhitung
  useEffect(() => { if (!aktif) return; const i = setInterval(loadAll, 5000); return () => clearInterval(i); }, [aktif, loadAll]);

  const run = async (fn) => { try { setMsg(""); setInfo(""); await fn(); await loadAll(); } catch (e) { setMsg(e.message); } };
  const sisa = aktif ? Math.ceil((last.expiresAt - now) / 1000) : 0;
  const link = last ? `${origin}/?token=${last.token}` : "";
  const salin = (t, ket) => navigator.clipboard.writeText(t).then(() => { setMsg(""); setInfo(ket); });
  const keluar = async () => { await api("/api/login", "DELETE"); r.replace("/admin/walikelas"); };
  const buatBanyak = () => run(async () => { const d = await api("/api/siswa/bulk", "POST", { daftar, passwordSama: pwSama }); setHasil(d.hasil); setDaftar(""); });
  const ket = rekap ? rekap.siswa.flatMap((s) => Object.entries(s.cat).map(([date, catatan]) => ({ nama: s.nama, date, status: s.hari[date], catatan }))).sort((a, b) => a.date.localeCompare(b.date)) : [];

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
    const doc = new jsPDF({ orientation: "landscape" }), days = rekap.days, ringkas = days.length > 12;
    doc.setFontSize(14); doc.text(`Rekap Absen ${SITE_TITLE} - ${JUDUL[rmode]}${days.length ? ` (${days[0]} s/d ${days[days.length - 1]})` : ""}`, 14, 15);
    doc.setFontSize(9); doc.text("H=Hadir  S=Sakit  I=Izin  T=Terlambat  A=Alpha", 14, 21);
    autoTable(doc, {
      startY: 25,
      head: [["No", "Nama", ...(ringkas ? [] : days.map(lbl)), "H", "S", "I", "T", "A"]],
      body: rekap.siswa.map((s, i) => [i + 1, s.nama, ...(ringkas ? [] : days.map((d) => KODE[s.hari[d]] || "-")),
        s.total.hadir, s.total.sakit, s.total.izin, s.total.terlambat, s.total.alpha]),
    });
    if (ket.length) autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [["Nama", "Tanggal", "Status", "Keterangan"]], body: ket.map((k) => [k.nama, k.date, k.status, k.catatan]) });
    doc.save(`rekap-absen-${rmode}.pdf`);
  }

  return (
    <div className="wrap">
      <div className="top">
        <div><h1>{SITE_TITLE}</h1><div>Wali kelas · {MENU.find((m) => m[0] === menu)[1]}</div></div>
        <button className="hamb" aria-label="Menu" aria-expanded={buka} onClick={() => setBuka(!buka)}>☰</button>
        {buka && <div className="drop">
          {MENU.map(([k, n]) => <button key={k} className={menu === k ? "on" : ""} onClick={() => { setMenu(k); setBuka(false); }}>{n}</button>)}
          <button onClick={keluar}>Keluar</button>
        </div>}
      </div>
      {msg && <p className="msg">{msg}</p>}
      {info && <p className="ok">{info}</p>}
      {!rekap && !msg && <p className="load"><span className="spin" />Memuat data…</p>}

      {menu === "token" && <div className="card">
        <h2>Buat token absen</h2>
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
        {last && <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>Token terakhir: <span className="token">{last.token}</span></p>
          <p style={{ margin: "0 0 8px" }}>{aktif ? `Berlaku ${Math.floor(sisa / 60)}:${String(sisa % 60).padStart(2, "0")} lagi` : "Sudah kedaluwarsa"}</p>
          <p className="link">Link absen: {link}</p>
          <div className="row"><button className="sec" onClick={() => salin(last.token, "Token disalin")}>Salin token</button>
            <button className="sec" onClick={() => salin(link, "Link disalin. Link ini mati otomatis saat token berakhir")}>Salin link</button></div>
        </div>}
      </div>}

      {menu === "siswa" && <div className="card">
        <h2>Daftar nama siswa ({siswa.length})</h2>
        <div className="row">
          <div><label>Nama</label><input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></div>
          <div><label>Username</label><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div><label>Password</label><input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <button onClick={() => run(async () => { await api("/api/siswa", "POST", f); setF({ nama: "", username: "", password: "" }); })}>Tambah siswa</button>
        </div>
        <div style={{ margin: "12px 0" }}>
          <h2>Tambah banyak siswa</h2>
          <label>Tempel daftar nama (satu nama per baris)</label>
          <textarea rows={5} value={daftar} onChange={(e) => setDaftar(e.target.value)} placeholder={"Budi Santoso\nCitra Lestari"}
            style={{ width: "100%", font: "inherit", padding: 8, border: "1px solid #c5ccd4", borderRadius: 6 }} />
          <div className="row">
            <div><label>Password sama untuk semua (kosongkan untuk password acak)</label><input value={pwSama} onChange={(e) => setPwSama(e.target.value)} /></div>
            <button onClick={buatBanyak}>Buat akun</button>
          </div>
          {hasil && <div style={{ marginTop: 12 }}>
            <p className="ok">Akun dibuat. Catat sekarang, password tidak bisa dilihat lagi.</p>
            <div className="scroll"><table><thead><tr><th>Nama</th><th>Username</th><th>Password</th></tr></thead>
              <tbody>{hasil.map((x, i) => <tr key={i}><td>{x.nama}</td><td>{x.username}</td><td>{x.password}</td></tr>)}</tbody></table></div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="sec" onClick={() => salin(hasil.map((x) => `${x.nama}\t${x.username}\t${x.password}`).join("\n"), "Daftar akun disalin")}>Salin</button>
              <button className="sec" onClick={pdfAkun}>Unduh PDF</button><button className="bad" onClick={() => setHasil(null)}>Tutup</button></div>
          </div>}
        </div>
        <div className="scroll"><table><tbody>
          {siswa.map((s) => <tr key={s.id}><td>{s.nama}</td><td>{s.username}</td><td>
            <button className="sec" onClick={() => { const p = prompt("Password baru untuk " + s.nama); if (p) run(() => api("/api/siswa", "PUT", { id: s.id, password: p })); }}>Ganti password</button>{" "}
            <button className="bad" onClick={() => confirm("Hapus " + s.nama + "?") && run(() => api("/api/siswa?id=" + s.id, "DELETE"))}>Hapus</button></td></tr>)}
        </tbody></table></div>
      </div>}

      {menu === "info" && <div className="card">
        <h2>Pengumuman ke siswa</h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="sec" onClick={() => { setJd("Libur hari ini"); setIsiInfo("Hari ini libur. Tidak ada absen."); }}>Libur hari ini</button>
          <button className="sec" onClick={() => { setJd("Hari ini UTS"); setIsiInfo("Hari ini ada UTS. Jangan lupa absen dan siapkan alat tulis."); }}>UTS hari ini</button>
        </div>
        <label>Judul</label><input value={jd} maxLength={80} onChange={(e) => setJd(e.target.value)} />
        <label>Isi pesan</label>
        <textarea rows={3} maxLength={300} value={isiInfo} onChange={(e) => setIsiInfo(e.target.value)} style={{ width: "100%", font: "inherit", padding: 8, border: "1px solid #c5ccd4", borderRadius: 6 }} />
        <button style={{ marginTop: 8 }} onClick={() => run(async () => { const d = await api("/api/pengumuman", "POST", { judul: jd, isi: isiInfo }); setInfo(`Notifikasi terkirim ke ${d.terkirim} perangkat`); setJd(""); setIsiInfo(""); })}>Kirim ke semua siswa</button>
        <h2 style={{ marginTop: 20 }}>Pengingat absen</h2>
        <p style={{ marginTop: 0 }}>Kirim notifikasi ke siswa yang belum mengisi absen pada token yang sedang aktif.</p>
        <button onClick={() => run(async () => { const d = await api("/api/pengingat", "POST"); setInfo(`Pengingat terkirim ke ${d.terkirim} perangkat (${d.belum} siswa belum absen)`); })}>Kirim pengingat</button>
      </div>}

      {menu === "rekap" && <div className="card">
        <h2>Rekapan (Senin - Jumat)</h2>
        <div className="row">
          <div><label>Tampilkan</label>
            <select value={rmode} onChange={(e) => setRmode(e.target.value)}>
              <option value="hari">Hari ini</option><option value="minggu">Minggu ini</option><option value="semua">Semuanya</option>
            </select></div>
          {rmode === "minggu" && <div><label>Pilih tanggal dalam minggu</label><input type="date" value={tgl} onChange={(e) => e.target.value && setTgl(e.target.value)} /></div>}
          <button className="sec" onClick={loadAll}>Segarkan</button>
          <button onClick={unduhPdf} disabled={!rekap}>Unduh PDF</button>
        </div>
        {rekap && (rekap.days.length === 0 ? <p>Tidak ada data. Rekap hanya menampilkan hari Senin sampai Jumat.</p> :
          <div className="scroll" style={{ marginTop: 12 }}><table>
            <thead><tr><th>Nama</th>{rekap.days.map((d) => <th key={d}>{lbl(d)}</th>)}<th>Total</th></tr></thead>
            <tbody>{rekap.siswa.map((s) => <tr key={s.id}><td>{s.nama}</td>
              {rekap.days.map((d) => <td key={d}>
                <select value={s.hari[d]} onChange={(e) => run(() => api("/api/rekap", "PATCH", { siswaId: s.id, date: d, status: e.target.value }))}>
                  <option value="">-</option>{Object.keys(KODE).map((k) => <option key={k} value={k}>{k}</option>)}
                </select></td>)}
              <td>{Object.entries(s.total).map(([k, v]) => `${KODE[k]}${v}`).join(" ")}</td></tr>)}</tbody></table></div>)}
        {ket.length > 0 && <div style={{ marginTop: 12 }}>
          <h2>Keterangan sakit dan izin</h2>
          <div className="scroll"><table><tbody>{ket.map((k, i) => <tr key={i}><td>{k.nama}</td><td>{lbl(k.date)}</td><td>{k.status}</td><td style={{ whiteSpace: "normal" }}>{k.catatan}</td></tr>)}</tbody></table></div>
        </div>}
      </div>}
    </div>
  );
}
