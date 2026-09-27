// Đăng nhập dạng JSON (dùng cho kiểm thử tự động và tích hợp): POST {email, mat_khau} → đặt cookie phiên.
import { NextResponse } from "next/server";
import { dangNhap } from "@/services/xac-thuc";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { email?: string; mat_khau?: string };
  const kq = await dangNhap(String(b.email ?? ""), String(b.mat_khau ?? ""));
  return NextResponse.json(kq, { status: kq.ok ? 200 : 401 });
}
