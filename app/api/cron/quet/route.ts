// Vòng quét ngày (Vercel Cron 19:00 UTC = 02:00 VN): F-128 học viên rớt học → sự kiện learner_inactive (mỗi ghi danh mỗi ngày một lần);
// F-117 nhiệm vụ quá hạn → sự kiện task_overdue. Bảo vệ bằng CRON_SECRET (Vercel tự gửi Authorization: Bearer).
import { NextResponse } from "next/server";
import { poolChu } from "@/db/ket-noi";
import { voiWorkspace } from "@/services/workspace-guard";
import { hocVienRuiRo } from "@/services/dao-tao";
import { ghiSuKien } from "@/services/nhat-ky";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (bi && req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không có quyền" }, { status: 401 });
  const p = poolChu();
  await p.query("select set_config('app.nen_tang','1',false)");
  const ws = (await p.query<{ id: string; nguong_rot_hoc_ngay: number }>("select id, nguong_rot_hoc_ngay from workspace")).rows;
  await p.query("select set_config('app.nen_tang','',false)");
  const kq: Record<string, { rot_hoc: number; qua_han: number }> = {};
  for (const w of ws) {
    kq[w.id] = await voiWorkspace(w.id, async (q) => {
      const rui = await hocVienRuiRo(q, w.nguong_rot_hoc_ngay);
      let rot = 0;
      for (const r of rui) {
        const da = await q.query("select 1 from su_kien where loai = 'learner_inactive' and nguoi_dung_id = $1 and payload->>'khoa_id' = $2 and luc > now() - interval '1 day' limit 1", [r.nguoi_dung_id, r.khoa_id]);
        if (da.rowCount) continue;
        await ghiSuKien(q, { workspaceId: w.id, loai: "learner_inactive", nguoiDungId: r.nguoi_dung_id, payload: { khoa_id: r.khoa_id, khoa: r.khoa, ngay_khong_hoc: r.ngay_khong_hoc, bai_tiep: r.bai_tiep, phan_tram: r.phan_tram } });
        rot++;
      }
      const quaHan = (await q.query<{ id: string; nguoi_dung_id: string; noi_dung: string }>("select id, nguoi_dung_id, noi_dung from nhiem_vu where trang_thai = 'mo' and han < now() and id not in (select (payload->>'nhiem_vu_id')::uuid from su_kien where loai = 'task_overdue' and luc > now() - interval '1 day' and payload ? 'nhiem_vu_id')")).rows;
      for (const n of quaHan) await ghiSuKien(q, { workspaceId: w.id, loai: "task_overdue", nguoiDungId: n.nguoi_dung_id, payload: { nhiem_vu_id: n.id, noi_dung: n.noi_dung } });
      return { rot_hoc: rot, qua_han: quaHan.length };
    });
  }
  return NextResponse.json({ ok: true, luc: new Date().toISOString(), workspace: kq });
}
