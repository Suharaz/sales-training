// Đọc biến môi trường có kiểm tra — bí mật phiên bắt buộc ở production.
export function biMatPhien(): string {
  const s = process.env.PHIEN_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Thiếu PHIEN_SECRET (>= 16 ký tự)");
  return "bi-mat-phat-trien-khong-dung-o-production";
}
