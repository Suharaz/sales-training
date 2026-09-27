import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang, soTien } from "@/services/trang";
import { danhSachSanPham, luuSanPham, xoaSanPham, TEN_TANG } from "@/services/kich-ban";
export const dynamic = "force-dynamic";
export default async function TrangSanPham({ searchParams }: { searchParams: Promise<{ loi?: string; sua?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { loi, sua } = await searchParams;
  const sp = await ws((q) => danhSachSanPham(q));
  const quanLy = phien.vaiTro === "quan_ly";
  const spSua = sua ? sp.find((s) => s.id === sua) : undefined;
  async function luu(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const g = (k: string) => String(form.get(k) ?? "");
    try { await ws((q) => luuSanPham(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: g("id") || undefined, ten: g("ten"), tang: Number(g("tang") || 2), gia: Number(g("gia").replace(/[^\d]/g, "")), moTa: g("mo_ta"), diemBanHang: g("diem_ban_hang").split("\n"), doiTuong: g("doi_tuong"), ketQuaKyVong: g("ket_qua_ky_vong"), hinhThuc: g("hinh_thuc"), thoiLuong: g("thoi_luong"), chinhSach: g("chinh_sach"), soSanhDoiThu: g("so_sanh_doi_thu"), phanDoiThuongGap: g("phan_doi_thuong_gap").split("\n"), taiLieuUrl: g("tai_lieu_url"), trangThai: g("trang_thai") })); }
    catch (e) { redirect(`/san-pham?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/san-pham"); redirect("/san-pham");
  }
  async function xoa(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => xoaSanPham(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id")) })); revalidatePath("/san-pham"); }
  return (
    <KhungShell phien={phien} duongDan="/san-pham" tieuDe="Sản phẩm" moTa="Hồ sơ từng sản phẩm theo bậc thang giá trị. AI dùng để đóng vai khách đúng bối cảnh, gợi ý câu trả lời và chấm đúng sản phẩm.">
      {loi && <div className="thong-bao thong-bao-do mb-3">{loi}</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-3">{sp.length === 0 && <div className="the p-8 text-center mo-ta">Chưa có sản phẩm. Thêm ở cột phải.</div>}{sp.map((s) => (
          <div key={s.id} className="the p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold text-base">{s.ten}</div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>{TEN_TANG[s.tang]}{s.hinh_thuc && ` · ${s.hinh_thuc}`}{s.thoi_luong && ` · ${s.thoi_luong}`}</div></div>
              <div className="flex items-center gap-2"><span className="text-lg font-bold tabular">{soTien(s.gia)}</span>{s.trang_thai === "ngung" && <span className="nhan nhan-xam">Ngừng bán</span>}</div></div>
            <p className="mt-2">{s.mo_ta}</p>
            <div className="grid gap-2 md:grid-cols-2 mt-2">
              {s.doi_tuong && <Muc ten="Dành cho">{s.doi_tuong}</Muc>}{s.ket_qua_ky_vong && <Muc ten="Kết quả kỳ vọng">{s.ket_qua_ky_vong}</Muc>}
              {s.diem_ban_hang.length > 0 && <Muc ten="Điểm bán hàng"><ul className="list-disc pl-4">{s.diem_ban_hang.map((d, i) => <li key={i}>{d}</li>)}</ul></Muc>}
              {s.phan_doi_thuong_gap.length > 0 && <Muc ten="Phản đối thường gặp"><ul className="list-disc pl-4">{s.phan_doi_thuong_gap.map((d, i) => <li key={i}>{d}</li>)}</ul></Muc>}
              {s.chinh_sach && <Muc ten="Chính sách">{s.chinh_sach}</Muc>}{s.so_sanh_doi_thu && <Muc ten="So với đối thủ">{s.so_sanh_doi_thu}</Muc>}
            </div>
            <div className="flex gap-2 mt-3 items-center">{s.tai_lieu_url && <a href={s.tai_lieu_url} target="_blank" rel="noreferrer" className="nut nut-nho">Tài liệu</a>}
              {quanLy && <><a href={`/san-pham?sua=${s.id}`} className="nut nut-nho">Sửa</a><form action={xoa}><input type="hidden" name="id" value={s.id} /><button className="nut nut-nho nut-nguy">Xóa</button></form></>}</div>
          </div>))}</div>
        {quanLy && <form action={luu} className="the p-4 flex flex-col gap-2 text-sm h-fit" key={spSua?.id ?? "moi"}>
          <div className="font-semibold">{spSua ? "Sửa sản phẩm" : "Thêm sản phẩm"}</div>
          {spSua && <input type="hidden" name="id" value={spSua.id} />}
          <input name="ten" className="o-nhap" placeholder="Tên sản phẩm *" required defaultValue={spSua?.ten} />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">Bậc thang<select name="tang" className="o-nhap" defaultValue={spSua?.tang ?? 2}>{Object.entries(TEN_TANG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="flex flex-col gap-1">Giá (VND)<input name="gia" type="number" min={0} step={1000} className="o-nhap" defaultValue={spSua ? Number(spSua.gia) : 0} /></label>
            <label className="flex flex-col gap-1">Hình thức<input name="hinh_thuc" className="o-nhap" placeholder="Online / offline / 1-1 / combo" defaultValue={spSua?.hinh_thuc} /></label>
            <label className="flex flex-col gap-1">Thời lượng<input name="thoi_luong" className="o-nhap" placeholder="8 tuần, 6 tháng…" defaultValue={spSua?.thoi_luong} /></label>
          </div>
          <textarea name="mo_ta" className="o-nhap" rows={3} placeholder="Mô tả: sản phẩm là gì, giải quyết vấn đề gì" defaultValue={spSua?.mo_ta} />
          <textarea name="doi_tuong" className="o-nhap" rows={2} placeholder="Dành cho ai (và không dành cho ai)" defaultValue={spSua?.doi_tuong} />
          <textarea name="ket_qua_ky_vong" className="o-nhap" rows={2} placeholder="Kết quả kỳ vọng sau khi dùng (không hứa tuyệt đối)" defaultValue={spSua?.ket_qua_ky_vong} />
          <textarea name="diem_ban_hang" className="o-nhap" rows={4} placeholder="Điểm bán hàng, mỗi dòng một ý" defaultValue={spSua?.diem_ban_hang.join("\n")} />
          <textarea name="phan_doi_thuong_gap" className="o-nhap" rows={3} placeholder="Phản đối thường gặp với sản phẩm này, mỗi dòng một câu" defaultValue={spSua?.phan_doi_thuong_gap.join("\n")} />
          <textarea name="chinh_sach" className="o-nhap" rows={2} placeholder="Chính sách: hoàn tiền, bảo hành, trả góp, hỗ trợ" defaultValue={spSua?.chinh_sach} />
          <textarea name="so_sanh_doi_thu" className="o-nhap" rows={2} placeholder="So với đối thủ (không nói xấu)" defaultValue={spSua?.so_sanh_doi_thu} />
          <input name="tai_lieu_url" className="o-nhap" placeholder="Link tài liệu / brochure (https://…)" defaultValue={spSua?.tai_lieu_url ?? ""} />
          <select name="trang_thai" className="o-nhap" defaultValue={spSua?.trang_thai ?? "dang_ban"}><option value="dang_ban">Đang bán</option><option value="ngung">Ngừng bán</option></select>
          <div className="flex gap-2"><button className="nut nut-chinh">{spSua ? "Lưu" : "Thêm"}</button>{spSua && <a href="/san-pham" className="nut">Hủy</a>}</div>
        </form>}
      </div>
    </KhungShell>
  );
}
function Muc({ ten, children }: { ten: string; children: React.ReactNode }) { return <div className="the-2 p-2"><div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--chu-nhat)" }}>{ten}</div><div>{children}</div></div>; }
