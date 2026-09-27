// POST JSON: nạp transcript (từ ghi âm trực tiếp hoặc tích hợp) → phân tích ngay.
import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { napVaPhanTich, type CuocGoi } from "@/services/cuoc-goi";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(req: Request) {
  const phien = await layPhien();
  if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { transcript?: string; ten_khach?: string; san_pham_id?: string | null; ket_qua?: string; thoi_luong_giay?: number; nguoi_dung_id?: string };
  const saleId = phien.vaiTro === "quan_ly" && b.nguoi_dung_id ? b.nguoi_dung_id : phien.nguoiDungId;
  try {
    const r = await voiWorkspace(phien.workspaceId, async (q) => {
      const nd = (await q.query<{ ten: string }>("select ten from nguoi_dung where id = $1", [saleId])).rows[0];
      if (!nd) throw new Error("Không tìm thấy nhân viên");
      return napVaPhanTich(q, { workspaceId: phien.workspaceId, nguoiDungId: saleId, tenSale: nd.ten, sanPhamId: b.san_pham_id || null, tenKhach: String(b.ten_khach ?? ""), ketQua: (["thang", "thua", "hen", "khac"].includes(String(b.ket_qua)) ? String(b.ket_qua) : "khac") as CuocGoi["ket_qua"], transcript: String(b.transcript ?? ""), thoiLuongGiay: Number.isFinite(Number(b.thoi_luong_giay)) ? Math.round(Number(b.thoi_luong_giay)) : null, muiGio: phien.muiGio });
    });
    return NextResponse.json(r);
  } catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 400 }); }
}
