// F-115: nạp transcript → AI tóm tắt 4 phần, chấm khung, phản đối mới (nháp chờ duyệt), đoạn hay (nháp), nhiệm vụ từ cam kết (F-117).
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { KY_NANG, TEN_KY_NANG, MO_TA_KY_NANG, chuanHoaDiem, diemTong } from "@/core/khung-ky-nang";
import { phanTichCuocGoiSchema, type LuotHoiThoai, type PhanTichCuocGoi } from "@/core/ai-kieu";
import { phanTichCuocGoiMau, tachTranscript } from "@/core/du-phong-ai";
import { goiAI } from "./ai-gateway";
import { danhSachSanPham, moTaSanPhamChoAI } from "./kich-ban";
import { NHOM_DISC, doanDisc, tomTatDisc, type NhomDisc } from "@/core/disc";
import { congDiem } from "./diem";
import { ghiKiemToan, ghiSuKien } from "./nhat-ky";

export type CuocGoi = { id: string; nguoi_dung_id: string; ten_sale: string; san_pham_id: string | null; ten_san_pham: string | null; ten_khach: string; disc: NhomDisc | null; disc_tin_cay: number | null; goi_luc: string; thoi_luong_giay: number | null; ket_qua: "thang" | "thua" | "hen" | "khac"; transcript: string; luot: LuotHoiThoai[]; phan_tich: PhanTichCuocGoi | null; diem_tong: number | null; trang_thai: "cho" | "xong" | "loi"; che_do_ai: string | null; loi: string | null; tao_luc: string };
export const TEN_KET_QUA: Record<CuocGoi["ket_qua"], string> = { thang: "Thắng", thua: "Thua", hen: "Hẹn lại", khac: "Khác" };

const SELECT = `select c.id, c.nguoi_dung_id, n.ten as ten_sale, c.san_pham_id, s.ten as ten_san_pham, c.ten_khach, c.disc, c.disc_tin_cay, c.goi_luc::text, c.thoi_luong_giay, c.ket_qua, c.transcript, c.luot, c.phan_tich, c.diem_tong, c.trang_thai, c.che_do_ai, c.loi, c.tao_luc::text
  from cuoc_goi c join nguoi_dung n on n.id = c.nguoi_dung_id left join san_pham s on s.id = c.san_pham_id`;

export async function danhSachCuocGoi(q: Truy, o: { nguoiDungId?: string; gioiHan?: number }): Promise<CuocGoi[]> {
  return (await q.query<CuocGoi>(`${SELECT} ${o.nguoiDungId ? "where c.nguoi_dung_id = $2" : ""} order by c.goi_luc desc limit $1`, o.nguoiDungId ? [o.gioiHan ?? 100, o.nguoiDungId] : [o.gioiHan ?? 100])).rows;
}
export async function layCuocGoi(q: Truy, id: string): Promise<CuocGoi | null> {
  return (await q.query<CuocGoi>(`${SELECT} where c.id = $1`, [id])).rows[0] ?? null;
}

