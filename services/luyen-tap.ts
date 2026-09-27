// Role-play với AI đóng vai khách (mockup #62 «Tạo Role-play»): tạo phiên → từng lượt → kết thúc và chấm 6 tiêu chí.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { KY_NANG, TEN_KY_NANG, MO_TA_KY_NANG, chuanHoaDiem, diemTong } from "@/core/khung-ky-nang";
import { TEN_LOAI_PHAN_DOI, type LoaiPhanDoi } from "@/core/phan-doi";
import { ketQuaLuyenTapSchema, luotKhachSchema, personaSchema, TEN_DO_KHO, type DoKho, type KetQuaLuyenTap, type LuotHoiThoai, type LuotKhach, type Persona } from "@/core/ai-kieu";
import { chamLuyenTapMau, khachTraLoiMau, sinhPersonaMau } from "@/core/du-phong-ai";
import { goiAI } from "./ai-gateway";
import { danhSachSanPham, moTaSanPhamChoAI } from "./kich-ban";
import { DISC, NHOM_DISC, laNhomDisc, tomTatDisc, type NhomDisc } from "@/core/disc";
import { kichBanDiscChoAI } from "./disc";
import { congDiem } from "./diem";
import { ghiKiemToan, ghiSuKien } from "./nhat-ky";

export type PhienLuyenTap = { id: string; nguoi_dung_id: string; ten_sale: string; san_pham_id: string | null; ten_san_pham: string | null; do_kho: DoKho; disc: NhomDisc | null; persona: Persona; lich_su: LuotHoiThoai[]; trang_thai: "dang" | "xong" | "huy"; ket_qua: KetQuaLuyenTap | null; diem_tong: number | null; che_do_ai: string | null; tao_luc: string; ket_thuc_luc: string | null };

const SELECT = `select p.id, p.nguoi_dung_id, n.ten as ten_sale, p.san_pham_id, s.ten as ten_san_pham, p.do_kho, p.disc, p.persona, p.lich_su, p.trang_thai, p.ket_qua, p.diem_tong, p.che_do_ai, p.tao_luc::text, p.ket_thuc_luc::text
  from phien_luyen_tap p join nguoi_dung n on n.id = p.nguoi_dung_id left join san_pham s on s.id = p.san_pham_id`;

export async function danhSachPhien(q: Truy, o: { nguoiDungId?: string; gioiHan?: number }): Promise<PhienLuyenTap[]> {
  return (await q.query<PhienLuyenTap>(`${SELECT} ${o.nguoiDungId ? "where p.nguoi_dung_id = $2" : ""} order by p.tao_luc desc limit $1`, o.nguoiDungId ? [o.gioiHan ?? 50, o.nguoiDungId] : [o.gioiHan ?? 50])).rows;
}
export async function layPhien(q: Truy, id: string): Promise<PhienLuyenTap | null> {
  return (await q.query<PhienLuyenTap>(`${SELECT} where p.id = $1`, [id])).rows[0] ?? null;
}

async function nguCanhSanPham(q: Truy, sanPhamId: string | null): Promise<string> {
  if (!sanPhamId) return "Sản phẩm: (chưa chọn — sale tự giới thiệu giải pháp của doanh nghiệp theo DNA).";
  const sp = (await danhSachSanPham(q)).find((x) => x.id === sanPhamId);
  return sp ? moTaSanPhamChoAI(sp) : "";
}

