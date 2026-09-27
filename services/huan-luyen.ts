// F-116: radar kỹ năng (từ role-play + cuộc gọi), ma trận đội, thư viện đoạn mẫu (duyệt), gói huấn luyện cá nhân AI.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { KY_NANG, TEN_KY_NANG, chuanHoaDiem, diemTong, trungBinhKhung, xepTheoDiem, type DiemKhung } from "@/core/khung-ky-nang";
import { goiHuanLuyenSchema, type GoiHuanLuyen } from "@/core/ai-kieu";
import { goiHuanLuyenMau } from "@/core/du-phong-ai";
import { TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
import { goiAI } from "./ai-gateway";

export type HoSoKyNang = { nguoiDungId: string; ten: string; chucDanh: string; radar: DiemKhung | null; diemTb: number | null; soPhien: number; soCuocGoi: number; tyLeThang: number | null; xuHuong: number[]; diemTuan: number | null; diemTuanTruoc: number | null };

/** Radar cá nhân = trung bình các bản chấm (role-play xong + cuộc gọi đã phân tích) trong 90 ngày. */
export async function hoSoKyNang(q: Truy, nguoiDungId: string): Promise<HoSoKyNang | null> {
  const nd = (await q.query<{ id: string; ten: string; chuc_danh: string }>("select id, ten, chuc_danh from nguoi_dung where id = $1", [nguoiDungId])).rows[0];
  if (!nd) return null;
  const cham = (await q.query<{ diem: DiemKhung; tong: number; luc: string }>(
    `select ket_qua->'diem' as diem, diem_tong as tong, ket_thuc_luc::text as luc from phien_luyen_tap where nguoi_dung_id = $1 and trang_thai = 'xong' and ket_thuc_luc > now() - interval '90 days'
     union all
     select phan_tich->'diem', diem_tong, goi_luc::text from cuoc_goi where nguoi_dung_id = $1 and trang_thai = 'xong' and goi_luc > now() - interval '90 days'
     order by luc`, [nguoiDungId])).rows;
  const ds = cham.map((c) => chuanHoaDiem(c.diem));
  const radar = trungBinhKhung(ds);
  const goi = (await q.query<{ so: string; thang: string }>("select count(*)::text as so, count(*) filter (where ket_qua = 'thang')::text as thang from cuoc_goi where nguoi_dung_id = $1 and trang_thai = 'xong'", [nguoiDungId])).rows[0];
  const soPhien = (await q.query<{ so: string }>("select count(*)::text as so from phien_luyen_tap where nguoi_dung_id = $1 and trang_thai = 'xong'", [nguoiDungId])).rows[0];
  const tuan = cham.filter((c) => Date.parse(c.luc) > Date.now() - 7 * 86_400_000), tuanTruoc = cham.filter((c) => { const t = Date.parse(c.luc); return t <= Date.now() - 7 * 86_400_000 && t > Date.now() - 14 * 86_400_000; });
  const tb = (xs: { tong: number }[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x.tong, 0) / xs.length) : null);
  return {
    nguoiDungId: nd.id, ten: nd.ten, chucDanh: nd.chuc_danh, radar, diemTb: radar ? diemTong(radar) : null,
    soPhien: Number(soPhien.so), soCuocGoi: Number(goi.so), tyLeThang: Number(goi.so) ? Math.round((Number(goi.thang) / Number(goi.so)) * 100) : null,
    xuHuong: cham.slice(-10).map((c) => c.tong), diemTuan: tb(tuan), diemTuanTruoc: tb(tuanTruoc),
  };
}

export async function maTranDoi(q: Truy): Promise<{ hoSo: HoSoKyNang[]; radarDoi: DiemKhung | null; top20: DiemKhung | null }> {
  const ids = (await q.query<{ id: string }>("select id from nguoi_dung where vai_tro = 'sale' and hoat_dong order by ten")).rows;
  const hoSo = (await Promise.all(ids.map((r) => hoSoKyNang(q, r.id)))).filter((h): h is HoSoKyNang => !!h);
  const coRadar = hoSo.filter((h) => h.radar);
  const radarDoi = trungBinhKhung(coRadar.map((h) => h.radar!));
  const top = [...coRadar].sort((a, b) => (b.diemTb ?? 0) - (a.diemTb ?? 0)).slice(0, Math.max(1, Math.ceil(coRadar.length * 0.2)));
  return { hoSo: hoSo.sort((a, b) => (b.diemTb ?? -1) - (a.diemTb ?? -1)), radarDoi, top20: trungBinhKhung(top.map((h) => h.radar!)) };
}