/** Nạp cuộc gọi và phân tích ngay (đồng bộ; AI ~20–60 giây ở chế độ cli). */
export async function napVaPhanTich(q: Truy, o: { workspaceId: string; nguoiDungId: string; tenSale: string; sanPhamId: string | null; tenKhach: string; ketQua: CuocGoi["ket_qua"]; transcript: string; thoiLuongGiay: number | null; goiLuc?: Date; muiGio?: string }): Promise<{ id: string; cheDo: string; diemTong: number; phanDoiMoi: number; nhiemVu: number }> {
  const transcript = o.transcript.trim().slice(0, 60_000);
  const luot = tachTranscript(transcript, o.tenSale);
  if (luot.filter((l) => l.vai === "sale").length < 1 || luot.filter((l) => l.vai === "khach").length < 1) {
    throw new Error("Transcript cần có ít nhất một lượt của sale và một lượt của khách theo dạng «Tên: nội dung» mỗi dòng.");
  }
  const r = await q.query<{ id: string }>("insert into cuoc_goi(workspace_id, nguoi_dung_id, san_pham_id, ten_khach, goi_luc, thoi_luong_giay, ket_qua, transcript, luot) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id",
    [o.workspaceId, o.nguoiDungId, o.sanPhamId, o.tenKhach.slice(0, 120), o.goiLuc ?? new Date(), o.thoiLuongGiay, o.ketQua, transcript, JSON.stringify(luot)]);
  const id = r.rows[0].id;
  const kq = await phanTichCuocGoi(q, { workspaceId: o.workspaceId, cuocGoiId: id, luot, tenSale: o.tenSale, ketQua: o.ketQua, sanPhamId: o.sanPhamId });
  await congDiem(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, suKien: "cuoc_goi_phan_tich", thamChieu: `goi:${id}`, muiGio: o.muiGio });
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "nap_cuoc_goi", doiTuong: id, chiTiet: { ket_qua: o.ketQua, che_do: kq.cheDo } });
  return { id, ...kq };
}

