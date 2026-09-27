// F-127/F-129: LMS — khóa, module, bài, ghi danh, tiến độ (mốc idempotent), quiz, chứng chỉ.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { chamQuiz, hoanThanhHopLe, khoaMoc, mocCanPhat, phanTramKhoa, type CauHoiQuiz } from "@/core/tien-do";
import { maChungChi } from "@/core/chung-chi";
import { congDiem } from "./diem";
import { ghiSuKien } from "./nhat-ky";

export type KhoaHoc = { id: string; ten: string; mo_ta: string; nguong_hoan_thanh: number; chong_tua_ao: boolean; trang_thai: string; so_bai: number; so_module: number };
export type BaiHoc = { id: string; module_hoc_id: string; ten: string; thu_tu: number; loai: "noi_dung" | "video" | "quiz"; noi_dung: string; video_url: string | null; thoi_luong_giay: number; cau_hoi: CauHoiQuiz[] };
export type ModuleHoc = { id: string; ten: string; thu_tu: number; bai: BaiHoc[] };

export async function danhSachKhoa(q: Truy, nguoiDungId: string): Promise<(KhoaHoc & { phan_tram: number | null; hoan_thanh_luc: string | null })[]> {
  return (await q.query<KhoaHoc & { phan_tram: number | null; hoan_thanh_luc: string | null }>(
    `select k.id, k.ten, k.mo_ta, k.nguong_hoan_thanh, k.chong_tua_ao, k.trang_thai,
            (select count(*) from bai_hoc b join module_hoc m on m.id = b.module_hoc_id where m.khoa_hoc_id = k.id)::int as so_bai,
            (select count(*) from module_hoc m where m.khoa_hoc_id = k.id)::int as so_module,
            g.phan_tram, g.hoan_thanh_luc::text
     from khoa_hoc k left join ghi_danh g on g.khoa_hoc_id = k.id and g.nguoi_dung_id = $1
     where k.trang_thai <> 'nhap' order by k.tao_luc`, [nguoiDungId])).rows;
}

export async function chiTietKhoa(q: Truy, khoaId: string): Promise<{ khoa: KhoaHoc; modules: ModuleHoc[] } | null> {
  const khoa = (await q.query<KhoaHoc>(
    `select k.id, k.ten, k.mo_ta, k.nguong_hoan_thanh, k.chong_tua_ao, k.trang_thai,
            (select count(*) from bai_hoc b join module_hoc m on m.id = b.module_hoc_id where m.khoa_hoc_id = k.id)::int as so_bai,
            (select count(*) from module_hoc m where m.khoa_hoc_id = k.id)::int as so_module
     from khoa_hoc k where k.id = $1`, [khoaId])).rows[0];
  if (!khoa) return null;
  const mods = (await q.query<{ id: string; ten: string; thu_tu: number }>("select id, ten, thu_tu from module_hoc where khoa_hoc_id = $1 order by thu_tu", [khoaId])).rows;
  const bai = (await q.query<BaiHoc>("select b.id, b.module_hoc_id, b.ten, b.thu_tu, b.loai, b.noi_dung, b.video_url, b.thoi_luong_giay, b.cau_hoi from bai_hoc b join module_hoc m on m.id = b.module_hoc_id where m.khoa_hoc_id = $1 order by m.thu_tu, b.thu_tu", [khoaId])).rows;
  return { khoa, modules: mods.map((m) => ({ ...m, bai: bai.filter((b) => b.module_hoc_id === m.id) })) };
}

export async function ghiDanh(q: Truy, o: { workspaceId: string; nguoiDungId: string; khoaId: string }): Promise<string> {
  const r = await q.query<{ id: string }>(
    "insert into ghi_danh(workspace_id, nguoi_dung_id, khoa_hoc_id) values ($1,$2,$3) on conflict (nguoi_dung_id, khoa_hoc_id) do update set nguoi_dung_id = excluded.nguoi_dung_id returning id",
    [o.workspaceId, o.nguoiDungId, o.khoaId]);
  return r.rows[0].id;
}

