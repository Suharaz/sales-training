// Khởi động workspace mới (quản lý): bước 1 DNA, bước 2 sản phẩm; có thể bỏ qua.
import Link from "next/link";
import { redirect } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { FormDna } from "@/components/FormDna";
import { NutCho } from "@/components/NutCho";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { nguCanhTrang } from "@/services/trang";
import { layDna, luuDna } from "@/services/dna";
import { danhSachSanPham, luuSanPham, TEN_TANG } from "@/services/kich-ban";
import { danhDauKhoiDong } from "@/services/workspace";
import { cheDoAI } from "@/services/ai-gateway";
import { dnaDaNap } from "@/core/dna";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export default async function TrangBatDau({ searchParams }: { searchParams: Promise<{ buoc?: string; loi?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  if (phien.vaiTro !== "quan_ly") redirect("/");
  const { buoc: b, loi } = await searchParams;
  const [dna, sp] = await ws(async (q) => Promise.all([layDna(q), danhSachSanPham(q)]));
  const buoc = b === "2" || (b !== "1" && dnaDaNap(dna)) ? 2 : 1;
  async function luuDnaBuoc(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const g = (k: string) => String(form.get(k) ?? "");
    try { await ws((q) => luuDna(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, nguon: g("nguon") === "ai_trich" ? "ai_trich" : "thu_cong", noiDung: { ten_doanh_nghiep: g("ten_doanh_nghiep"), nganh: g("nganh"), mo_ta: g("mo_ta"), khach_hang_muc_tieu: g("khach_hang_muc_tieu"), noi_dau_khach: g("noi_dau_khach"), usp: g("usp").split("\n"), xung_ho: g("xung_ho"), phong_cach: g("phong_cach"), tu_cam: g("tu_cam").split("\n"), so_lieu_cho_phep: g("so_lieu_cho_phep").split("\n"), doi_thu: g("doi_thu"), chinh_sach: g("chinh_sach"), cau_chuyen: g("cau_chuyen") } })); }
    catch (e) { redirect(`/bat-dau?buoc=1&loi=${encodeURIComponent((e as Error).message)}`); }
    redirect("/bat-dau?buoc=2");
  }
  async function luuSp(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const g = (k: string) => String(form.get(k) ?? "");
    try { await ws((q) => luuSanPham(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, ten: g("ten"), tang: Number(g("tang") || 2), gia: Number(g("gia").replace(/[^\d]/g, "")), moTa: g("mo_ta"), diemBanHang: g("diem_ban_hang").split("\n"), doiTuong: g("doi_tuong"), phanDoiThuongGap: g("phan_doi_thuong_gap").split("\n") })); }
    catch (e) { redirect(`/bat-dau?buoc=2&loi=${encodeURIComponent((e as Error).message)}`); }
    if (g("tiep") === "them") redirect("/bat-dau?buoc=2");
    await ws((q) => danhDauKhoiDong(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, boQua: false }));
    redirect("/?chao=1");
  }
  async function boQua() { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => danhDauKhoiDong(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, boQua: true })); redirect("/"); }
  async function xong() { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => danhDauKhoiDong(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, boQua: false })); redirect("/?chao=1"); }
  return (
    <KhungShell phien={phien} duongDan="/bat-dau" tieuDe={buoc === 1 ? "Bước 1/2 · Nạp DNA doanh nghiệp" : "Bước 2/2 · Thông tin sản phẩm"} moTa={buoc === 1 ? "AI cần biết doanh nghiệp bán gì, cho ai, giọng nói ra sao và được nêu số liệu nào. Nhanh nhất: dán giới thiệu công ty để AI trích." : "Mỗi sản phẩm một hồ sơ ngắn để khách ảo, kịch bản và copilot đúng bối cảnh. Có thể thêm chi tiết sau ở trang Sản phẩm."}
      hanhDong={<><ThongBaoAI cheDo={cheDoAI()} /><form action={boQua}><button className="nut">Bỏ qua, vào tổng quan</button></form></>}>
      <div className="flex items-center gap-2 mb-4 text-sm">{[1, 2].map((n) => <div key={n} className="flex items-center gap-2"><span className="w-7 h-7 rounded-full flex items-center justify-center font-bold" style={{ background: n <= buoc ? "var(--gradient-cta)" : "var(--nut-nen)", color: n <= buoc ? "#fff" : "var(--chu-mo)" }}>{n}</span><span className={n === buoc ? "font-semibold" : ""} style={{ color: n === buoc ? "var(--chu)" : "var(--chu-mo)" }}>{n === 1 ? "DNA doanh nghiệp" : "Sản phẩm"}</span>{n === 1 && <span style={{ color: "var(--chu-nhat)" }}>→</span>}</div>)}</div>
      {loi && <div className="thong-bao thong-bao-do mb-3">{loi}</div>}
      {buoc === 1 ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]"><FormDna action={luuDnaBuoc} dna={dna} chiXem={false} />
          <div className="the p-4 text-sm h-fit"><div className="font-semibold mb-1">Chỉ cần tối thiểu</div><ul className="list-disc pl-4 flex flex-col gap-1" style={{ color: "var(--chu-mo)" }}><li>Tên doanh nghiệp và mô tả 2–3 câu</li><li>Khách hàng mục tiêu</li><li>2–3 điểm khác biệt</li><li>Từ cấm và số liệu được phép (để AI không hứa bừa)</li></ul><div className="mt-3 text-xs" style={{ color: "var(--chu-nhat)" }}>Bấm «Lưu DNA» ở cuối form để sang bước 2. Sửa lại bất cứ lúc nào ở mục DNA doanh nghiệp.</div></div></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <form action={luuSp} className="the p-4 flex flex-col gap-2 text-sm">
            <div className="font-semibold">Sản phẩm {sp.length > 0 ? `#${sp.length + 1}` : "đầu tiên"}</div>
            <input name="ten" className="o-nhap" placeholder="Tên sản phẩm *" required />
            <div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1">Bậc thang<select name="tang" className="o-nhap" defaultValue={2}>{Object.entries(TEN_TANG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label><label className="flex flex-col gap-1">Giá (VND)<input name="gia" type="number" min={0} step={1000} className="o-nhap" defaultValue={0} /></label></div>
            <textarea name="mo_ta" className="o-nhap" rows={3} placeholder="Mô tả: sản phẩm là gì, giải quyết vấn đề gì" required />
            <textarea name="doi_tuong" className="o-nhap" rows={2} placeholder="Dành cho ai" />
            <textarea name="diem_ban_hang" className="o-nhap" rows={3} placeholder="Điểm bán hàng, mỗi dòng một ý" />
            <textarea name="phan_doi_thuong_gap" className="o-nhap" rows={2} placeholder="Phản đối khách hay nêu, mỗi dòng một câu (tùy chọn)" />
            <div className="flex flex-wrap gap-2"><NutCho name="tiep" value="xong" dangLam="Đang lưu…">Lưu và vào tổng quan</NutCho><NutCho name="tiep" value="them" className="nut" dangLam="Đang lưu…">Lưu và thêm sản phẩm khác</NutCho></div>
          </form>
          <div className="flex flex-col gap-3">
            <div className="the p-4 text-sm"><div className="font-semibold mb-2">Đã có {sp.length} sản phẩm</div>{sp.length === 0 ? <div className="mo-ta">Chưa có.</div> : <ul className="flex flex-col gap-1">{sp.map((s) => <li key={s.id} className="flex justify-between"><span>{s.ten}</span><span className="tabular" style={{ color: "var(--chu-mo)" }}>{Number(s.gia).toLocaleString("vi-VN")}đ</span></li>)}</ul>}
              {sp.length > 0 && <form action={xong} className="mt-3"><button className="nut nut-chinh w-full justify-center">Xong, vào tổng quan</button></form>}</div>
            <Link href="/bat-dau?buoc=1" className="nut">← Sửa DNA</Link>
          </div>
        </div>)}
    </KhungShell>
  );
}
