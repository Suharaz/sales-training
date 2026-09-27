// Hai vai trò: quản lý (thấy cả đội, duyệt nội dung, soạn khóa) và sale (dữ liệu của mình).
export const VAI_TRO = ["quan_ly", "sale"] as const;
export type VaiTro = (typeof VAI_TRO)[number];
export const TEN_VAI_TRO: Record<VaiTro, string> = { quan_ly: "Quản lý", sale: "Nhân viên sale" };
export function laVaiTro(s: unknown): s is VaiTro {
  return typeof s === "string" && (VAI_TRO as readonly string[]).includes(s);
}
export type HanhDong = "xem_doi" | "duyet" | "soan_khoa" | "quan_ly_nhan_vien" | "xem_diem_nguoi_khac" | "sua_kich_ban";
const QUYEN: Record<VaiTro, HanhDong[]> = {
  quan_ly: ["xem_doi", "duyet", "soan_khoa", "quan_ly_nhan_vien", "xem_diem_nguoi_khac", "sua_kich_ban"],
  sale: [],
};
export function coQuyen(vai: VaiTro, hd: HanhDong): boolean {
  return QUYEN[vai].includes(hd);
}
/** Điểm cuộc gọi chỉ quản lý và chính sale xem (quy tắc F-115). */
export function xemDuocDiem(vai: VaiTro, chuSoHuuId: string, nguoiXemId: string): boolean {
  return vai === "quan_ly" || chuSoHuuId === nguoiXemId;
}