export async function tienDoCuaToi(q: Truy, nguoiDungId: string, khoaId: string): Promise<{ ghiDanhId: string | null; phanTram: number; baiXong: Set<string>; diemQuiz: Record<string, number>; hoanThanhLuc: string | null; chungChiMa: string | null }> {
  const g = (await q.query<{ id: string; phan_tram: number; hoan_thanh_luc: string | null }>("select id, phan_tram, hoan_thanh_luc::text from ghi_danh where nguoi_dung_id = $1 and khoa_hoc_id = $2", [nguoiDungId, khoaId])).rows[0];
  if (!g) return { ghiDanhId: null, phanTram: 0, baiXong: new Set(), diemQuiz: {}, hoanThanhLuc: null, chungChiMa: null };
  const td = (await q.query<{ bai_hoc_id: string; hoan_thanh_luc: string | null; diem_quiz: number | null }>("select bai_hoc_id, hoan_thanh_luc::text, diem_quiz from tien_do_bai where ghi_danh_id = $1", [g.id])).rows;
  const cc = (await q.query<{ ma: string }>("select ma from chung_chi where nguoi_dung_id = $1 and khoa_hoc_id = $2 and thu_hoi_luc is null", [nguoiDungId, khoaId])).rows[0];
  const diemQuiz: Record<string, number> = {};
  for (const t of td) if (t.diem_quiz != null) diemQuiz[t.bai_hoc_id] = t.diem_quiz;
  return { ghiDanhId: g.id, phanTram: g.phan_tram, baiXong: new Set(td.filter((t) => t.hoan_thanh_luc).map((t) => t.bai_hoc_id)), diemQuiz, hoanThanhLuc: g.hoan_thanh_luc, chungChiMa: cc?.ma ?? null };
}

/**
 * Ghi tiến độ một bài (nội dung/video: giây đã học; quiz: đáp án). Tính lại % khóa, phát mốc đúng một lần,
 * cộng điểm gamification, cấp chứng chỉ khi 100%. Trả kết quả cho UI.
 */
