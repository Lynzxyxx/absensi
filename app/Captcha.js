"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Captcha({ ulang, onChange }) {
  const [d, setD] = useState(null), [jawab, setJawab] = useState("");
  const muat = () => { setJawab(""); setD(null); onChange({ token: "", jawab: "" }); api("/api/captcha").then((x) => { setD(x); onChange({ token: x.token, jawab: "" }); }).catch(() => {}); };
  useEffect(() => { muat(); }, [ulang]);
  return (
    <div>
      <label>Kode keamanan</label>
      <div className="row" style={{ alignItems: "center", marginBottom: 6 }}>
        {d ? <img alt="Kode keamanan" width="150" height="50" style={{ flex: "0 0 auto", minWidth: 0, borderRadius: 6 }} src={"data:image/svg+xml;utf8," + encodeURIComponent(d.svg)} /> : <span className="spin" />}
        <button type="button" className="sec" aria-label="Ganti kode" style={{ flex: "0 0 auto" }} onClick={muat}>↻</button>
      </div>
      <input value={jawab} maxLength={5} autoComplete="off" placeholder="Ketik kode di atas"
        onChange={(e) => { const v = e.target.value.toUpperCase(); setJawab(v); onChange({ token: d ? d.token : "", jawab: v }); }} />
    </div>
  );
}