export async function phanTichCuocGoi(q: Truy, o: { workspaceId: string; cuocGoiId: string; luot: LuotHoiThoai[]; tenSale: string; ketQua: string; sanPhamId?: string | null }): Promise<{ cheDo: string; diemTong: number; phanDoiMoi: number; nhiemVu: number }> {
  const spCtx = o.sanPhamId ? (await danhSachSanPham(q)).find((x) => x.id === o.sanPhamId) : null;
  const kho = (await q.query<{ loai: string; noi_dung: string; cau_tra_loi_chuan: string }>("select loai, noi_dung, cau_tra_loi_chuan from phan_doi where trang_thai = 'da_duyet' order by so_lan_gap desc limit 15")).rows;
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "phan_tich_cuoc_goi", schema: phanTichCuocGoiSchema, timeoutMs: 180_000,
    prompt: `Phân tích cuộc gọi bán hàng dưới đây (sale: ${o.tenSale}; kết quả sale ghi: ${o.ketQua}).
${spCtx ? moTaSanPhamChoAI(spCtx) : ""}
1) tom_tat 4 phần: nhu_cau (khách cần gì), phan_doi (khách phản đối gì), cam_ket (mỗi bên hứa gì, kèm hạn nếu có, ben = sale|khach), buoc_tiep (bước tiếp theo đã chốt).
2) diem theo KHUNG 6 TIÊU CHÍ 0–100:
${KY_NANG.map((k) => `- ${k} (${TEN_KY_NANG[k]}): ${MO_TA_KY_NANG[k]}`).join("\n")}
3) vi_du_theo_ky_nang: mỗi tiêu chí một trích dẫn ngắn từ transcript (kèm số lượt).
4) phan_doi_phat_hien: từng phản đối khách nêu (loai ∈ gia, thoi_gian, niem_tin, nhu_cau, quyet_dinh, doi_thu, khac), sale đã trả lời thế nào, và câu trả lời tốt hơn (bám kho chuẩn nếu có).
5) doan_hay: các đoạn sale xử lý phản đối THỰC SỰ tốt (đáng đưa vào thư viện mẫu), trích nguyên văn, ẩn tên khách bằng «anh/chị».
6) ty_le_sale_noi (% chữ của sale), so_cau_hoi_sale, cam_xuc_khach (-1..1), rui_ro_tuan_thu (câu hứa kết quả, bịa số, nói xấu đối thủ).
7) disc: nhận diện nhóm tính cách DISC của KHÁCH qua cách nói (nhom D/I/S/C, tin_cay 0–100, ly_do 1–2 câu dẫn chứng từ transcript, goi_y_lan_sau: 2 câu sale nên đổi cách nói cho nhóm này). Không đủ dấu hiệu → null.
Tham khảo: ${NHOM_DISC.map((n) => tomTatDisc(n).slice(0, 220)).join(" || ")}
KHO PHẢN ĐỐI CHUẨN: ${kho.map((k) => `[${k.loai}] ${k.noi_dung} → ${k.cau_tra_loi_chuan}`).join(" | ") || "(chưa có)"}
TRANSCRIPT:
${o.luot.map((l, i) => `${i + 1}. ${l.vai === "sale" ? "SALE" : "KHÁCH"}: ${l.noi_dung}`).join("\n")}`,
    cauTrucJson: `{"tom_tat":{"nhu_cau":["string"],"phan_doi":["string"],"cam_ket":[{"noi_dung":"string","ben":"sale","han":"string|null"}],"buoc_tiep":"string"},"diem":{"khai_thac":0,"lang_nghe":0,"gia_tri":0,"phan_doi":0,"chot":0,"tuan_thu":0},"vi_du_theo_ky_nang":[{"ky_nang":"khai_thac","vi_du":"string"}],"phan_doi_phat_hien":[{"loai":"gia","noi_dung":"string","sale_tra_loi":"string","de_xuat_cau_tra_loi":"string"}],"doan_hay":[{"loai_phan_doi":"gia","trich_doan":"string"}],"ty_le_sale_noi":50,"so_cau_hoi_sale":0,"cam_xuc_khach":0,"rui_ro_tuan_thu":["string"],"disc":{"nhom":"D","tin_cay":0,"ly_do":"string","goi_y_lan_sau":"string"}}`,
    duPhong: () => { const d = doanDisc(o.luot.filter((l) => l.vai === "khach").map((l) => l.noi_dung)); return { ...phanTichCuocGoiMau(o.luot), disc: d ? { nhom: d.nhom, tin_cay: d.tinCay, ly_do: "Đoán theo từ khóa (chế độ dự phòng).", goi_y_lan_sau: "" } : null }; },
  });
  const pt: PhanTichCuocGoi = { ...kq.duLieu, diem: chuanHoaDiem(kq.duLieu.diem) };
  const tong = diemTong(pt.diem);
  await q.query("update cuoc_goi set phan_tich = $2, diem_tong = $3, trang_thai = 'xong', che_do_ai = $4, loi = $5, disc = $6, disc_tin_cay = $7 where id = $1", [o.cuocGoiId, JSON.stringify(pt), tong, kq.cheDo, kq.loi ?? null, pt.disc?.nhom ?? null, pt.disc?.tin_cay ?? null]);
  const cg = (await q.query<{ nguoi_dung_id: string }>("select nguoi_dung_id from cuoc_goi where id = $1", [o.cuocGoiId])).rows[0];
  // Phản đối mới → kho (trạng thái nháp, chờ quản lý duyệt — quy ước 4)
  let phanDoiMoi = 0;
  for (const pd of pt.phan_doi_phat_hien) {
    const co = await q.query("select id from phan_doi where loai = $1 and trang_thai = 'da_duyet' limit 1", [pd.loai]);
    if (co.rowCount) { await q.query("update phan_doi set so_lan_gap = so_lan_gap + 1 where id = $1", [co.rows[0].id]); continue; }
    await q.query("insert into phan_doi(workspace_id, loai, noi_dung, cau_tra_loi_chuan, nguon, trang_thai, cuoc_goi_id) values ($1,$2,$3,$4,'ai_de_xuat','nhap',$5)", [o.workspaceId, pd.loai, pd.noi_dung.slice(0, 500), pd.de_xuat_cau_tra_loi.slice(0, 1000), o.cuocGoiId]);
    phanDoiMoi++;
  }
  for (const d of pt.doan_hay) await q.query("insert into doan_mau(workspace_id, cuoc_goi_id, loai_phan_doi, noi_dung) values ($1,$2,$3,$4)", [o.workspaceId, o.cuocGoiId, d.loai_phan_doi, d.trich_doan.slice(0, 2000)]);
  // Nhiệm vụ từ cam kết của sale (F-117): hạn mặc định +2 ngày làm việc nếu AI không trích được
  let nhiemVu = 0;
  for (const ck of pt.tom_tat.cam_ket.filter((c) => c.ben === "sale")) {
    const han = ck.han && !Number.isNaN(Date.parse(ck.han)) ? new Date(ck.han) : new Date(Date.now() + 2 * 86_400_000);
    await q.query("insert into nhiem_vu(workspace_id, nguoi_dung_id, cuoc_goi_id, noi_dung, han) values ($1,$2,$3,$4,$5)", [o.workspaceId, cg.nguoi_dung_id, o.cuocGoiId, ck.noi_dung.slice(0, 500), han]);
    nhiemVu++;
  }
  await ghiSuKien(q, { workspaceId: o.workspaceId, loai: "call_analyzed", nguoiDungId: cg.nguoi_dung_id, payload: { cuoc_goi_id: o.cuocGoiId, diem_tong: tong, che_do: kq.cheDo, phan_doi_moi: phanDoiMoi } });
  return { cheDo: kq.cheDo, diemTong: tong, phanDoiMoi, nhiemVu };
}

