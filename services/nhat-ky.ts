// Sự kiện (chỉ INSERT) và audit log — dùng trong transaction đã có ngữ cảnh workspace.
import type { Truy } from "@/db/ket-noi";
export async function ghiSuKien(q: Truy, o: { workspaceId: string; loai: string; nguoiDungId?: string | null; payload?: Record<string, unknown> }) {
  await q.query("insert into su_kien(workspace_id, loai, nguoi_dung_id, payload) values ($1,$2,$3,$4)", [o.workspaceId, o.loai, o.nguoiDungId ?? null, JSON.stringify(o.payload ?? {})]);
}
export async function ghiKiemToan(q: Truy, o: { workspaceId: string; nguoiDungId?: string | null; hanhDong: string; doiTuong?: string; chiTiet?: Record<string, unknown> }) {
  await q.query("insert into nhat_ky_kiem_toan(workspace_id, nguoi_dung_id, hanh_dong, doi_tuong, chi_tiet) values ($1,$2,$3,$4,$5)", [o.workspaceId, o.nguoiDungId ?? null, o.hanhDong, o.doiTuong ?? null, JSON.stringify(o.chiTiet ?? {})]);
}
