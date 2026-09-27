// Đăng nhập email + mật khẩu, cookie ký HMAC chứa người dùng + workspace + vai trò (7 ngày).
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { biMatPhien } from "@/core/moi-truong";
import { kiemMatKhau } from "@/core/mat-khau";
import { coQuyen, laVaiTro, type HanhDong, type VaiTro } from "@/core/phan-quyen";
import { truyNenTang, voiWorkspace } from "./workspace-guard";
import { ghiKiemToan } from "./nhat-ky";

export const TEN_COOKIE = "st_phien";
export type Phien = { nguoiDungId: string; email: string; ten: string; workspaceId: string; workspaceTen: string; muiGio: string; vaiTro: VaiTro; hetHan: number };

const ky = (b: string) => createHmac("sha256", biMatPhien()).update(b).digest("base64url");
function maHoa(p: Phien) { const b = Buffer.from(JSON.stringify(p)).toString("base64url"); return `${b}.${ky(b)}`; }
export function giaiMa(token?: string): Phien | null {
  if (!token) return null;
  const [b, s] = token.split(".");
  if (!b || !s) return null;
  const chuKy = Buffer.from(ky(b)), nhan = Buffer.from(s);
  if (chuKy.length !== nhan.length || !timingSafeEqual(chuKy, nhan)) return null;
  try { const p = JSON.parse(Buffer.from(b, "base64url").toString()) as Phien; return p.hetHan > Date.now() && laVaiTro(p.vaiTro) ? p : null; } catch { return null; }
}
export async function layPhien(): Promise<Phien | null> { return giaiMa((await cookies()).get(TEN_COOKIE)?.value); }
export async function yeuCauPhien(): Promise<Phien> { const p = await layPhien(); if (!p) redirect("/dang-nhap"); return p; }
export class LoiQuyen extends Error { constructor(hd: HanhDong) { super(`Không có quyền: ${hd}`); this.name = "LoiQuyen"; } }
export function yeuCauQuyen(p: Phien, hd: HanhDong) { if (!coQuyen(p.vaiTro, hd)) throw new LoiQuyen(hd); }
export async function yeuCauQuanLy(): Promise<Phien> { const p = await yeuCauPhien(); if (p.vaiTro !== "quan_ly") redirect("/"); return p; }

async function datCookie(p: Phien) {
  (await cookies()).set(TEN_COOKIE, maHoa(p), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 86_400, secure: process.env.NODE_ENV === "production" });
}

type HangND = { id: string; workspace_id: string; email: string; ten: string; mat_khau_hash: string | null; vai_tro: VaiTro; hoat_dong: boolean; ws_ten: string; ws_slug: string; mui_gio: string };

export async function dangNhap(email: string, matKhau: string): Promise<{ ok: true } | { ok: false; loi: string }> {
  const e = email.trim().toLowerCase();
  const nd = (await truyNenTang<HangND>("select * from tim_nguoi_dung_theo_email($1)", [e]))[0];
  if (!nd || !nd.hoat_dong || !kiemMatKhau(matKhau, nd.mat_khau_hash)) return { ok: false, loi: "Email hoặc mật khẩu không đúng." };
  const phien: Phien = { nguoiDungId: nd.id, email: nd.email, ten: nd.ten, workspaceId: nd.workspace_id, workspaceTen: nd.ws_ten, muiGio: nd.mui_gio, vaiTro: nd.vai_tro, hetHan: Date.now() + 7 * 86_400_000 };
  await datCookie(phien);
  await voiWorkspace(nd.workspace_id, (q) => ghiKiemToan(q, { workspaceId: nd.workspace_id, nguoiDungId: nd.id, hanhDong: "dang_nhap" }));
  return { ok: true };
}
export async function dangXuat() { (await cookies()).delete(TEN_COOKIE); }
