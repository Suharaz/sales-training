// F-129: điểm theo hành vi, chuỗi ngày liên tiếp, hạng, bảng xếp hạng tôn trọng ẩn danh.
export const DIEM_SU_KIEN = {
  hoan_thanh_bai: 50,
  vuot_quiz: 100,
  luyen_tap_xong: 80,
  luyen_tap_diem_cao: 50, // thưởng thêm khi điểm tổng ≥ 80
  cuoc_goi_phan_tich: 30,
  duy_tri_chuoi: 20,
  hoan_thanh_khoa: 300,
} as const;
export type SuKienDiem = keyof typeof DIEM_SU_KIEN;
export const TEN_SU_KIEN_DIEM: Record<SuKienDiem, string> = {
  hoan_thanh_bai: "Hoàn thành bài học",
  vuot_quiz: "Vượt bài kiểm tra (≥ 70%)",
  luyen_tap_xong: "Hoàn thành phiên role-play",
  luyen_tap_diem_cao: "Role-play đạt ≥ 80 điểm",
  cuoc_goi_phan_tich: "Nạp cuộc gọi để AI phân tích",
  duy_tri_chuoi: "Duy trì chuỗi ngày luyện",
  hoan_thanh_khoa: "Hoàn thành khóa học",
};
/** Giới hạn chống lạm dụng: số lần tối đa được cộng điểm cho một sự kiện trong một ngày (mockup #68). */
export const GIOI_HAN_NGAY: Record<SuKienDiem, number> = {
  hoan_thanh_bai: 10, vuot_quiz: 5, luyen_tap_xong: 5, luyen_tap_diem_cao: 5, cuoc_goi_phan_tich: 10, duy_tri_chuoi: 1, hoan_thanh_khoa: 3,
};

export const HANG = [
  { ten: "Bronze", tu: 0 },
  { ten: "Silver", tu: 5000 },
  { ten: "Gold", tu: 15000 },
  { ten: "Diamond", tu: 40000 },
] as const;
export type TenHang = (typeof HANG)[number]["ten"];

export function xepHang(diem: number): TenHang {
  let h: TenHang = "Bronze";
  for (const x of HANG) if (diem >= x.tu) h = x.ten;
  return h;
}
export function hangKeTiep(diem: number): { ten: TenHang; conThieu: number } | null {
  const ke = HANG.find((x) => x.tu > diem);
  return ke ? { ten: ke.ten, conThieu: ke.tu - diem } : null;
}

/**
 * Chuỗi ngày liên tiếp tính tới `homNay` (YYYY-MM-DD theo múi giờ workspace).
 * Có hoạt động hôm nay hoặc hôm qua thì chuỗi còn sống; đứt ≥ 1 ngày thì về 0.
 */
export function tinhChuoiNgay(ngayHoatDong: string[], homNay: string): number {
  const tap = new Set(ngayHoatDong);
  let d = new Date(homNay + "T00:00:00Z");
  if (!tap.has(homNay)) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (!tap.has(d.toISOString().slice(0, 10))) return 0;
  }
  let chuoi = 0;
  while (tap.has(d.toISOString().slice(0, 10))) {
    chuoi++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return chuoi;
}

/** Tên hiển thị trên bảng xếp hạng: ẩn danh → «Thành viên #xxxx»; mặc định tên rút gọn «Nguyễn V. A.». */
export function tenBangXepHang(ten: string, anDanh: boolean, id: string): string {
  if (anDanh) return `Thành viên #${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
  const phan = ten.trim().split(/\s+/).filter(Boolean);
  if (phan.length <= 1) return ten.trim();
  const ho = phan[0];
  const giua = phan.slice(1, -1).map((p) => p[0].toUpperCase() + ".");
  return [ho, ...giua, phan[phan.length - 1]].join(" ");
}

/** Ngày YYYY-MM-DD theo múi giờ cho trước (mặc định Việt Nam). */
export function ngayTheoMuiGio(luc: Date, muiGio = "Asia/Ho_Chi_Minh"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: muiGio, year: "numeric", month: "2-digit", day: "2-digit" }).format(luc);
}
