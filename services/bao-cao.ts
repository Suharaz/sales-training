// Báo cáo đào tạo đội nhóm theo kỳ (mockup #62 «Tạo báo cáo đào tạo đội nhóm») + xuất CSV.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { taoCsv } from "@/core/csv";
import { KY_NANG, TEN_KY_NANG, chuanHoaDiem, trungBinhKhung, type DiemKhung } from "@/core/khung-ky-nang";
export type DongBaoCao = { nguoi_dung_id: string; ten: string; chuc_danh: string; phien: number; diem_tb_phien: number | null; cuoc_goi: number; thang: number; diem_tb_goi: number | null; bai_xong: number; quiz_tb: number | null; diem_gamification: number; radar: DiemKhung | null };
export async function baoCaoDoi(q: Truy, ngay: number): Promise<{ dong: DongBaoCao[]; radarDoi: DiemKhung | null; tu: string }> {
  const rows = (await q.query<Omit<DongBaoCao, "radar"> & { cham: DiemKhung[] | null }>(
    `select n.id as nguoi_dung_id, n.ten, n.chuc_danh,
      (select count(*) from phien_luyen_tap p where p.nguoi_dung_id = n.id and p.trang_thai = 'xong' and p.ket_thuc_luc > now() - ($1 || ' days')::interval)::int as phien,
      (select round(avg(diem_tong)) from phien_luyen_tap p where p.nguoi_dung_id = n.id and p.trang_thai = 'xong' and p.ket_thuc_luc > now() - ($1 || ' days')::interval)::int as diem_tb_phien,
      (select count(*) from cuoc_goi c where c.nguoi_dung_id = n.id and c.trang_thai = 'xong' and c.goi_luc > now() - ($1 || ' days')::interval)::int as cuoc_goi,
      (select count(*) from cuoc_goi c where c.nguoi_dung_id = n.id and c.trang_thai = 'xong' and c.ket_qua = 'thang' and c.goi_luc > now() - ($1 || ' days')::interval)::int as thang,
      (select round(avg(diem_tong)) from cuoc_goi c where c.nguoi_dung_id = n.id and c.trang_thai = 'xong' and c.goi_luc > now() - ($1 || ' days')::interval)::int as diem_tb_goi,
      (select count(*) from tien_do_bai t join ghi_danh g on g.id = t.ghi_danh_id where g.nguoi_dung_id = n.id and t.hoan_thanh_luc > now() - ($1 || ' days')::interval)::int as bai_xong,
      (select round(avg(diem_quiz)) from tien_do_bai t join ghi_danh g on g.id = t.ghi_danh_id where g.nguoi_dung_id = n.id and t.diem_quiz is not null and t.hoan_thanh_luc > now() - ($1 || ' days')::interval)::int as quiz_tb,
      coalesce((select sum(diem) from diem_hoc d where d.nguoi_dung_id = n.id and d.luc > now() - ($1 || ' days')::interval), 0)::int as diem_gamification,
      (select array_agg(x) from (select ket_qua->'diem' as x from phien_luyen_tap p where p.nguoi_dung_id = n.id and p.trang_thai = 'xong' and p.ket_thuc_luc > now() - ($1 || ' days')::interval
                                 union all select phan_tich->'diem' from cuoc_goi c where c.nguoi_dung_id = n.id and c.trang_thai = 'xong' and c.goi_luc > now() - ($1 || ' days')::interval) t) as cham
     from nguoi_dung n where n.vai_tro = 'sale' and n.hoat_dong order by n.ten`, [String(ngay)])).rows;
  const dong: DongBaoCao[] = rows.map(({ cham, ...r }) => ({ ...r, radar: trungBinhKhung((cham ?? []).map((c) => chuanHoaDiem(c))) }));
  const radarDoi = trungBinhKhung(dong.filter((d) => d.radar).map((d) => d.radar!));
  return { dong, radarDoi, tu: new Date(Date.now() - ngay * 86_400_000).toISOString() };
}
export function csvBaoCao(dong: DongBaoCao[]): string {
  return taoCsv(["Nhân viên", "Chức danh", "Phiên role-play", "Điểm TB role-play", "Cuộc gọi", "Thắng", "Tỷ lệ thắng %", "Điểm TB cuộc gọi", "Bài học xong", "Quiz TB %", "Điểm gamification", ...KY_NANG.map((k) => TEN_KY_NANG[k])],
    dong.map((d) => [d.ten, d.chuc_danh, d.phien, d.diem_tb_phien ?? "", d.cuoc_goi, d.thang, d.cuoc_goi ? Math.round((d.thang / d.cuoc_goi) * 100) : "", d.diem_tb_goi ?? "", d.bai_xong, d.quiz_tb ?? "", d.diem_gamification, ...KY_NANG.map((k) => d.radar?.[k] ?? "")]));
}
