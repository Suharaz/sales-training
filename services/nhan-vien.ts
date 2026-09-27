// Quản lý nhân viên trong workspace (quản lý): thêm sale, đổi vai trò, đặt lại mật khẩu, khóa; cá nhân: đổi mật khẩu, ẩn danh BXH.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { bamMatKhau, kiemMatKhau, matKhauDuManh } from "@/core/mat-khau";
import { laVaiTro, type VaiTro } from "@/core/phan-quyen";
import { ghiKiemToan } from "./nhat-ky";

export type NhanVien = { id: string; email: string; ten: string; chuc_danh: string; vai_tro: VaiTro; an_danh_bxh: boolean; hoat_dong: boolean; tao_luc: string };
export async function danhSachNhanVien(q: Truy): Promise<NhanVien[]> {
  return (await q.query<NhanVien>("select id, email, ten, chuc_danh, vai_tro, an_danh_bxh, hoat_dong, tao_luc::text from nguoi_dung order by vai_tro, ten")).rows;
}
export async function themNhanVien(q: Truy, o: { workspaceId: string; nguoiDungId: string; email: string; ten: string; chucDanh: string; vaiTro: string; matKhau: string }): Promise<string> {
  const email = o.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email không hợp lệ");
  if (!o.ten.trim()) throw new Error("Tên không được trống");
  if (!laVaiTro(o.vaiTro)) throw new Error("Vai trò không hợp lệ");
  const yeu = matKhauDuManh(o.matKhau); if (yeu) throw new Error(yeu);
  const trung = await q.query("select 1 from nguoi_dung where email = $1", [email]);
  if (trung.rowCount) throw new Error("Email đã tồn tại trong workspace");
  const id = (await q.query<{ id: string }>("insert into nguoi_dung(workspace_id, email, ten, chuc_danh, vai_tro, mat_khau_hash) values ($1,$2,$3,$4,$5,$6) returning id", [o.workspaceId, email, o.ten.trim().slice(0, 120), o.chucDanh.trim().slice(0, 120), o.vaiTro, bamMatKhau(o.matKhau)])).rows[0].id;
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "them_nhan_vien", doiTuong: id, chiTiet: { email, vai_tro: o.vaiTro } });
  return id;
}
export async function capNhatNhanVien(q: Truy, o: { workspaceId: string; nguoiDungId: string; id: string; vaiTro?: string; hoatDong?: boolean; matKhauMoi?: string; chucDanh?: string }) {
  if (o.vaiTro !== undefined) { if (!laVaiTro(o.vaiTro)) throw new Error("Vai trò không hợp lệ"); await q.query("update nguoi_dung set vai_tro = $2 where id = $1", [o.id, o.vaiTro]); }
  if (o.hoatDong !== undefined) {
    if (o.id === o.nguoiDungId && !o.hoatDong) throw new Error("Không thể tự khóa tài khoản của mình");
    await q.query("update nguoi_dung set hoat_dong = $2 where id = $1", [o.id, o.hoatDong]);
  }
  if (o.chucDanh !== undefined) await q.query("update nguoi_dung set chuc_danh = $2 where id = $1", [o.id, o.chucDanh.slice(0, 120)]);
  if (o.matKhauMoi) { const yeu = matKhauDuManh(o.matKhauMoi); if (yeu) throw new Error(yeu); await q.query("update nguoi_dung set mat_khau_hash = $2 where id = $1", [o.id, bamMatKhau(o.matKhauMoi)]); }
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "cap_nhat_nhan_vien", doiTuong: o.id, chiTiet: { vai_tro: o.vaiTro, hoat_dong: o.hoatDong, doi_mat_khau: !!o.matKhauMoi } });
}
export async function doiMatKhauCuaToi(q: Truy, o: { workspaceId: string; nguoiDungId: string; cu: string; moi: string }) {
  const nd = (await q.query<{ mat_khau_hash: string | null }>("select mat_khau_hash from nguoi_dung where id = $1", [o.nguoiDungId])).rows[0];
  if (!nd || !kiemMatKhau(o.cu, nd.mat_khau_hash)) throw new Error("Mật khẩu hiện tại không đúng");
  const yeu = matKhauDuManh(o.moi); if (yeu) throw new Error(yeu);
  await q.query("update nguoi_dung set mat_khau_hash = $2 where id = $1", [o.nguoiDungId, bamMatKhau(o.moi)]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "doi_mat_khau" });
}
export async function datAnDanh(q: Truy, o: { nguoiDungId: string; anDanh: boolean }) {
  await q.query("update nguoi_dung set an_danh_bxh = $2 where id = $1", [o.nguoiDungId, o.anDanh]);
}
