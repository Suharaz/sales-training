// F-129: mã chứng chỉ tất định (cùng người + khóa → cùng mã), tra công khai không lộ dữ liệu ngoài tên và khóa.
import { createHash } from "node:crypto";
export function maChungChi(workspaceId: string, nguoiDungId: string, khoaHocId: string, nam: number): string {
  const h = createHash("sha256").update(`${workspaceId}|${nguoiDungId}|${khoaHocId}`).digest("hex").slice(0, 8).toUpperCase();
  return `TST-${nam}-${h.slice(0, 4)}-${h.slice(4)}`;
}
export function laMaChungChi(s: string): boolean {
  return /^TST-\d{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(s.trim().toUpperCase());
}
