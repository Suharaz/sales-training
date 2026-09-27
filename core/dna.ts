// DNA doanh nghiệp: kiểu dữ liệu, tóm tắt cho prompt AI, kiểm từ cấm trong đầu ra.
import { z } from "zod";
export const dnaSchema = z.object({
  ten_doanh_nghiep: z.string(),
  nganh: z.string(),
  mo_ta: z.string(),
  khach_hang_muc_tieu: z.string(),
  noi_dau_khach: z.string(),
  usp: z.array(z.string()).max(12),
  xung_ho: z.string(),
  phong_cach: z.string(),
  tu_cam: z.array(z.string()).max(40),
  so_lieu_cho_phep: z.array(z.string()).max(30),
  doi_thu: z.string(),
  chinh_sach: z.string(),
  cau_chuyen: z.string(),
});
export type NoiDungDna = z.infer<typeof dnaSchema>;
export const DNA_RONG: NoiDungDna = { ten_doanh_nghiep: "", nganh: "", mo_ta: "", khach_hang_muc_tieu: "", noi_dau_khach: "", usp: [], xung_ho: "em – anh/chị", phong_cach: "", tu_cam: [], so_lieu_cho_phep: [], doi_thu: "", chinh_sach: "", cau_chuyen: "" };

export function dnaDaNap(d: NoiDungDna | null | undefined): boolean {
  return !!d && !!d.ten_doanh_nghiep.trim() && (!!d.mo_ta.trim() || d.usp.length > 0);
}
/** Điểm đầy đủ 0–100 của hồ sơ DNA (trang DNA hiện thanh tiến độ + việc còn thiếu). */
export function doDayDuDna(d: NoiDungDna): { diem: number; thieu: string[] } {
  const muc: [string, boolean][] = [
    ["Tên doanh nghiệp", !!d.ten_doanh_nghiep.trim()], ["Ngành", !!d.nganh.trim()], ["Mô tả", d.mo_ta.trim().length >= 40],
    ["Khách hàng mục tiêu", !!d.khach_hang_muc_tieu.trim()], ["Nỗi đau khách", !!d.noi_dau_khach.trim()], ["USP (≥ 2)", d.usp.length >= 2],
    ["Phong cách giao tiếp", !!d.phong_cach.trim()], ["Từ cấm", d.tu_cam.length > 0], ["Số liệu được phép", d.so_lieu_cho_phep.length > 0],
    ["Đối thủ", !!d.doi_thu.trim()], ["Chính sách", !!d.chinh_sach.trim()],
  ];
  const co = muc.filter(([, ok]) => ok).length;
  return { diem: Math.round((co / muc.length) * 100), thieu: muc.filter(([, ok]) => !ok).map(([t]) => t) };
}
/** Tóm tắt DNA đưa vào prompt (≤ ~1200 ký tự). */
export function tomTatDna(d: NoiDungDna): string {
  const dong = [
    `Doanh nghiệp: ${d.ten_doanh_nghiep}${d.nganh ? ` (${d.nganh})` : ""}. ${d.mo_ta}`.trim(),
    d.khach_hang_muc_tieu && `Khách hàng mục tiêu: ${d.khach_hang_muc_tieu}`,
    d.noi_dau_khach && `Nỗi đau khách thường gặp: ${d.noi_dau_khach}`,
    d.usp.length && `Điểm khác biệt (USP): ${d.usp.join("; ")}`,
    `Xưng hô: ${d.xung_ho || "em – anh/chị"}.${d.phong_cach ? ` Phong cách: ${d.phong_cach}.` : ""}`,
    d.tu_cam.length && `TỪ CẤM (không được dùng): ${d.tu_cam.join(", ")}`,
    d.so_lieu_cho_phep.length ? `SỐ LIỆU ĐƯỢC PHÉP nêu (chỉ dùng đúng các số này): ${d.so_lieu_cho_phep.join("; ")}` : "Không có số liệu được phép: không nêu con số thành tích, không cam kết kết quả.",
    d.doi_thu && `Đối thủ và cách nói về họ: ${d.doi_thu}`,
    d.chinh_sach && `Chính sách (bảo hành, hoàn tiền, thanh toán): ${d.chinh_sach}`,
    d.cau_chuyen && `Câu chuyện thương hiệu: ${d.cau_chuyen}`,
  ].filter(Boolean) as string[];
  return dong.join("\n").slice(0, 1600);
}
/** Tìm từ cấm xuất hiện trong văn bản AI sinh (không phân biệt hoa thường). */
export function timTuCam(text: string, tuCam: string[]): string[] {
  const t = text.toLowerCase();
  return tuCam.map((x) => x.trim()).filter((x) => x && t.includes(x.toLowerCase()));
}
