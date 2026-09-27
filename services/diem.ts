// F-129: sổ điểm (chỉ INSERT) với giới hạn chống lạm dụng theo ngày; streak; bảng xếp hạng ẩn danh.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { DIEM_SU_KIEN, GIOI_HAN_NGAY, ngayTheoMuiGio, tenBangXepHang, tinhChuoiNgay, xepHang, type SuKienDiem } from "@/core/gamification";

/** Cộng điểm nếu chưa vượt giới hạn ngày; trả số điểm thực cộng (0 nếu bị chặn). */
export async function congDiem(q: Truy, o: { workspaceId: string; nguoiDungId: string; suKien: SuKienDiem; thamChieu?: string; muiGio?: string }): Promise<number> {
  const ngay = ngayTheoMuiGio(new Date(), o.muiGio);
  if (o.thamChieu) {
    const trung = await q.query("select 1 from diem_hoc where nguoi_dung_id = $1 and su_kien = $2 and tham_chieu = $3 limit 1", [o.nguoiDungId, o.suKien, o.thamChieu]);
    if (trung.rowCount) return 0; // cùng tham chiếu chỉ cộng một lần (học lại bài cũ không cộng)
  }
  const dem = await q.query<{ n: string }>("select count(*)::text as n from diem_hoc where nguoi_dung_id = $1 and su_kien = $2 and ngay = $3", [o.nguoiDungId, o.suKien, ngay]);
  if (Number(dem.rows[0].n) >= GIOI_HAN_NGAY[o.suKien]) return 0;
  const diem = DIEM_SU_KIEN[o.suKien];
  await q.query("insert into diem_hoc(workspace_id, nguoi_dung_id, su_kien, diem, ngay, tham_chieu) values ($1,$2,$3,$4,$5,$6)", [o.workspaceId, o.nguoiDungId, o.suKien, diem, ngay, o.thamChieu ?? null]);
  return diem;
}

export type HangBxh = { nguoiDungId: string; ten: string; diem: number; chuoi: number; hang: string; laToi: boolean; phienLuyenTap: number; diemTb: number | null };
export async function bangXepHang(q: Truy, o: { nguoiXemId: string; muiGio?: string; gioiHan?: number }): Promise<HangBxh[]> {
  const homNay = ngayTheoMuiGio(new Date(), o.muiGio);
  const rows = (await q.query<{ id: string; ten: string; an_danh_bxh: boolean; diem: string; ngay: string[] | null; so_phien: string; diem_tb: string | null }>(
    `select n.id, n.ten, n.an_danh_bxh,
            coalesce((select sum(diem) from diem_hoc d where d.nguoi_dung_id = n.id), 0)::text as diem,
            (select array_agg(distinct to_char(ngay, 'YYYY-MM-DD')) from diem_hoc d where d.nguoi_dung_id = n.id) as ngay,
            (select count(*) from phien_luyen_tap p where p.nguoi_dung_id = n.id and p.trang_thai = 'xong')::text as so_phien,
            (select round(avg(diem_tong)) from phien_luyen_tap p where p.nguoi_dung_id = n.id and p.trang_thai = 'xong')::text as diem_tb
     from nguoi_dung n where n.hoat_dong and n.vai_tro = 'sale' order by 4 desc, n.ten limit $1`, [o.gioiHan ?? 50])).rows;
  return rows.map((r) => ({
    nguoiDungId: r.id, ten: tenBangXepHang(r.ten, r.an_danh_bxh && r.id !== o.nguoiXemId, r.id), diem: Number(r.diem),
    chuoi: tinhChuoiNgay(r.ngay ?? [], homNay), hang: xepHang(Number(r.diem)), laToi: r.id === o.nguoiXemId,
    phienLuyenTap: Number(r.so_phien), diemTb: r.diem_tb ? Number(r.diem_tb) : null,
  })).sort((a, b) => b.diem - a.diem);
}

export async function diemCuaToi(q: Truy, nguoiDungId: string, muiGio?: string): Promise<{ diem: number; chuoi: number; hang: string; lichSu: { su_kien: string; diem: number; luc: string }[] }> {
  const homNay = ngayTheoMuiGio(new Date(), muiGio);
  const tong = (await q.query<{ diem: string | null; ngay: string[] | null }>("select sum(diem)::text as diem, array_agg(distinct to_char(ngay,'YYYY-MM-DD')) as ngay from diem_hoc where nguoi_dung_id = $1", [nguoiDungId])).rows[0];
  const lichSu = (await q.query<{ su_kien: string; diem: number; luc: string }>("select su_kien, diem, luc::text from diem_hoc where nguoi_dung_id = $1 order by luc desc limit 20", [nguoiDungId])).rows;
  const diem = Number(tong?.diem ?? 0);
  return { diem, chuoi: tinhChuoiNgay(tong?.ngay ?? [], homNay), hang: xepHang(diem), lichSu };
}
