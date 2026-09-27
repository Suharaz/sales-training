"use client";
// Học bài: đếm giây ở lại (chống tua ảo), đánh dấu hoàn thành; quiz: chọn đáp án, chấm, hiện giải thích.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
type Bai = { id: string; ten: string; loai: "noi_dung" | "video" | "quiz"; noi_dung: string; video_url: string | null; thoi_luong_giay: number; cau_hoi: { hoi: string; luaChon: string[]; giaiThich?: string }[] };
type KQ = { hopLe: boolean; diemQuiz: number | null; phanTram: number; mocMoi: string[]; diemCong: number; chungChiMa: string | null; thongDiep: string; dapAn?: number[] };
function mdNhe(s: string): string {
  // Markdown nhẹ theo DÒNG: ## / ### tiêu đề, - hoặc 1. danh sách (gom liên tiếp), dòng trống ngắt đoạn, **đậm**, «nhấn».
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const ra: string[] = []; let doan: string[] = []; let ds: { loai: "ul" | "ol"; muc: string[] } | null = null;
  const xaDoan = () => { if (doan.length) { ra.push(`<p>${doan.join("<br/>")}</p>`); doan = []; } };
  const xaDs = () => { if (ds) { ra.push(`<${ds.loai}>${ds.muc.map((m) => `<li>${m}</li>`).join("")}</${ds.loai}>`); ds = null; } };
  for (const dongGoc of esc.split("\n")) {
    const d = dongGoc.trim();
    if (!d) { xaDoan(); xaDs(); continue; }
    if (/^###\s/.test(d)) { xaDoan(); xaDs(); ra.push(`<h3>${d.slice(4)}</h3>`); continue; }
    if (/^##\s/.test(d)) { xaDoan(); xaDs(); ra.push(`<h2>${d.slice(3)}</h2>`); continue; }
    const li = d.match(/^(-|\d+\.)\s+(.*)$/);
    if (li) { xaDoan(); const loai = li[1] === "-" ? "ul" : "ol"; if (!ds || ds.loai !== loai) { xaDs(); ds = { loai, muc: [] }; } ds.muc.push(li[2]); continue; }
    xaDs(); doan.push(d);
  }
  xaDoan(); xaDs();
  return ra.join("").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/«(.+?)»/g, "<em>«$1»</em>");
}
export function ManHinhBaiHoc({ khoaId, bai, daXong, diemQuizCu, chongTuaAo, lienKet }: { khoaId: string; bai: Bai; daXong: boolean; diemQuizCu: number | null; chongTuaAo: boolean; lienKet: { truoc: string | null; sau: string | null; mucLuc: string } }) {
  const router = useRouter();
  const [giay, setGiay] = useState(0);
  const [traLoi, setTraLoi] = useState<number[]>(Array(bai.cau_hoi.length).fill(-1));
  const [kq, setKq] = useState<KQ | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const gui = useRef(false);
  const canGiay = chongTuaAo ? Math.ceil(bai.thoi_luong_giay * 0.6) : 0;
  useEffect(() => { if (bai.loai === "quiz" || daXong) return; const t = setInterval(() => setGiay((g) => g + 1), 1000); return () => clearInterval(t); }, [bai.loai, daXong]);
  async function ghi(body: Record<string, unknown>) {
    setDang(true); setLoi("");
    try {
      const r = await fetch("/api/dao-tao", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ khoa_id: khoaId, bai_id: bai.id, ...body }) });
      const j = (await r.json()) as KQ & { loi?: string }; if (!r.ok) throw new Error(j.loi || "Lỗi");
      setKq(j); router.refresh();
    } catch (e) { setLoi((e as Error).message); } finally { setDang(false); }
  }
  // Tự ghi tiến độ khi đủ thời gian (một lần)
  useEffect(() => { if (bai.loai !== "quiz" && !daXong && giay >= canGiay && giay > 0 && !gui.current) { gui.current = true; ghi({ giay_da_hoc: giay }); } }, [giay]); // eslint-disable-line react-hooks/exhaustive-deps
  const conLai = Math.max(0, canGiay - giay);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="the p-6">
        {bai.loai === "video" && bai.video_url && <div className="aspect-video rounded-lg overflow-hidden mb-4" style={{ background: "#000" }}><iframe src={bai.video_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /></div>}
        {bai.loai !== "quiz" ? <div className="noi-dung-bai text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: mdNhe(bai.noi_dung) }} /> : (
          <div className="flex flex-col gap-5">
            {bai.cau_hoi.map((c, i) => { const dung = kq?.dapAn?.[i]; return (
              <div key={i}><div className="font-semibold mb-2">{i + 1}. {c.hoi}</div>
                <div className="flex flex-col gap-1.5">{c.luaChon.map((lc, j) => { const chon = traLoi[i] === j; const daCham = dung != null; const laDung = daCham && dung === j; const laSai = daCham && chon && dung !== j; return (
                  <label key={j} className="the-2 p-2.5 flex items-center gap-2 cursor-pointer text-sm" style={{ borderColor: laDung ? "var(--xanh)" : laSai ? "var(--do)" : chon ? "var(--nhan)" : undefined }}>
                    <input type="radio" name={`c${i}`} checked={chon} disabled={daCham} onChange={() => setTraLoi((t) => t.map((v, k) => (k === i ? j : v)))} />{lc}{laDung && <Icon ten="check" size={14} className="ml-auto" />}</label>); })}</div>
                {kq?.dapAn && c.giaiThich && <div className="text-xs mt-1" style={{ color: "var(--chu-mo)" }}>{c.giaiThich}</div>}</div>); })}
            {!kq && <button type="button" className="nut nut-chinh self-start" disabled={dang || traLoi.some((t) => t < 0)} onClick={() => ghi({ tra_loi: traLoi })}>{dang ? "Đang chấm…" : "Nộp bài"}</button>}
            {kq && !kq.hopLe && <button type="button" className="nut self-start" onClick={() => { setKq(null); setTraLoi(Array(bai.cau_hoi.length).fill(-1)); }}>Làm lại</button>}
          </div>)}
      </div>
      <div className="flex flex-col gap-3">
        <div className="the p-4 text-sm flex flex-col gap-2">
          {daXong || kq?.hopLe ? <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--chu-xanh)" }}><Icon ten="check" size={16} />Đã hoàn thành{diemQuizCu != null && ` · quiz ${kq?.diemQuiz ?? diemQuizCu}%`}</div>
            : bai.loai === "quiz" ? <div style={{ color: "var(--chu-mo)" }}>Cần ≥ 70% để qua bài kiểm tra.{diemQuizCu != null && ` Lần trước: ${diemQuizCu}%.`}</div>
            : <div><div className="flex justify-between"><span style={{ color: "var(--chu-mo)" }}>Thời gian học</span><span className="tabular font-semibold">{Math.floor(giay / 60)}:{String(giay % 60).padStart(2, "0")}</span></div>
              {canGiay > 0 && <div className="mt-1"><div className="thanh"><i style={{ width: `${Math.min(100, (giay / canGiay) * 100)}%` }} /></div><div className="text-xs mt-1" style={{ color: "var(--chu-mo)" }}>{conLai > 0 ? `Còn ${Math.ceil(conLai / 60)} phút để tính hoàn thành (chống tua ảo)` : dang ? "Đang ghi…" : "Đủ thời gian — đã ghi nhận"}</div></div>}
              {canGiay === 0 && <button type="button" className="nut nut-chinh mt-2" disabled={dang} onClick={() => ghi({ giay_da_hoc: giay })}>Đánh dấu hoàn thành</button>}</div>}
          {kq && <div className="text-xs p-2 rounded-lg" style={{ background: kq.hopLe ? "var(--xanh-mo)" : "var(--vang-mo)", color: kq.hopLe ? "var(--chu-xanh)" : "var(--chu-vang)" }}>{kq.thongDiep}{kq.diemCong > 0 && ` +${kq.diemCong} điểm.`}{kq.mocMoi.includes("nguong_khoa") && " 🎯 Đạt ngưỡng khóa!"}{kq.chungChiMa && ` 🏆 Chứng chỉ ${kq.chungChiMa}`}</div>}
          {loi && <div className="text-xs" style={{ color: "var(--chu-do)" }}>{loi}</div>}
        </div>
        <div className="flex gap-2">{lienKet.truoc ? <a href={lienKet.truoc} className="nut flex-1 justify-center">← Bài trước</a> : <span className="flex-1" />}{lienKet.sau ? <a href={lienKet.sau} className="nut nut-chinh flex-1 justify-center">Bài sau →</a> : <a href={lienKet.mucLuc} className="nut nut-chinh flex-1 justify-center">Về mục lục</a>}</div>
      </div>
    </div>
  );
}
