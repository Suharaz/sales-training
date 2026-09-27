// Băm mật khẩu bằng scrypt (Node crypto), không phụ thuộc thư viện ngoài.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export function bamMatKhau(matKhau: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(matKhau, salt, 64).toString("hex")}`;
}
export function kiemMatKhau(matKhau: string, daLuu: string | null | undefined): boolean {
  if (!daLuu) return false;
  const [tt, salt, hash] = daLuu.split("$");
  if (tt !== "scrypt" || !salt || !hash) return false;
  const thu = scryptSync(matKhau, salt, 64), goc = Buffer.from(hash, "hex");
  return thu.length === goc.length && timingSafeEqual(thu, goc);
}
export function matKhauDuManh(mk: string): string | null {
  if (mk.length < 8) return "Mật khẩu cần tối thiểu 8 ký tự.";
  if (mk.length > 200) return "Mật khẩu quá dài.";
  if (/^(.)\1+$/.test(mk)) return "Mật khẩu không được là một ký tự lặp lại.";
  const nhom = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].filter((r) => r.test(mk)).length;
  if (nhom < 2) return "Mật khẩu cần ít nhất hai loại ký tự (chữ thường, CHỮ HOA, số hoặc ký hiệu).";
  return null;
}
