import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { tokenAzure } from "@/services/giong-noi";
export const dynamic = "force-dynamic";
export async function GET() {
  const phien = await layPhien(); if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const t = await voiWorkspace(phien.workspaceId, (q) => tokenAzure(q));
  if (!t) return NextResponse.json({ loi: "Workspace chưa cấu hình Azure Speech" }, { status: 404 });
  return NextResponse.json(t, { headers: { "cache-control": "no-store" } });
}