export type NhiemVu = { id: string; nguoi_dung_id: string; ten_sale: string; cuoc_goi_id: string | null; ten_khach: string | null; noi_dung: string; han: string | null; trang_thai: "mo" | "xong" | "huy"; ly_do_huy: string | null; tao_luc: string; loai: "cam_ket" | "bai_tap" | "viec"; lien_ket: string | null; ten_nguoi_giao: string | null };
export async function danhSachNhiemVu(q: Truy, o: { nguoiDungId?: string }): Promise<NhiemVu[]> {
  return (await q.query<NhiemVu>(`select v.id, v.nguoi_dung_id, n.ten as ten_sale, v.cuoc_goi_id, c.ten_khach, v.noi_dung, v.han::text, v.trang_thai, v.ly_do_huy, v.tao_luc::text, v.loai, v.lien_ket, g.ten as ten_nguoi_giao
    from nhiem_vu v join nguoi_dung n on n.id = v.nguoi_dung_id left join cuoc_goi c on c.id = v.cuoc_goi_id left join nguoi_dung g on g.id = v.nguoi_giao_id ${o.nguoiDungId ? "where v.nguoi_dung_id = $1" : ""} order by v.trang_thai = 'mo' desc, v.han nulls last limit 200`, o.nguoiDungId ? [o.nguoiDungId] : [])).rows;
}
export async function capNhatNhiemVu(q: Truy, o: { id: string; nguoiDungId: string; vaiTro: string; trangThai: "xong" | "huy"; lyDo?: string }) {
  if (o.trangThai === "huy" && !o.lyDo?.trim()) throw new Error("Hủy nhiệm vụ bắt buộc ghi lý do.");
  await q.query(`update nhiem_vu set trang_thai = $2, ly_do_huy = $3 where id = $1 and trang_thai = 'mo' and ($4 = 'quan_ly' or nguoi_dung_id = $5)`, [o.id, o.trangThai, o.lyDo ?? null, o.vaiTro, o.nguoiDungId]);
}

export async function giaoNhiemVu(q: Truy, o: { workspaceId: string; nguoiGiaoId: string; nguoiDungId: string; noiDung: string; han: Date | null; loai: "bai_tap" | "viec"; lienKet?: string | null }): Promise<string> {
  if (!o.noiDung.trim()) throw new Error("Nội dung nhiệm vụ trống");
  const id = (await q.query<{ id: string }>("insert into nhiem_vu(workspace_id, nguoi_dung_id, noi_dung, han, loai, lien_ket, nguoi_giao_id) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [o.workspaceId, o.nguoiDungId, o.noiDung.trim().slice(0, 500), o.han, o.loai, o.lienKet?.slice(0, 300) ?? null, o.nguoiGiaoId])).rows[0].id;
  await ghiSuKien(q, { workspaceId: o.workspaceId, loai: "task_assigned", nguoiDungId: o.nguoiDungId, payload: { nhiem_vu_id: id, loai: o.loai, nguoi_giao: o.nguoiGiaoId } });
  return id;
}
