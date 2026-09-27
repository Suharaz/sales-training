import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { kiemTraAzure, kiemTraEleven } from "@/services/giong-noi";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const phien = await layPhien(); if (!phien || phien.vaiTro !== "quan_ly") return NextResponse.json({ loi: "Chỉ quản lý" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { nha?: string; key?: string; region?: string };
  const r = await voiWorkspace(phien.workspaceId, (q) => (b.nha === "azure" ? kiemTraAzure(q, b.key, b.region) : kiemTraEleven(q, b.key)));
  return NextResponse.json(r);
}
