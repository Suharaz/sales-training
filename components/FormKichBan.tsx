"use client";
import { useState } from "react";
type SP = { id: string; ten: string };
export function FormKichBan({ action, sanPham, kichBan }: { action: (f: FormData) => void; sanPham: SP[]; kichBan?: { id: string; san_pham_id: string | null; ten: string; mo_dau: string; khai_thac: string; gia_tri: string; chot: string } }) {
  return (
    <form action={action} className="flex flex-col gap-2 text-sm" key={kichBan?.id ?? "moi"}>
      {kichBan && <input type="hidden" name="id" value={kichBan.id} />}
      <input name="ten" className="o-nhap" placeholder="Tên kịch bản" required defaultValue={kichBan?.ten} />
      <select name="san_pham_id" className="o-nhap" defaultValue={kichBan?.san_pham_id ?? ""}><option value="">(Không gắn sản phẩm)</option>{sanPham.map((s) => <option key={s.id} value={s.id}>{s.ten}</option>)}</select>
      {[["mo_dau", "Mở đầu"], ["khai_thac", "Khai thác nhu cầu"], ["gia_tri", "Trình bày giá trị"], ["chot", "Chốt"]].map(([n, t]) => <label key={n} className="flex flex-col gap-1"><span className="font-medium text-xs">{t}</span><textarea name={n} className="o-nhap" rows={3} defaultValue={(kichBan as Record<string, string> | undefined)?.[n] ?? ""} /></label>)}
      <div className="flex gap-2"><button className="nut nut-chinh">{kichBan ? "Lưu" : "Thêm"}</button>{kichBan && <a href="/kich-ban" className="nut">Hủy</a>}</div>
    </form>
  );
}
export function FormPhanDoi({ action, loai, sanPham, phanDoi }: { action: (f: FormData) => void; loai: { ma: string; ten: string }[]; sanPham: SP[]; phanDoi?: { id: string; loai: string; noi_dung: string; cau_tra_loi_chuan: string } }) {
  const [l, setL] = useState(phanDoi?.loai ?? "gia");
  const [nd, setNd] = useState(phanDoi?.noi_dung ?? "");
  const [tl, setTl] = useState(phanDoi?.cau_tra_loi_chuan ?? "");
  const [sp, setSp] = useState(sanPham[0]?.id ?? "");
  const [dang, setDang] = useState(false);
  const [lyDo, setLyDo] = useState("");
  async function goiY() {
    if (!nd.trim()) return; setDang(true); setLyDo("");
    try {
      const r = await fetch("/api/kich-ban", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ loai: l, noi_dung: nd, san_pham_id: sp || null }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.loi || "Lỗi");
      setTl(j.goiY.cau_tra_loi); setLyDo(`${j.goiY.ly_do}${j.cheDo === "du_phong" ? " (chế độ dự phòng)" : ""}`);
    } catch (e) { setLyDo((e as Error).message); } finally { setDang(false); }
  }
  return (
    <form action={action} className="flex flex-col gap-2 text-sm" key={phanDoi?.id ?? "moi"}>
      {phanDoi && <input type="hidden" name="id" value={phanDoi.id} />}
      <select name="loai" className="o-nhap" value={l} onChange={(e) => setL(e.target.value)}>{loai.map((x) => <option key={x.ma} value={x.ma}>{x.ten}</option>)}</select>
      <textarea name="noi_dung" className="o-nhap" rows={2} placeholder="Khách nói gì? (vd: Giá cao quá)" required value={nd} onChange={(e) => setNd(e.target.value)} />
      <div className="flex gap-2 items-center"><select className="o-nhap flex-1" value={sp} onChange={(e) => setSp(e.target.value)}>{sanPham.map((s) => <option key={s.id} value={s.id}>{s.ten}</option>)}<option value="">(Không sản phẩm)</option></select><button type="button" className="nut nut-nho" onClick={goiY} disabled={dang || !nd.trim()}>{dang ? "AI đang viết…" : "AI gợi ý câu trả lời"}</button></div>
      <textarea name="cau_tra_loi" className="o-nhap" rows={5} placeholder="Câu trả lời chuẩn" value={tl} onChange={(e) => setTl(e.target.value)} />
      {lyDo && <div className="text-xs" style={{ color: "var(--chu-mo)" }}>{lyDo}</div>}
      <div className="flex gap-2"><button className="nut nut-chinh">{phanDoi ? "Lưu" : "Thêm vào kho"}</button>{phanDoi && <a href="/kich-ban?tab=phan-doi" className="nut">Hủy</a>}</div>
    </form>
  );
}
