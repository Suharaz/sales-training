// POST {san_pham_id, nhom} → sinh kịch bản DISC một nhóm (client gọi lần lượt 4 nhóm để hiện tiến độ).
import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { sinhKichBanDisc } from "@/services/disc";
import { laNhomDisc, type NhomDisc } from "@/core/disc";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
export async function POST(req: Request) {
  const phien = await layPhien(); if (!phien || phien.vaiTro !== "quan_ly") return NextResponse.json({ loi: "Chỉ quản lý" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { san_pham_id?: string; nhom?: string };
  if (!b.san_pham_id || !laNhomDisc(b.nhom)) return NextResponse.json({ loi: "Thiếu sản phẩm hoặc nhóm" }, { status: 400 });
  const nhom = b.nhom as NhomDisc;
  try { const r = await voiWorkspace(phien.workspaceId, (q) => sinhKichBanDisc(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, sanPhamId: b.san_pham_id!, nhom })); return NextResponse.json({ ok: true, cheDo: r.cheDo }); }
  catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 400 }); }
}
