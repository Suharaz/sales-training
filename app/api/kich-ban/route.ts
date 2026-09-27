import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { goiYCauTraLoi } from "@/services/kich-ban";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
export async function POST(req: Request) {
  const phien = await layPhien();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  if (phien.vaiTro !== "quan_ly") return NextResponse.json({ loi: "Chỉ quản lý" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { loai?: string; noi_dung?: string; san_pham_id?: string | null };
  if (!b.noi_dung?.trim()) return NextResponse.json({ loi: "Thiếu nội dung" }, { status: 400 });
  const r = await voiWorkspace(phien.workspaceId, (q) => goiYCauTraLoi(q, { workspaceId: phien.workspaceId, loai: String(b.loai ?? "khac"), noiDung: b.noi_dung!.slice(0, 500), sanPhamId: b.san_pham_id ?? null }));
  return NextResponse.json(r);
}
