import { NextResponse } from "next/server";
import { dangXuat } from "@/services/xac-thuc";
export async function POST() { await dangXuat(); return NextResponse.json({ ok: true }); }
/** GET /api/dang-xuat?ve=/duong-dan — xóa cookie rồi chuyển hướng (dùng khi phiên cũ không còn hợp lệ). */
export async function GET(req: Request) {
  await dangXuat();
  const ve = new URL(req.url).searchParams.get("ve") || "/dang-nhap";
  return NextResponse.redirect(new URL(ve.startsWith("/") ? ve : "/dang-nhap", req.url));
}