export async function taoPhien(q: Truy, o: { workspaceId: string; nguoiDungId: string; sanPhamId: string | null; doKho: DoKho; phanDoiUuTien: LoaiPhanDoi[]; disc?: string | null }): Promise<{ id: string; cheDo: string }> {
  const sp = await nguCanhSanPham(q, o.sanPhamId);
  const so = o.doKho === "de" ? 1 : o.doKho === "vua" ? 2 : 3;
  const hat = Math.floor(Math.random() * 1000);
  const disc: NhomDisc = laNhomDisc(o.disc) ? o.disc : NHOM_DISC[hat % 4];
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "sinh_persona", schema: personaSchema,
    prompt: `Hãy tạo MỘT khách hàng tiềm năng giả lập (persona) cho buổi luyện tập bán hàng qua điện thoại.
${sp}
Độ khó: ${TEN_DO_KHO[o.doKho]}. Khách phải có đúng ${so} phản đối chính${o.phanDoiUuTien.length ? `, ưu tiên các loại: ${o.phanDoiUuTien.map((l) => TEN_LOAI_PHAN_DOI[l]).join(", ")}` : ""}.
Mã loại phản đối hợp lệ: gia, thoi_gian, niem_tin, nhu_cau, quyet_dinh, doi_thu. Persona phải là doanh nghiệp/cá nhân Việt Nam thực tế, hạt ngẫu nhiên ${hat}.
TÍNH CÁCH DISC của khách: ${tomTatDisc(disc)} → trường tinh_cach phải mô tả đúng nhóm này (cách nói, tốc độ, điều họ quan tâm), disc = "${disc}".`,
    cauTrucJson: `{"ten":"string","chuc_danh":"string","cong_ty":"string","boi_canh":"string (2 câu)","muc_tieu":"string","noi_dau":"string","ngan_sach":"string","tinh_cach":"string","phan_doi_chinh":["gia"],"disc":"${disc}"}`,
    duPhong: () => ({ ...sinhPersonaMau(o.doKho, hat, o.phanDoiUuTien), disc, tinh_cach: DISC[disc].mo_ta }),
  });
  kq.duLieu.disc = disc;
  const r = await q.query<{ id: string }>("insert into phien_luyen_tap(workspace_id, nguoi_dung_id, san_pham_id, do_kho, persona, che_do_ai, disc) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [o.workspaceId, o.nguoiDungId, o.sanPhamId, o.doKho, JSON.stringify(kq.duLieu), kq.cheDo, disc]);
  await ghiSuKien(q, { workspaceId: o.workspaceId, loai: "roleplay_started", nguoiDungId: o.nguoiDungId, payload: { phien_id: r.rows[0].id, do_kho: o.doKho } });
  return { id: r.rows[0].id, cheDo: kq.cheDo };
}

function dungLichSu(lichSu: LuotHoiThoai[]): string {
  return lichSu.map((l, i) => `${i + 1}. ${l.vai === "sale" ? "SALE" : "KHÁCH"}: ${l.noi_dung}`).join("\n");
}

/** Sale gửi một lượt; AI (hoặc khách mẫu) trả lời; lưu cả hai vào lịch sử. */
export async function guiLuot(q: Truy, o: { workspaceId: string; phienId: string; nguoiDungId: string; tinNhan: string }): Promise<{ khach: LuotKhach; cheDo: string; lichSu: LuotHoiThoai[] }> {
  const p = await layPhien(q, o.phienId);
  if (!p || p.nguoi_dung_id !== o.nguoiDungId) throw new Error("Không tìm thấy phiên");
  if (p.trang_thai !== "dang") throw new Error("Phiên đã kết thúc");
  const tin = o.tinNhan.trim().slice(0, 2000);
  if (!tin) throw new Error("Tin nhắn trống");
  const sp = await nguCanhSanPham(q, p.san_pham_id);
  const soLuotSale = p.lich_su.filter((l) => l.vai === "sale").length + 1;
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "khach_tra_loi", schema: luotKhachSchema, timeoutMs: 90_000,
    prompt: `Bạn ĐÓNG VAI KHÁCH HÀNG trong buổi luyện tập bán hàng. Tuyệt đối không đóng vai sale, không nhận xét, không dạy.
HỒ SƠ KHÁCH (bạn): ${JSON.stringify(p.persona)}
${p.disc ? `TÍNH CÁCH DISC (diễn đúng nhịp và mối quan tâm của nhóm này): ${tomTatDisc(p.disc)}` : ""}
${sp}
Quy tắc diễn: nói tự nhiên như người Việt qua điện thoại, 1–3 câu mỗi lượt. Lần lượt nêu các phản đối trong phan_doi_chinh khi hợp ngữ cảnh; nếu sale trả lời hời hợt (không ghi nhận, không có bằng chứng/giá trị) thì giữ nguyên phản đối và đẩy lại. Nếu sale xử lý tốt tất cả phản đối và đề xuất bước tiếp theo rõ ràng thì đồng ý và đặt ket_thuc=true. Sau lượt sale thứ 10 thì kết thúc dù thế nào (ket_thuc=true, nêu lý do ngắn).
LỊCH SỬ:
${dungLichSu(p.lich_su)}
${soLuotSale}. SALE: ${tin}
Hãy trả lời lượt tiếp theo của KHÁCH.`,
    cauTrucJson: `{"noi_dung":"string","cam_xuc":"tich_cuc|trung_tinh|tieu_cuc","phan_doi_dang_neu":"gia|thoi_gian|niem_tin|nhu_cau|quyet_dinh|doi_thu|khac|null","san_sang_chot":0,"ket_thuc":false}`,
    duPhong: () => khachTraLoiMau(p.persona, p.lich_su, tin),
  });
  const khach = kq.duLieu;
  const luc = new Date().toISOString();
  const lichSu: LuotHoiThoai[] = [...p.lich_su, { vai: "sale", noi_dung: tin, luc }, { vai: "khach", noi_dung: khach.noi_dung, luc }];
  await q.query("update phien_luyen_tap set lich_su = $2 where id = $1", [o.phienId, JSON.stringify(lichSu)]);
  return { khach, cheDo: kq.cheDo, lichSu };
}

