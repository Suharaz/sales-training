// F-114/F-038: kịch bản gọi theo sản phẩm + kho phản đối có duyệt + AI gợi ý câu trả lời chuẩn.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { goiYTraLoiSchema, type GoiYTraLoi } from "@/core/ai-kieu";
import { TEN_LOAI_PHAN_DOI, laLoaiPhanDoi, type LoaiPhanDoi } from "@/core/phan-doi";
import { goiAI } from "./ai-gateway";
import { ghiKiemToan } from "./nhat-ky";

export type SanPham = { id: string; ten: string; tang: number; gia: string; mo_ta: string; diem_ban_hang: string[]; doi_tuong: string; ket_qua_ky_vong: string; hinh_thuc: string; thoi_luong: string; chinh_sach: string; so_sanh_doi_thu: string; phan_doi_thuong_gap: string[]; tai_lieu_url: string | null; trang_thai: "dang_ban" | "ngung" };
export const TEN_TANG: Record<number, string> = { 0: "Tầng 0 · Miễn phí / lead magnet", 1: "Tầng 1 · Tripwire", 2: "Tầng 2 · Core", 3: "Tầng 3 · High-ticket", 4: "Tầng 4 · VIP / Đồng hành" };
export type KichBan = { id: string; san_pham_id: string | null; ten_san_pham: string | null; ten: string; mo_dau: string; khai_thac: string; gia_tri: string; chot: string; trang_thai: string; cap_nhat_luc: string };
export type PhanDoi = { id: string; loai: LoaiPhanDoi; noi_dung: string; cau_tra_loi_chuan: string; nguon: "thu_cong" | "ai_de_xuat"; trang_thai: "nhap" | "da_duyet" | "tu_choi"; cuoc_goi_id: string | null; so_lan_gap: number; tao_luc: string };

export async function danhSachSanPham(q: Truy): Promise<SanPham[]> {
  return (await q.query<SanPham>("select id, ten, tang, gia::text, mo_ta, diem_ban_hang, doi_tuong, ket_qua_ky_vong, hinh_thuc, thoi_luong, chinh_sach, so_sanh_doi_thu, phan_doi_thuong_gap, tai_lieu_url, trang_thai from san_pham order by trang_thai, tang, ten")).rows;
}
/** Mô tả sản phẩm đầy đủ cho prompt AI (role-play, phân tích, gợi ý). */
export function moTaSanPhamChoAI(sp: SanPham): string {
  return [`Sản phẩm: ${sp.ten} (${TEN_TANG[sp.tang] ?? "tầng " + sp.tang}) — giá ${Number(sp.gia).toLocaleString("vi-VN")}đ${sp.hinh_thuc ? `, hình thức: ${sp.hinh_thuc}` : ""}${sp.thoi_luong ? `, thời lượng: ${sp.thoi_luong}` : ""}.`, sp.mo_ta, sp.doi_tuong && `Dành cho: ${sp.doi_tuong}`, sp.ket_qua_ky_vong && `Kết quả kỳ vọng: ${sp.ket_qua_ky_vong}`, sp.diem_ban_hang.length && `Điểm bán hàng: ${sp.diem_ban_hang.join("; ")}`, sp.chinh_sach && `Chính sách: ${sp.chinh_sach}`, sp.so_sanh_doi_thu && `So với đối thủ: ${sp.so_sanh_doi_thu}`, sp.phan_doi_thuong_gap.length && `Phản đối thường gặp: ${sp.phan_doi_thuong_gap.join("; ")}`].filter(Boolean).join("\n").slice(0, 2500);
}
export async function danhSachKichBan(q: Truy): Promise<KichBan[]> {
  return (await q.query<KichBan>("select k.id, k.san_pham_id, s.ten as ten_san_pham, k.ten, k.mo_dau, k.khai_thac, k.gia_tri, k.chot, k.trang_thai, k.cap_nhat_luc::text from kich_ban k left join san_pham s on s.id = k.san_pham_id order by k.cap_nhat_luc desc")).rows;
}
export async function luuKichBan(q: Truy, o: { workspaceId: string; nguoiDungId: string; id?: string; sanPhamId: string | null; ten: string; moDau: string; khaiThac: string; giaTri: string; chot: string }): Promise<string> {
  if (!o.ten.trim()) throw new Error("Tên kịch bản không được trống");
  const v = [o.sanPhamId, o.ten.trim().slice(0, 200), o.moDau.slice(0, 5000), o.khaiThac.slice(0, 5000), o.giaTri.slice(0, 5000), o.chot.slice(0, 5000)];
  let id = o.id;
  if (id) await q.query("update kich_ban set san_pham_id = $2, ten = $3, mo_dau = $4, khai_thac = $5, gia_tri = $6, chot = $7, cap_nhat_luc = now() where id = $1", [id, ...v]);
  else id = (await q.query<{ id: string }>("insert into kich_ban(workspace_id, san_pham_id, ten, mo_dau, khai_thac, gia_tri, chot) values ($1,$2,$3,$4,$5,$6,$7) returning id", [o.workspaceId, ...v])).rows[0].id;
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: o.id ? "sua_kich_ban" : "tao_kich_ban", doiTuong: id });
  return id;
}
export async function xoaKichBan(q: Truy, o: { workspaceId: string; nguoiDungId: string; id: string }) {
  await q.query("delete from kich_ban where id = $1", [o.id]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "xoa_kich_ban", doiTuong: o.id });
}

