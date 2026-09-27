import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { ghiTienDoBai, chiTietKhoa } from "@/services/dao-tao";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const phien = await layPhien();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { khoa_id?: string; bai_id?: string; giay_da_hoc?: number; tra_loi?: number[] };
  if (!b.khoa_id || !b.bai_id) return NextResponse.json({ loi: "Thiếu tham số" }, { status: 400 });
  try {
    const r = await voiWorkspace(phien.workspaceId, async (q) => {
      const kq = await ghiTienDoBai(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, tenNguoi: phien.ten, khoaId: b.khoa_id!, baiId: b.bai_id!, giayDaHoc: Number(b.giay_da_hoc ?? 0), traLoi: Array.isArray(b.tra_loi) ? b.tra_loi.map(Number) : undefined, muiGio: phien.muiGio });
      // Trả đáp án đúng sau khi nộp quiz để hiện giải thích
      let dapAn: number[] | undefined;
      if (b.tra_loi) { const ct = await chiTietKhoa(q, b.khoa_id!); dapAn = ct?.modules.flatMap((m) => m.bai).find((x) => x.id === b.bai_id)?.cau_hoi.map((c) => c.dapAn); }
      return { ...kq, dapAn };
    });
    return NextResponse.json(r);
  } catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 400 }); }
}