/** Insight đội: phản đối thua phổ biến, tiêu chí yếu nhất toàn đội. */
export async function insightDoi(q: Truy): Promise<{ phanDoiThua: { loai: string; ten: string; so: number }[]; tieuChiYeu: { ky_nang: string; ten: string; diem: number } | null; soCuocGoi: number; soPhien: number; diemTb: number | null; tyLeThang: number | null }> {
  const pd = (await q.query<{ loai: string; so: string }>(
    `select x.loai, count(*)::text as so from cuoc_goi c, jsonb_to_recordset(c.phan_tich->'phan_doi_phat_hien') as x(loai text)
     where c.trang_thai = 'xong' and c.ket_qua = 'thua' group by x.loai order by 2 desc limit 3`)).rows;
  const { radarDoi } = await maTranDoi(q);
  const tong = (await q.query<{ goi: string; thang: string; phien: string; tb: string | null }>(
    `select (select count(*) from cuoc_goi where trang_thai = 'xong')::text as goi,
            (select count(*) from cuoc_goi where trang_thai = 'xong' and ket_qua = 'thang')::text as thang,
            (select count(*) from phien_luyen_tap where trang_thai = 'xong')::text as phien,
            (select round(avg(diem_tong)) from (select diem_tong from phien_luyen_tap where trang_thai = 'xong' union all select diem_tong from cuoc_goi where trang_thai = 'xong') t)::text as tb`)).rows[0];
  const yeu = radarDoi ? xepTheoDiem(radarDoi)[0] : null;
  return {
    phanDoiThua: pd.map((p) => ({ loai: p.loai, ten: TEN_LOAI_PHAN_DOI[p.loai as keyof typeof TEN_LOAI_PHAN_DOI] ?? p.loai, so: Number(p.so) })),
    tieuChiYeu: yeu && radarDoi ? { ky_nang: yeu, ten: TEN_KY_NANG[yeu], diem: radarDoi[yeu] } : null,
    soCuocGoi: Number(tong.goi), soPhien: Number(tong.phien), diemTb: tong.tb ? Number(tong.tb) : null,
    tyLeThang: Number(tong.goi) ? Math.round((Number(tong.thang) / Number(tong.goi)) * 100) : null,
  };
}

export type DoanMau = { id: string; cuoc_goi_id: string | null; loai_phan_doi: string; noi_dung: string; trang_thai: "nhap" | "da_duyet" | "tu_choi"; tao_luc: string; ten_sale: string | null };
export async function thuVienDoanMau(q: Truy, o: { trangThai?: DoanMau["trang_thai"]; loai?: string }): Promise<DoanMau[]> {
  return (await q.query<DoanMau>(`select d.id, d.cuoc_goi_id, d.loai_phan_doi, d.noi_dung, d.trang_thai, d.tao_luc::text, n.ten as ten_sale
    from doan_mau d left join cuoc_goi c on c.id = d.cuoc_goi_id left join nguoi_dung n on n.id = c.nguoi_dung_id
    where ($1::text is null or d.trang_thai = $1) and ($2::text is null or d.loai_phan_doi = $2) order by d.tao_luc desc limit 200`, [o.trangThai ?? null, o.loai ?? null])).rows;
}
export async function duyetDoanMau(q: Truy, o: { id: string; trangThai: "da_duyet" | "tu_choi" }) {
  await q.query("update doan_mau set trang_thai = $2 where id = $1", [o.id, o.trangThai]);
}

export async function goiHuanLuyenMoiNhat(q: Truy, nguoiDungId: string): Promise<{ id: string; radar: DiemKhung; noi_dung: GoiHuanLuyen; che_do_ai: string | null; tao_luc: string } | null> {
  return (await q.query<{ id: string; radar: DiemKhung; noi_dung: GoiHuanLuyen; che_do_ai: string | null; tao_luc: string }>("select id, radar, noi_dung, che_do_ai, tao_luc::text from goi_huan_luyen where nguoi_dung_id = $1 order by tao_luc desc limit 1", [nguoiDungId])).rows[0] ?? null;
}