export async function ghiTienDoBai(q: Truy, o: { workspaceId: string; nguoiDungId: string; tenNguoi: string; khoaId: string; baiId: string; giayDaHoc?: number; traLoi?: number[]; muiGio?: string }):
Promise<{ hopLe: boolean; diemQuiz: number | null; phanTram: number; mocMoi: string[]; diemCong: number; chungChiMa: string | null; thongDiep: string }> {
  const ct = await chiTietKhoa(q, o.khoaId);
  if (!ct) throw new Error("Không tìm thấy khóa học");
  const bai = ct.modules.flatMap((m) => m.bai).find((b) => b.id === o.baiId);
  if (!bai) throw new Error("Không tìm thấy bài học");
  const ghiDanhId = await ghiDanh(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, khoaId: o.khoaId });
  let diemQuiz: number | null = null;
  if (bai.loai === "quiz") diemQuiz = chamQuiz(bai.cau_hoi, o.traLoi ?? []).diem;
  const cu = (await q.query<{ giay_da_hoc: number; hoan_thanh_luc: string | null; diem_quiz: number | null }>("select giay_da_hoc, hoan_thanh_luc::text, diem_quiz from tien_do_bai where ghi_danh_id = $1 and bai_hoc_id = $2", [ghiDanhId, o.baiId])).rows[0];
  const giay = Math.max(cu?.giay_da_hoc ?? 0, o.giayDaHoc ?? 0);
  const hopLe = hoanThanhHopLe({ loai: bai.loai, thoiLuongGiay: bai.thoi_luong_giay, giayDaHoc: giay, diemQuiz, chongTuaAo: ct.khoa.chong_tua_ao });
  const daXong = !!cu?.hoan_thanh_luc;
  const diemQuizLuu = bai.loai === "quiz" ? Math.max(cu?.diem_quiz ?? 0, diemQuiz ?? 0) : null;
  await q.query(
    `insert into tien_do_bai(workspace_id, ghi_danh_id, bai_hoc_id, giay_da_hoc, diem_quiz, hoan_thanh_luc) values ($1,$2,$3,$4,$5,$6)
     on conflict (ghi_danh_id, bai_hoc_id) do update set giay_da_hoc = excluded.giay_da_hoc, diem_quiz = excluded.diem_quiz, hoan_thanh_luc = coalesce(tien_do_bai.hoan_thanh_luc, excluded.hoan_thanh_luc)`,
    [o.workspaceId, ghiDanhId, o.baiId, giay, diemQuizLuu, hopLe ? new Date() : null]);
  let diemCong = 0;
  if (hopLe && !daXong) {
    diemCong += await congDiem(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, suKien: "hoan_thanh_bai", thamChieu: `bai:${o.baiId}`, muiGio: o.muiGio });
    if (bai.loai === "quiz") diemCong += await congDiem(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, suKien: "vuot_quiz", thamChieu: `quiz:${o.baiId}`, muiGio: o.muiGio });
  }
  // Tính lại % và mốc
  const xong = new Set((await q.query<{ bai_hoc_id: string }>("select bai_hoc_id from tien_do_bai where ghi_danh_id = $1 and hoan_thanh_luc is not null", [ghiDanhId])).rows.map((r) => r.bai_hoc_id));
  const tongBai = ct.modules.reduce((s, m) => s + m.bai.length, 0);
  const phanTram = phanTramKhoa(xong.size, tongBai);
  const modulesXong = ct.modules.filter((m) => m.bai.length > 0 && m.bai.every((b) => xong.has(b.id))).map((m) => m.id);
  const gd = (await q.query<{ moc_da_phat: string[] }>("select moc_da_phat from ghi_danh where id = $1", [ghiDanhId])).rows[0];
  const moc = mocCanPhat({ phanTram, nguong: ct.khoa.nguong_hoan_thanh, modulesXong, daPhat: gd.moc_da_phat });
  const mocMoi = moc.map(khoaMoc);
  let chungChiMa: string | null = null;
  for (const m of moc) {
    await ghiSuKien(q, { workspaceId: o.workspaceId, loai: "course_progress_milestone", nguoiDungId: o.nguoiDungId, payload: { khoa_hoc_id: o.khoaId, moc: m.moc, tham_chieu: m.thamChieu, phan_tram: phanTram } });
    if (m.moc === "hoan_thanh_khoa") {
      diemCong += await congDiem(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, suKien: "hoan_thanh_khoa", thamChieu: `khoa:${o.khoaId}`, muiGio: o.muiGio });
      chungChiMa = maChungChi(o.workspaceId, o.nguoiDungId, o.khoaId, new Date().getFullYear());
      await q.query("insert into chung_chi(workspace_id, nguoi_dung_id, khoa_hoc_id, ma, ten_nguoi, ten_khoa) values ($1,$2,$3,$4,$5,$6) on conflict (nguoi_dung_id, khoa_hoc_id) do nothing",
        [o.workspaceId, o.nguoiDungId, o.khoaId, chungChiMa, o.tenNguoi, ct.khoa.ten]);
    }
  }
  await q.query("update ghi_danh set phan_tram = $2::int, moc_da_phat = $3, hoc_cuoi_luc = now(), hoan_thanh_luc = case when $2::int >= 100 then coalesce(hoan_thanh_luc, now()) else hoan_thanh_luc end where id = $1",
    [ghiDanhId, phanTram, JSON.stringify([...gd.moc_da_phat, ...mocMoi])]);
  const thongDiep = bai.loai === "quiz"
    ? (hopLe ? `Đạt ${diemQuiz}% — vượt bài kiểm tra.` : `Đạt ${diemQuiz}% — cần ≥ 70% để qua, làm lại nhé.`)
    : (hopLe ? "Đã hoàn thành bài học." : `Cần học tối thiểu ${Math.ceil(bai.thoi_luong_giay * 0.6 / 60)} phút để tính hoàn thành.`);
  return { hopLe, diemQuiz, phanTram, mocMoi, diemCong, chungChiMa, thongDiep };
}

export async function thongKeHocVien(q: Truy): Promise<{ nguoi_dung_id: string; ten: string; khoa: string; phan_tram: number; hoc_cuoi_luc: string | null; hoan_thanh_luc: string | null; chung_chi: string | null }[]> {
  return (await q.query<{ nguoi_dung_id: string; ten: string; khoa: string; phan_tram: number; hoc_cuoi_luc: string | null; hoan_thanh_luc: string | null; chung_chi: string | null }>(
    `select g.nguoi_dung_id, n.ten, k.ten as khoa, g.phan_tram, g.hoc_cuoi_luc::text, g.hoan_thanh_luc::text, c.ma as chung_chi
     from ghi_danh g join nguoi_dung n on n.id = g.nguoi_dung_id join khoa_hoc k on k.id = g.khoa_hoc_id
     left join chung_chi c on c.nguoi_dung_id = g.nguoi_dung_id and c.khoa_hoc_id = g.khoa_hoc_id
     order by g.hoc_cuoi_luc desc nulls last`)).rows;
}