export async function khoPhanDoi(q: Truy, o: { trangThai?: PhanDoi["trang_thai"] }): Promise<PhanDoi[]> {
  return (await q.query<PhanDoi>("select id, loai, noi_dung, cau_tra_loi_chuan, nguon, trang_thai, cuoc_goi_id, so_lan_gap, tao_luc::text from phan_doi where ($1::text is null or trang_thai = $1) order by trang_thai = 'nhap' desc, so_lan_gap desc, tao_luc desc", [o.trangThai ?? null])).rows;
}
export async function luuPhanDoi(q: Truy, o: { workspaceId: string; nguoiDungId: string; id?: string; loai: string; noiDung: string; cauTraLoi: string }): Promise<string> {
  if (!laLoaiPhanDoi(o.loai)) throw new Error("Loại phản đối không hợp lệ");
  if (!o.noiDung.trim()) throw new Error("Nội dung phản đối trống");
  let id = o.id;
  if (id) await q.query("update phan_doi set loai = $2, noi_dung = $3, cau_tra_loi_chuan = $4 where id = $1", [id, o.loai, o.noiDung.trim().slice(0, 500), o.cauTraLoi.slice(0, 2000)]);
  else id = (await q.query<{ id: string }>("insert into phan_doi(workspace_id, loai, noi_dung, cau_tra_loi_chuan, nguon, trang_thai) values ($1,$2,$3,$4,'thu_cong','da_duyet') returning id", [o.workspaceId, o.loai, o.noiDung.trim().slice(0, 500), o.cauTraLoi.slice(0, 2000)])).rows[0].id;
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: o.id ? "sua_phan_doi" : "them_phan_doi", doiTuong: id });
  return id;
}
/** Duyệt / từ chối đề xuất AI: chỉ hiệu lực sau duyệt (F-116 tiêu chí). */
export async function duyetPhanDoi(q: Truy, o: { workspaceId: string; nguoiDungId: string; id: string; trangThai: "da_duyet" | "tu_choi"; cauTraLoi?: string }) {
  await q.query("update phan_doi set trang_thai = $2, cau_tra_loi_chuan = coalesce($3, cau_tra_loi_chuan) where id = $1", [o.id, o.trangThai, o.cauTraLoi?.slice(0, 2000) ?? null]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: `duyet_phan_doi_${o.trangThai}`, doiTuong: o.id });
}
export async function xoaPhanDoi(q: Truy, o: { workspaceId: string; nguoiDungId: string; id: string }) {
  await q.query("delete from phan_doi where id = $1", [o.id]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "xoa_phan_doi", doiTuong: o.id });
}