/** Sinh gói huấn luyện cá nhân từ radar + điểm yếu + phản đối hay gặp + bài học có sẵn. */
export async function sinhGoiHuanLuyen(q: Truy, o: { workspaceId: string; nguoiDungId: string }): Promise<{ noiDung: GoiHuanLuyen; cheDo: string }> {
  const hs = await hoSoKyNang(q, o.nguoiDungId);
  if (!hs) throw new Error("Không tìm thấy nhân viên");
  const radar = hs.radar ?? chuanHoaDiem({ khai_thac: 50, lang_nghe: 50, gia_tri: 50, phan_doi: 50, chot: 50, tuan_thu: 80 });
  const baiHoc = (await q.query<{ ten: string; module: string }>("select b.ten, m.ten as module from bai_hoc b join module_hoc m on m.id = b.module_hoc_id join khoa_hoc k on k.id = m.khoa_hoc_id where k.trang_thai = 'mo' order by m.thu_tu, b.thu_tu limit 40")).rows;
  const nhanXet = (await q.query<{ can: string[] }>("select coalesce(array_agg(x), '{}') as can from (select jsonb_array_elements_text(ket_qua->'can_cai_thien') as x from phien_luyen_tap where nguoi_dung_id = $1 and trang_thai = 'xong' order by ket_thuc_luc desc limit 5) t", [o.nguoiDungId])).rows[0];
  const pdKho = (await q.query<{ loai: string; so: string }>("select x.loai, count(*)::text as so from cuoc_goi c, jsonb_to_recordset(c.phan_tich->'phan_doi_phat_hien') as x(loai text) where c.nguoi_dung_id = $1 and c.trang_thai = 'xong' group by x.loai order by 2 desc limit 3", [o.nguoiDungId])).rows;
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "goi_huan_luyen", schema: goiHuanLuyenSchema, timeoutMs: 150_000,
    prompt: `Sinh GÓI HUẤN LUYỆN CÁ NHÂN cho nhân viên sale ${hs.ten} (${hs.chucDanh || "sale"}).
Radar 6 tiêu chí (0–100): ${KY_NANG.map((k) => `${k}=${radar[k]}`).join(", ")}. Điểm TB ${hs.diemTb ?? "chưa có"}, ${hs.soPhien} phiên role-play, ${hs.soCuocGoi} cuộc gọi, tỷ lệ thắng ${hs.tyLeThang ?? "?"}%.
Nhận xét gần đây từ AI chấm: ${(nhanXet?.can ?? []).join(" | ") || "(chưa có)"}.
Phản đối hay gặp trong cuộc gọi: ${pdKho.map((p) => `${p.loai} (${p.so})`).join(", ") || "(chưa có)"}.
Bài học có trong hệ thống (chỉ đề xuất từ danh sách này, tieu_de ghi đúng tên bài): ${baiHoc.map((b) => `«${b.ten}» (${b.module})`).join("; ") || "(chưa có)"}.
Yêu cầu: diem_yeu 1–3 mã tiêu chí yếu nhất; bai_de_xuat 2–4 bài; bai_tap 2–3 tình huống role-play cụ thể (loai_phan_doi hợp lệ: gia, thoi_gian, niem_tin, nhu_cau, quyet_dinh, doi_thu, khac) với muc_tieu đo được; loi_khuyen 3 câu ngắn, hành động được ngay.`,
    cauTrucJson: `{"tom_tat":"string","diem_yeu":["phan_doi"],"bai_de_xuat":[{"tieu_de":"string","ly_do":"string"}],"bai_tap":[{"ten":"string","tinh_huong":"string","loai_phan_doi":"gia","muc_tieu":"string"}],"loi_khuyen":["string"]}`,
    duPhong: () => goiHuanLuyenMau(radar, hs.ten),
  });
  await q.query("insert into goi_huan_luyen(workspace_id, nguoi_dung_id, radar, noi_dung, che_do_ai) values ($1,$2,$3,$4,$5)", [o.workspaceId, o.nguoiDungId, JSON.stringify(radar), JSON.stringify(kq.duLieu), kq.cheDo]);
  return { noiDung: kq.duLieu, cheDo: kq.cheDo };
}