// ---- Soạn khóa học (quản lý) ----
export async function danhSachKhoaQuanLy(q: Truy): Promise<KhoaHoc[]> {
  return (await q.query<KhoaHoc>(`select k.id, k.ten, k.mo_ta, k.nguong_hoan_thanh, k.chong_tua_ao, k.trang_thai,
    (select count(*) from bai_hoc b join module_hoc m on m.id = b.module_hoc_id where m.khoa_hoc_id = k.id)::int as so_bai,
    (select count(*) from module_hoc m where m.khoa_hoc_id = k.id)::int as so_module from khoa_hoc k order by k.tao_luc`)).rows;
}
export async function luuKhoa(q: Truy, o: { workspaceId: string; id?: string; ten: string; moTa: string; nguong: number; chongTuaAo: boolean; trangThai: string }): Promise<string> {
  if (!o.ten.trim()) throw new Error("Tên khóa không được trống");
  const tt = ["nhap", "mo", "dong"].includes(o.trangThai) ? o.trangThai : "nhap";
  const ng = Math.min(100, Math.max(1, Math.round(o.nguong || 80)));
  if (o.id) { await q.query("update khoa_hoc set ten = $2, mo_ta = $3, nguong_hoan_thanh = $4, chong_tua_ao = $5, trang_thai = $6 where id = $1", [o.id, o.ten.trim().slice(0, 200), o.moTa.slice(0, 2000), ng, o.chongTuaAo, tt]); return o.id; }
  return (await q.query<{ id: string }>("insert into khoa_hoc(workspace_id, ten, mo_ta, nguong_hoan_thanh, chong_tua_ao, trang_thai) values ($1,$2,$3,$4,$5,$6) returning id", [o.workspaceId, o.ten.trim().slice(0, 200), o.moTa.slice(0, 2000), ng, o.chongTuaAo, tt])).rows[0].id;
}
export async function xoaKhoa(q: Truy, id: string) { await q.query("delete from khoa_hoc where id = $1", [id]); }
export async function luuModule(q: Truy, o: { workspaceId: string; khoaId: string; id?: string; ten: string }): Promise<string> {
  if (!o.ten.trim()) throw new Error("Tên module không được trống");
  if (o.id) { await q.query("update module_hoc set ten = $2 where id = $1", [o.id, o.ten.trim().slice(0, 200)]); return o.id; }
  const tt = (await q.query<{ n: number }>("select coalesce(max(thu_tu), -1) + 1 as n from module_hoc where khoa_hoc_id = $1", [o.khoaId])).rows[0].n;
  return (await q.query<{ id: string }>("insert into module_hoc(workspace_id, khoa_hoc_id, ten, thu_tu) values ($1,$2,$3,$4) returning id", [o.workspaceId, o.khoaId, o.ten.trim().slice(0, 200), tt])).rows[0].id;
}
export async function xoaModule(q: Truy, id: string) { await q.query("delete from module_hoc where id = $1", [id]); }
export async function luuBai(q: Truy, o: { workspaceId: string; moduleId: string; id?: string; ten: string; loai: string; noiDung: string; videoUrl: string; thoiLuongPhut: number; cauHoi: CauHoiQuiz[] }): Promise<string> {
  if (!o.ten.trim()) throw new Error("Tên bài không được trống");
  const loai = ["noi_dung", "video", "quiz"].includes(o.loai) ? o.loai : "noi_dung";
  if (loai === "quiz" && o.cauHoi.length === 0) throw new Error("Bài quiz cần ít nhất một câu hỏi");
  const giay = Math.max(0, Math.round((o.thoiLuongPhut || 0) * 60));
  const video = o.videoUrl.trim() && /^https:\/\//.test(o.videoUrl.trim()) ? o.videoUrl.trim().slice(0, 500) : null;
  const v = [o.ten.trim().slice(0, 200), loai, o.noiDung.slice(0, 50_000), video, giay, JSON.stringify(o.cauHoi.slice(0, 50))];
  if (o.id) { await q.query("update bai_hoc set ten = $2, loai = $3, noi_dung = $4, video_url = $5, thoi_luong_giay = $6, cau_hoi = $7 where id = $1", [o.id, ...v]); return o.id; }
  const tt = (await q.query<{ n: number }>("select coalesce(max(thu_tu), -1) + 1 as n from bai_hoc where module_hoc_id = $1", [o.moduleId])).rows[0].n;
  return (await q.query<{ id: string }>("insert into bai_hoc(workspace_id, module_hoc_id, ten, loai, noi_dung, video_url, thoi_luong_giay, cau_hoi, thu_tu) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id", [o.workspaceId, o.moduleId, ...v, tt])).rows[0].id;
}
export async function xoaBai(q: Truy, id: string) { await q.query("delete from bai_hoc where id = $1", [id]); }
/** Đổi thứ tự: dời lên/xuống một bậc trong cùng nhóm. */
export async function doiThuTu(q: Truy, o: { bang: "module_hoc" | "bai_hoc"; id: string; huong: "len" | "xuong" }) {
  const cot = o.bang === "module_hoc" ? "khoa_hoc_id" : "module_hoc_id";
  const cur = (await q.query<{ nhom: string; thu_tu: number }>(`select ${cot} as nhom, thu_tu from ${o.bang} where id = $1`, [o.id])).rows[0];
  if (!cur) return;
  const ke = (await q.query<{ id: string; thu_tu: number }>(`select id, thu_tu from ${o.bang} where ${cot} = $1 and thu_tu ${o.huong === "len" ? "<" : ">"} $2 order by thu_tu ${o.huong === "len" ? "desc" : "asc"} limit 1`, [cur.nhom, cur.thu_tu])).rows[0];
  if (!ke) return;
  await q.query(`update ${o.bang} set thu_tu = $2 where id = $1`, [o.id, ke.thu_tu]);
  await q.query(`update ${o.bang} set thu_tu = $2 where id = $1`, [ke.id, cur.thu_tu]);
}
/** Chuẩn hóa câu hỏi quiz từ văn bản: mỗi câu cách nhau dòng trống; dòng 1 = câu hỏi; các dòng sau = lựa chọn, đáp án đúng đánh dấu * ở đầu; dòng bắt đầu bằng > là giải thích. */
export function phanTichQuizVanBan(text: string): CauHoiQuiz[] {
  return text.split(/\n\s*\n/).map((khoi): CauHoiQuiz | null => {
    const dong = khoi.split("\n").map((d) => d.trim()).filter(Boolean);
    if (dong.length < 3) return null;
    const hoi = dong[0].replace(/^\d+[.)]\s*/, "");
    const giaiThich = dong.find((d) => d.startsWith(">"))?.slice(1).trim();
    const lua = dong.slice(1).filter((d) => !d.startsWith(">"));
    const dapAn = lua.findIndex((d) => d.startsWith("*"));
    if (dapAn < 0) return null;
    return { hoi, luaChon: lua.map((d) => d.replace(/^\*\s*/, "").replace(/^[a-dA-D][.)]\s*/, "")), dapAn, ...(giaiThich ? { giaiThich } : {}) };
  }).filter((c): c is CauHoiQuiz => !!c);
}
export function quizThanhVanBan(cau: CauHoiQuiz[]): string {
  return cau.map((c) => [c.hoi, ...c.luaChon.map((l, i) => (i === c.dapAn ? "* " : "") + l), ...(c.giaiThich ? ["> " + c.giaiThich] : [])].join("\n")).join("\n\n");
}

