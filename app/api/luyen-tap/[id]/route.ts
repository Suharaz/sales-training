// POST {hanh_dong: 'luot', tin_nhan} | {hanh_dong: 'ket_thuc'} | {hanh_dong: 'huy'}
import { NextResponse } from "next/server";
import { layPhien as layPhienDangNhap } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { guiLuot, ketThucPhien, huyPhien, khachMoLoi } from "@/services/luyen-tap";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const phien = await layPhienDangNhap();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { hanh_dong?: string; tin_nhan?: string };
  try {
    if (body.hanh_dong === "luot") {
      const r = await voiWorkspace(phien.workspaceId, (q) => guiLuot(q, { workspaceId: phien.workspaceId, phienId: id, nguoiDungId: phien.nguoiDungId, tinNhan: String(body.tin_nhan ?? "") }));
      return NextResponse.json(r);
    }
    if (body.hanh_dong === "ket_thuc") {
      const r = await voiWorkspace(phien.workspaceId, (q) => ketThucPhien(q, { workspaceId: phien.workspaceId, phienId: id, nguoiDungId: phien.nguoiDungId, muiGio: phien.muiGio }));
      return NextResponse.json(r);
    }
    if (body.hanh_dong === "mo_loi") {
      const r = await voiWorkspace(phien.workspaceId, (q) => khachMoLoi(q, { workspaceId: phien.workspaceId, phienId: id, nguoiDungId: phien.nguoiDungId }));
      return NextResponse.json(r);
    }
    if (body.hanh_dong === "huy") {
      await voiWorkspace(phien.workspaceId, (q) => huyPhien(q, { phienId: id, nguoiDungId: phien.nguoiDungId }));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ loi: "Hành động không hợp lệ" }, { status: 400 });
  } catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 400 }); }
}