export async function goiYCauTraLoi(q: Truy, o: { workspaceId: string; loai: string; noiDung: string; sanPhamId?: string | null }): Promise<{ goiY: GoiYTraLoi; cheDo: string }> {
  const sp = o.sanPhamId ? (await danhSachSanPham(q)).find((x) => x.id === o.sanPhamId) ?? null : null;
  const loai = laLoaiPhanDoi(o.loai) ? o.loai : "khac";
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "goi_y_tra_loi", schema: goiYTraLoiSchema, timeoutMs: 60_000,
    prompt: `Viết CÂU TRẢ LỜI CHUẨN (3–5 câu, nói được qua điện thoại) cho phản đối loại «${TEN_LOAI_PHAN_DOI[loai]}»: «${o.noiDung}».
${sp ? moTaSanPhamChoAI(sp) : ""}
Cấu trúc: ghi nhận cảm xúc → làm rõ bằng một câu hỏi → nêu giá trị gắn nhu cầu → kiểm tra lại. Không hứa kết quả, không bịa số liệu. ly_do: 1–2 câu giải thích vì sao cách này hiệu quả.`,
    cauTrucJson: `{"cau_tra_loi":"string","ly_do":"string"}`,
    duPhong: () => ({ cau_tra_loi: "Dạ em hiểu, anh/chị lo về điểm này là rất hợp lý. Cho em hỏi thêm một chút: điều anh/chị quan tâm nhất là gì ạ? Với khách hàng có tình huống tương tự, cách bên em làm là … và họ thấy rõ lợi ích ở … Anh/chị thấy hướng đó có phù hợp không ạ?", ly_do: "(Chế độ dự phòng) Khung 4 bước: ghi nhận, làm rõ, giá trị, kiểm tra lại." }),
  });
  return { goiY: kq.duLieu, cheDo: kq.cheDo };
}

export async function luuSanPham(q: Truy, o: { workspaceId: string; nguoiDungId: string; id?: string; ten: string; tang: number; gia: number; moTa: string; diemBanHang: string[]; doiTuong?: string; ketQuaKyVong?: string; hinhThuc?: string; thoiLuong?: string; chinhSach?: string; soSanhDoiThu?: string; phanDoiThuongGap?: string[]; taiLieuUrl?: string; trangThai?: string }): Promise<string> {
  if (!o.ten.trim()) throw new Error("Tên sản phẩm không được trống");
  const tang = Math.min(4, Math.max(0, Math.round(o.tang || 0)));
  const gia = Math.max(0, Math.round(o.gia || 0));
  const mang = (a?: string[]) => JSON.stringify((a ?? []).map((d) => d.trim()).filter(Boolean).slice(0, 15));
  const url = (o.taiLieuUrl ?? "").trim(); if (url && !/^https?:\/\//.test(url)) throw new Error("Link tài liệu phải bắt đầu bằng http(s)://");
  const tt = o.trangThai === "ngung" ? "ngung" : "dang_ban";
  const v = [o.ten.trim().slice(0, 200), tang, gia, o.moTa.slice(0, 3000), mang(o.diemBanHang), (o.doiTuong ?? "").slice(0, 1000), (o.ketQuaKyVong ?? "").slice(0, 1000), (o.hinhThuc ?? "").slice(0, 200), (o.thoiLuong ?? "").slice(0, 200), (o.chinhSach ?? "").slice(0, 1500), (o.soSanhDoiThu ?? "").slice(0, 1500), mang(o.phanDoiThuongGap), url.slice(0, 500) || null, tt];
  let id = o.id;
  if (id) await q.query("update san_pham set ten = $2, tang = $3, gia = $4, mo_ta = $5, diem_ban_hang = $6, doi_tuong = $7, ket_qua_ky_vong = $8, hinh_thuc = $9, thoi_luong = $10, chinh_sach = $11, so_sanh_doi_thu = $12, phan_doi_thuong_gap = $13, tai_lieu_url = $14, trang_thai = $15 where id = $1", [id, ...v]);
  else id = (await q.query<{ id: string }>("insert into san_pham(workspace_id, ten, tang, gia, mo_ta, diem_ban_hang, doi_tuong, ket_qua_ky_vong, hinh_thuc, thoi_luong, chinh_sach, so_sanh_doi_thu, phan_doi_thuong_gap, tai_lieu_url, trang_thai) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id", [o.workspaceId, ...v])).rows[0].id;
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: o.id ? "sua_san_pham" : "them_san_pham", doiTuong: id });
  return id;
}
export async function xoaSanPham(q: Truy, o: { workspaceId: string; nguoiDungId: string; id: string }) {
  await q.query("delete from san_pham where id = $1", [o.id]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "xoa_san_pham", doiTuong: o.id });
}
