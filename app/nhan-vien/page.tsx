import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang, dinhDangNgayNgan } from "@/services/trang";
import { yeuCauQuanLy } from "@/services/xac-thuc";
import { danhSachNhanVien, themNhanVien, capNhatNhanVien } from "@/services/nhan-vien";
import { TEN_VAI_TRO } from "@/core/phan-quyen";
export const dynamic = "force-dynamic";
export default async function TrangNhanVien({ searchParams }: { searchParams: Promise<{ loi?: string; ok?: string }> }) {
  await yeuCauQuanLy();
  const { phien, ws } = await nguCanhTrang();
  const ds = await ws((q) => danhSachNhanVien(q));
  const { loi, ok } = await searchParams;
  async function them(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    try { await ws((q) => themNhanVien(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, email: String(form.get("email")), ten: String(form.get("ten")), chucDanh: String(form.get("chuc_danh") ?? ""), vaiTro: String(form.get("vai_tro")), matKhau: String(form.get("mat_khau")) })); }
    catch (e) { redirect(`/nhan-vien?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/nhan-vien"); redirect("/nhan-vien?ok=1");
  }
  async function capNhat(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const hd = String(form.get("hanh_dong"));
    try {
      await ws((q) => capNhatNhanVien(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id")),
        vaiTro: hd === "vai_tro" ? String(form.get("vai_tro")) : undefined, hoatDong: hd === "khoa" ? false : hd === "mo" ? true : undefined, matKhauMoi: hd === "mat_khau" ? String(form.get("mat_khau")) : undefined }));
    } catch (e) { redirect(`/nhan-vien?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/nhan-vien");
  }
  return (
    <KhungShell phien={phien} duongDan="/nhan-vien" tieuDe="Nhân viên & phân quyền" moTa="Quản lý thấy cả đội và duyệt nội dung; sale chỉ thấy dữ liệu của mình.">
      {loi && <div className="text-sm px-3 py-2 rounded-lg mb-3" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
      {ok && <div className="text-sm px-3 py-2 rounded-lg mb-3" style={{ background: "var(--xanh-mo)", color: "var(--chu-xanh)" }}>Đã thêm nhân viên.</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="the overflow-x-auto"><table className="bang"><thead><tr><th>Nhân viên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Từ</th><th>Thao tác</th></tr></thead>
          <tbody>{ds.map((n) => (
            <tr key={n.id}><td><Link href={`/huan-luyen/${n.id}`} className="font-medium hover:underline">{n.ten}</Link><div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{n.chuc_danh}</div></td><td className="text-xs">{n.email}</td>
              <td><form action={capNhat} className="flex gap-1"><input type="hidden" name="id" value={n.id} /><input type="hidden" name="hanh_dong" value="vai_tro" /><select name="vai_tro" className="o-nhap py-1 text-xs w-32" defaultValue={n.vai_tro} disabled={n.id === phien.nguoiDungId}>{Object.entries(TEN_VAI_TRO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>{n.id !== phien.nguoiDungId && <button className="nut nut-nho">Lưu</button>}</form></td>
              <td><span className={`nhan ${n.hoat_dong ? "nhan-xanh" : "nhan-do"}`}>{n.hoat_dong ? "Hoạt động" : "Đã khóa"}</span></td><td className="text-xs" style={{ color: "var(--chu-mo)" }}>{dinhDangNgayNgan(n.tao_luc, phien.muiGio)}</td>
              <td><div className="flex gap-1 items-center">{n.id !== phien.nguoiDungId && <form action={capNhat}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="hanh_dong" value={n.hoat_dong ? "khoa" : "mo"} /><button className={`nut nut-nho ${n.hoat_dong ? "nut-nguy" : ""}`}>{n.hoat_dong ? "Khóa" : "Mở"}</button></form>}
                <form action={capNhat} className="flex gap-1"><input type="hidden" name="id" value={n.id} /><input type="hidden" name="hanh_dong" value="mat_khau" /><input name="mat_khau" type="password" className="o-nhap py-1 text-xs w-32" placeholder="Mật khẩu mới" required /><button className="nut nut-nho">Đặt</button></form></div></td></tr>))}</tbody></table></div>
        <form action={them} className="the p-4 flex flex-col gap-2 text-sm h-fit"><div className="font-semibold">Thêm nhân viên</div>
          <input name="ten" className="o-nhap" placeholder="Họ tên" required /><input name="email" type="email" className="o-nhap" placeholder="email@congty.vn" required /><input name="chuc_danh" className="o-nhap" placeholder="Chức danh" />
          <select name="vai_tro" className="o-nhap" defaultValue="sale">{Object.entries(TEN_VAI_TRO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="mat_khau" type="password" className="o-nhap" placeholder="Mật khẩu (≥ 8 ký tự, 2 loại ký tự)" required /><button className="nut nut-chinh">Thêm</button></form>
      </div>
    </KhungShell>
  );
}
