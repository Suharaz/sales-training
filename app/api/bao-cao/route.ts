import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { baoCaoDoi, csvBaoCao } from "@/services/bao-cao";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const phien = await layPhien();
  if (!phien || phien.vaiTro !== "quan_ly") return NextResponse.json({ loi: "Chỉ quản lý" }, { status: 403 });
  const ngay = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("ngay") ?? 30) || 30));
  const { dong } = await voiWorkspace(phien.workspaceId, (q) => baoCaoDoi(q, ngay));
  return new NextResponse(csvBaoCao(dong), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bao-cao-dao-tao-${ngay}-ngay.csv"` } });
}
