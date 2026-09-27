"use client";
import { useState } from "react";
import type { NoiDungDna } from "@/core/dna";
import { NutCho } from "./NutCho";
type Dna = NoiDungDna & { id: string | null };
export function FormDna({ action, dna, chiXem }: { action: (f: FormData) => void; dna: Dna; chiXem: boolean }) {
  const [d, setD] = useState<NoiDungDna>(dna);
  const [vanBan, setVanBan] = useState("");
  const [dang, setDang] = useState(false);
  const [tb, setTb] = useState("");
  const [nguon, setNguon] = useState<"thu_cong" | "ai_trich">("thu_cong");
  const s = (k: keyof NoiDungDna) => ({ value: Array.isArray(d[k]) ? (d[k] as string[]).join("\n") : (d[k] as string), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: Array.isArray(x[k]) ? e.target.value.split("\n") : e.target.value })), disabled: chiXem, name: k, className: "o-nhap" });
  async function trich() {
    setDang(true); setTb("");
    try {
      const r = await fetch("/api/dna", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ van_ban: vanBan }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.loi || "Lỗi");
      setD(j.dna); setNguon("ai_trich"); setTb(`AI đã điền hồ sơ nháp${j.cheDo === "du_phong" ? " (chế độ dự phòng — chỉ lấy được tên, mô tả, số liệu)" : ""}. Kiểm tra rồi bấm Lưu.`);
    } catch (e) { setTb((e as Error).message); } finally { setDang(false); }
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="nguon" value={nguon} />
      {!chiXem && <div className="the p-4 flex flex-col gap-2 text-sm" style={{ borderColor: "var(--nhan)" }}>
        <div className="font-semibold">Nạp nhanh bằng AI</div>
        <div className="mo-ta">Dán giới thiệu công ty, nội dung trang web, brochure, bài đăng bán hàng… AI trích thành hồ sơ nháp để bạn duyệt.</div>
        <textarea className="o-nhap" rows={5} value={vanBan} onChange={(e) => setVanBan(e.target.value)} placeholder="Ví dụ: Công ty ABC thành lập 2018, chuyên đào tạo… đã có 1.200 học viên… cam kết hoàn tiền 7 ngày… khách hàng là chủ doanh nghiệp nhỏ…" />
        <div className="flex items-center gap-2"><button type="button" className="nut nut-chinh" onClick={trich} disabled={dang || vanBan.trim().length < 80}>{dang ? "AI đang đọc…" : "AI trích DNA"}</button>{tb && <span className="text-xs" style={{ color: "var(--chu-mo)" }}>{tb}</span>}</div>
      </div>}
      <div className="the p-4 grid gap-3 md:grid-cols-2 text-sm">
        <div className="md:col-span-2 font-semibold">Doanh nghiệp</div>
        <label className="flex flex-col gap-1">Tên doanh nghiệp *<input {...s("ten_doanh_nghiep")} required /></label>
        <label className="flex flex-col gap-1">Ngành<input {...s("nganh")} placeholder="Đào tạo, phần mềm, spa, bất động sản…" /></label>
        <label className="flex flex-col gap-1 md:col-span-2">Mô tả (bán gì, cho ai, khác gì)<textarea {...s("mo_ta")} rows={3} /></label>
        <label className="flex flex-col gap-1">Khách hàng mục tiêu<textarea {...s("khach_hang_muc_tieu")} rows={3} placeholder="Chủ doanh nghiệp nhỏ 5–50 nhân sự, đang tự chạy quảng cáo…" /></label>
        <label className="flex flex-col gap-1">Nỗi đau khách thường gặp<textarea {...s("noi_dau_khach")} rows={3} placeholder="Lead rơi, không có quy trình, tốn thời gian trả lời inbox…" /></label>
        <label className="flex flex-col gap-1 md:col-span-2">Điểm khác biệt (USP), mỗi dòng một ý<textarea {...s("usp")} rows={4} placeholder={"Coach 1-1 hàng tuần\nHoàn tiền 7 ngày\nCộng đồng 1.200 học viên"} /></label>
        <div className="md:col-span-2 font-semibold pt-2 border-t" style={{ borderColor: "var(--vien)" }}>Giọng thương hiệu</div>
        <label className="flex flex-col gap-1">Xưng hô sale – khách<input {...s("xung_ho")} placeholder="em – anh/chị" /></label>
        <label className="flex flex-col gap-1">Phong cách<input {...s("phong_cach")} placeholder="Thân thiện, thẳng thắn, không hoa mỹ, dùng số liệu" /></label>
        <label className="flex flex-col gap-1">Từ cấm, mỗi dòng một cụm<textarea {...s("tu_cam")} rows={4} placeholder={"cam kết 100%\nrẻ nhất thị trường\nchắc chắn có lãi"} /></label>
        <label className="flex flex-col gap-1">Số liệu được phép nêu, mỗi dòng một số<textarea {...s("so_lieu_cho_phep")} rows={4} placeholder={"1.200 học viên đã tốt nghiệp\n6 năm kinh nghiệm\nHọc viên An Phát tiết kiệm 30% thời gian chăm sóc"} /></label>
        <div className="md:col-span-2 font-semibold pt-2 border-t" style={{ borderColor: "var(--vien)" }}>Thị trường và chính sách</div>
        <label className="flex flex-col gap-1">Đối thủ và cách nói về họ<textarea {...s("doi_thu")} rows={3} placeholder="Đối thủ A rẻ hơn nhưng không có coach; không nói xấu, so sánh bằng giá trị" /></label>
        <label className="flex flex-col gap-1">Chính sách (bảo hành, hoàn tiền, thanh toán)<textarea {...s("chinh_sach")} rows={3} /></label>
        <label className="flex flex-col gap-1 md:col-span-2">Câu chuyện thương hiệu (tùy chọn)<textarea {...s("cau_chuyen")} rows={3} /></label>
        {!chiXem && <div className="md:col-span-2"><NutCho dangLam="Đang lưu…">Lưu DNA</NutCho></div>}
      </div>
    </form>
  );
}
