import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { goiYTrucTiep } from "@/services/copilot";
import type { LuotHoiThoai } from "@/core/ai-kieu";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req: Request) {
  const phien = await layPhien();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { luot?: LuotHoiThoai[]; san_pham_id?: string | null };
  const luot = (Array.isArray(b.luot) ? b.luot : []).filter((l) => l && (l.vai === "sale" || l.vai === "khach") && typeof l.noi_dung === "string").map((l) => ({ vai: l.vai, noi_dung: l.noi_dung.slice(0, 1500), luc: "" })).slice(-30);
  if (luot.length === 0) return NextResponse.json({ loi: "Chưa có lời thoại" }, { status: 400 });
  try { return NextResponse.json(await voiWorkspace(phien.workspaceId, (q) => goiYTrucTiep(q, { workspaceId: phien.workspaceId, luot, sanPhamId: b.san_pham_id ?? null, tenSale: phien.ten }))); }
  catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 400 }); }
}