/** Kết thúc phiên: AI chấm 6 tiêu chí + nhận xét theo lượt; cộng điểm gamification. */
export async function ketThucPhien(q: Truy, o: { workspaceId: string; phienId: string; nguoiDungId: string; muiGio?: string }): Promise<{ ketQua: KetQuaLuyenTap; diemTong: number; cheDo: string; diemCong: number }> {
  const p = await layPhien(q, o.phienId);
  if (!p || p.nguoi_dung_id !== o.nguoiDungId) throw new Error("Không tìm thấy phiên");
  if (p.trang_thai === "xong" && p.ket_qua) return { ketQua: p.ket_qua, diemTong: p.diem_tong ?? diemTong(p.ket_qua.diem), cheDo: p.che_do_ai ?? "", diemCong: 0 };
  if (p.lich_su.filter((l) => l.vai === "sale").length < 2) throw new Error("Cần ít nhất 2 lượt nói của sale để chấm");
  const kho = (await q.query<{ loai: string; noi_dung: string; cau_tra_loi_chuan: string }>("select loai, noi_dung, cau_tra_loi_chuan from phan_doi where trang_thai = 'da_duyet' order by so_lan_gap desc limit 12")).rows;
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "cham_luyen_tap", schema: ketQuaLuyenTapSchema, timeoutMs: 150_000,
    prompt: `Chấm điểm buổi role-play bán hàng dưới đây theo KHUNG 6 TIÊU CHÍ (0–100 mỗi tiêu chí):
${KY_NANG.map((k) => `- ${k} (${TEN_KY_NANG[k]}): ${MO_TA_KY_NANG[k]}`).join("\n")}
Tuân thủ: trừ nặng nếu sale hứa kết quả chắc chắn, bịa số liệu, nói xấu đối thủ.
KHO PHẢN ĐỐI CHUẨN của doanh nghiệp (dùng để so sánh cách sale xử lý):
${kho.map((k) => `- [${k.loai}] ${k.noi_dung} → chuẩn: ${k.cau_tra_loi_chuan}`).join("\n") || "(chưa có)"}
HỒ SƠ KHÁCH: ${JSON.stringify(p.persona)}
${p.disc ? `KHÁCH THUỘC NHÓM DISC ${p.disc}: ${tomTatDisc(p.disc)}\n${await kichBanDiscChoAI(q, p.san_pham_id, p.disc)}\nChấm thêm phu_hop_disc (0–100): sale có nói đúng kiểu nhóm này không (nhịp, bằng chứng, kiểu chốt), kèm nhận xét 2 câu.` : ""}
HỘI THOẠI:
${dungLichSu(p.lich_su)}
Yêu cầu: nhan_xet_chung 3–4 câu; diem_manh 2–3 ý; can_cai_thien 2–3 ý cụ thể; goi_y_theo_luot chọn 2–4 lượt SALE yếu nhất (số lượt là số thứ tự trong hội thoại) kèm câu nói tốt hơn; phan_doi_da_gap liệt kê từng phản đối khách nêu và sale xử lý tốt hay chưa.`,
    cauTrucJson: `{"diem":{"khai_thac":0,"lang_nghe":0,"gia_tri":0,"phan_doi":0,"chot":0,"tuan_thu":0},"nhan_xet_chung":"string","diem_manh":["string"],"can_cai_thien":["string"],"goi_y_theo_luot":[{"luot":1,"van_de":"string","cau_tot_hon":"string"}],"phan_doi_da_gap":[{"loai":"gia","xu_ly_tot":true,"ghi_chu":"string"}]${p.disc ? ',"phu_hop_disc":{"diem":0,"nhan_xet":"string"}' : ""}}`,
    duPhong: () => chamLuyenTapMau(p.lich_su),
  });
  const ketQua = { ...kq.duLieu, diem: chuanHoaDiem(kq.duLieu.diem) };
  const tong = diemTong(ketQua.diem);
  await q.query("update phien_luyen_tap set trang_thai = 'xong', ket_qua = $2, diem_tong = $3, che_do_ai = $4, ket_thuc_luc = now() where id = $1", [o.phienId, JSON.stringify(ketQua), tong, kq.cheDo]);
  let diemCong = await congDiem(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, suKien: "luyen_tap_xong", thamChieu: `phien:${o.phienId}`, muiGio: o.muiGio });
  if (tong >= 80) diemCong += await congDiem(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, suKien: "luyen_tap_diem_cao", thamChieu: `phien-cao:${o.phienId}`, muiGio: o.muiGio });
  // Đếm số lần gặp cho kho phản đối (không tự thêm phản đối mới từ role-play — chỉ cuộc gọi thật F-115)
  for (const pd of ketQua.phan_doi_da_gap) await q.query("update phan_doi set so_lan_gap = so_lan_gap + 1 where id = (select id from phan_doi where loai = $1 and trang_thai = 'da_duyet' order by so_lan_gap desc limit 1)", [pd.loai]);
  await ghiSuKien(q, { workspaceId: o.workspaceId, loai: "roleplay_completed", nguoiDungId: o.nguoiDungId, payload: { phien_id: o.phienId, diem_tong: tong, che_do: kq.cheDo } });
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "ket_thuc_luyen_tap", doiTuong: o.phienId, chiTiet: { diem_tong: tong } });
  return { ketQua, diemTong: tong, cheDo: kq.cheDo, diemCong };
}