// ---- F-128 rớt học ----
export async function hocVienRuiRo(q: Truy, nguongNgay: number): Promise<{ nguoi_dung_id: string; ten: string; khoa: string; khoa_id: string; phan_tram: number; hoc_cuoi_luc: string | null; ngay_khong_hoc: number; bai_tiep: string | null }[]> {
  const rows = (await q.query<{ nguoi_dung_id: string; ten: string; khoa: string; khoa_id: string; phan_tram: number; hoc_cuoi_luc: string | null; bai_tiep: string | null }>(
    `select g.nguoi_dung_id, n.ten, k.ten as khoa, k.id as khoa_id, g.phan_tram, g.hoc_cuoi_luc::text,
       (select b.ten from bai_hoc b join module_hoc m on m.id = b.module_hoc_id where m.khoa_hoc_id = k.id and b.id not in (select bai_hoc_id from tien_do_bai t where t.ghi_danh_id = g.id and t.hoan_thanh_luc is not null) order by m.thu_tu, b.thu_tu limit 1) as bai_tiep
     from ghi_danh g join nguoi_dung n on n.id = g.nguoi_dung_id join khoa_hoc k on k.id = g.khoa_hoc_id
     where g.hoan_thanh_luc is null and n.hoat_dong and (g.hoc_cuoi_luc is null or g.hoc_cuoi_luc < now() - ($1 || ' days')::interval) order by g.hoc_cuoi_luc nulls first`, [String(nguongNgay)])).rows;
  return rows.map((r) => ({ ...r, ngay_khong_hoc: r.hoc_cuoi_luc ? Math.floor((Date.now() - new Date(r.hoc_cuoi_luc).getTime()) / 86_400_000) : 999 }));
}
