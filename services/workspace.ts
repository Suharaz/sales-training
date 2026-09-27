// Cài đặt workspace (quản lý) + nhật ký kiểm toán.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { ghiKiemToan } from "./nhat-ky";
export type CaiDatWs = { id: string; ten: string; slug: string; mui_gio: string; nguong_rot_hoc_ngay: number };
export async function layWorkspace(q: Truy, id: string): Promise<CaiDatWs> {
  const r = (await q.query<CaiDatWs>("select id, ten, slug, mui_gio, nguong_rot_hoc_ngay from workspace where id = $1", [id])).rows[0];
  if (!r) throw new Error("Workspace không tồn tại hoặc phiên không hợp lệ");
  return r;
}
const MUI_GIO_HOP_LE = ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Europe/London", "America/New_York", "America/Los_Angeles"];
export async function capNhatWorkspace(q: Truy, o: { workspaceId: string; nguoiDungId: string; ten: string; muiGio: string; nguongRotHoc: number }) {
  if (!o.ten.trim()) throw new Error("Tên workspace không được trống");
  if (!MUI_GIO_HOP_LE.includes(o.muiGio)) throw new Error("Múi giờ không hợp lệ");
  const ng = Math.min(60, Math.max(1, Math.round(o.nguongRotHoc || 7)));
  await q.query("update workspace set ten = $2, mui_gio = $3, nguong_rot_hoc_ngay = $4, cap_nhat_luc = now() where id = $1", [o.workspaceId, o.ten.trim().slice(0, 120), o.muiGio, ng]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "cap_nhat_workspace", chiTiet: { ten: o.ten, mui_gio: o.muiGio, nguong_rot_hoc: ng } });
}
export { MUI_GIO_HOP_LE };
export type DongKiemToan = { luc: string; ten: string | null; hanh_dong: string; doi_tuong: string | null; chi_tiet: Record<string, unknown> };
export async function nhatKyKiemToan(q: Truy, gioiHan = 100): Promise<DongKiemToan[]> {
  return (await q.query<DongKiemToan>("select k.luc::text, n.ten, k.hanh_dong, k.doi_tuong, k.chi_tiet from nhat_ky_kiem_toan k left join nguoi_dung n on n.id = k.nguoi_dung_id order by k.luc desc limit $1", [gioiHan])).rows;
}