export async function huyPhien(q: Truy, o: { phienId: string; nguoiDungId: string }) {
  await q.query("update phien_luyen_tap set trang_thai = 'huy', ket_thuc_luc = now() where id = $1 and nguoi_dung_id = $2 and trang_thai = 'dang'", [o.phienId, o.nguoiDungId]);
}

/** Nhấc máy: khách nói câu đầu tiên («Alô…») khi hội thoại còn trống — dùng cho chế độ gọi điện. */
export async function khachMoLoi(q: Truy, o: { workspaceId: string; phienId: string; nguoiDungId: string }): Promise<{ khach: LuotKhach; lichSu: LuotHoiThoai[]; cheDo: string }> {
  const p = await layPhien(q, o.phienId);
  if (!p || p.nguoi_dung_id !== o.nguoiDungId) throw new Error("Không tìm thấy phiên");
  if (p.trang_thai !== "dang") throw new Error("Phiên đã kết thúc");
  if (p.lich_su.length > 0) { const cuoi = [...p.lich_su].reverse().find((l) => l.vai === "khach"); return { khach: { noi_dung: cuoi?.noi_dung ?? "", cam_xuc: "trung_tinh", phan_doi_dang_neu: null, san_sang_chot: 20, ket_thuc: false }, lichSu: p.lich_su, cheDo: "co_san" }; }
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "khach_tra_loi", schema: luotKhachSchema, timeoutMs: 60_000,
    prompt: `Bạn ĐÓNG VAI KHÁCH HÀNG vừa nhấc máy nghe một cuộc gọi lạ. HỒ SƠ KHÁCH (bạn): ${JSON.stringify(p.persona)}
${p.disc ? `TÍNH CÁCH DISC: ${tomTatDisc(p.disc)}` : ""}
Nói câu đầu tiên khi nhấc máy, 1 câu ngắn tự nhiên đúng tính cách (ví dụ «Alô, ai đấy ạ?», «Alô, tôi nghe.», «Dạ alô, ai gọi đấy?»). cam_xuc trung_tinh, phan_doi_dang_neu null, san_sang_chot 10, ket_thuc false.`,
    cauTrucJson: `{"noi_dung":"string","cam_xuc":"trung_tinh","phan_doi_dang_neu":null,"san_sang_chot":10,"ket_thuc":false}`,
    duPhong: () => ({ noi_dung: p.disc === "D" ? "Alô, ai đấy? Nói nhanh giúp tôi, tôi đang bận." : p.disc === "I" ? "Alô, dạ tôi nghe đây, ai gọi thế ạ?" : p.disc === "C" ? "Alô, xin hỏi ai đang gọi và có việc gì ạ?" : "Alô, tôi nghe ạ.", cam_xuc: "trung_tinh" as const, phan_doi_dang_neu: null, san_sang_chot: 10, ket_thuc: false }),
  });
  const luc = new Date().toISOString();
  const lichSu: LuotHoiThoai[] = [{ vai: "khach", noi_dung: kq.duLieu.noi_dung, luc }];
  await q.query("update phien_luyen_tap set lich_su = $2 where id = $1", [o.phienId, JSON.stringify(lichSu)]);
  return { khach: kq.duLieu, lichSu, cheDo: kq.cheDo };
}
