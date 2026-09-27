// Tiện ích cho trang server: phiên + hàm chạy truy vấn trong ngữ cảnh workspace của phiên.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { voiWorkspace } from "./workspace-guard";
import { yeuCauPhien, type Phien } from "./xac-thuc";
export type NguCanh = { phien: Phien; ws: <T>(fn: (q: Truy) => Promise<T>) => Promise<T> };
export async function nguCanhTrang(): Promise<NguCanh> {
  const phien = await yeuCauPhien();
  return { phien, ws: (fn) => voiWorkspace(phien.workspaceId, fn) };
}
export function dinhDangNgay(s: string | null | undefined, muiGio = "Asia/Ho_Chi_Minh"): string {
  if (!s) return "—";
  const d = new Date(s); if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: muiGio, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
export function dinhDangNgayNgan(s: string | null | undefined, muiGio = "Asia/Ho_Chi_Minh"): string {
  if (!s) return "—";
  const d = new Date(s); if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: muiGio, day: "2-digit", month: "2-digit" }).format(d);
}
export function tuKhiNao(s: string | null | undefined): string {
  if (!s) return "—";
  const ms = Date.now() - new Date(s).getTime();
  const phut = Math.round(ms / 60000);
  if (phut < 1) return "vừa xong"; if (phut < 60) return `${phut} phút trước`;
  const gio = Math.round(phut / 60); if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.round(gio / 24); return `${ngay} ngày trước`;
}
export function soTien(n: number | string): string { return Number(n).toLocaleString("vi-VN") + "đ"; }
