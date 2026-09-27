// DNA doanh nghiệp: đọc/lưu (tăng phiên bản), nạp từ văn bản bằng AI (F-057 rút gọn), tóm tắt cho gateway.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { DNA_RONG, dnaSchema, tomTatDna, type NoiDungDna } from "@/core/dna";
import { goiAI } from "./ai-gateway";
import { ghiKiemToan } from "./nhat-ky";

export type HoSoDna = NoiDungDna & { id: string | null; nguon_nap: "thu_cong" | "ai_trich"; phien_ban: number; cap_nhat_luc: string | null };
const COT = "ten_doanh_nghiep, nganh, mo_ta, khach_hang_muc_tieu, noi_dau_khach, usp, xung_ho, phong_cach, tu_cam, so_lieu_cho_phep, doi_thu, chinh_sach, cau_chuyen";

export async function layDna(q: Truy): Promise<HoSoDna> {
  const r = (await q.query<HoSoDna>(`select id, ${COT}, nguon_nap, phien_ban, cap_nhat_luc::text from ho_so_dna limit 1`)).rows[0];
  return r ?? { ...DNA_RONG, id: null, nguon_nap: "thu_cong", phien_ban: 0, cap_nhat_luc: null };
}
/** Ngữ cảnh DNA cho AI Gateway: null nếu chưa nạp. */
export async function nguCanhDna(q: Truy): Promise<{ tomTat: string; tuCam: string[]; phienBan: number } | null> {
  const d = await layDna(q);
  if (!d.id || !d.ten_doanh_nghiep.trim()) return null;
  return { tomTat: tomTatDna(d), tuCam: d.tu_cam, phienBan: d.phien_ban };
}
function chuanHoa(vao: Partial<NoiDungDna>): NoiDungDna {
  const mang = (v: unknown, max: number) => (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x) => String(x).trim()).filter(Boolean).slice(0, max);
  return dnaSchema.parse({
    ...DNA_RONG, ...vao,
    ten_doanh_nghiep: String(vao.ten_doanh_nghiep ?? "").trim().slice(0, 200), nganh: String(vao.nganh ?? "").slice(0, 200), mo_ta: String(vao.mo_ta ?? "").slice(0, 3000),
    khach_hang_muc_tieu: String(vao.khach_hang_muc_tieu ?? "").slice(0, 2000), noi_dau_khach: String(vao.noi_dau_khach ?? "").slice(0, 2000),
    usp: mang(vao.usp, 12), xung_ho: String(vao.xung_ho ?? "em – anh/chị").slice(0, 100) || "em – anh/chị", phong_cach: String(vao.phong_cach ?? "").slice(0, 1000),
    tu_cam: mang(vao.tu_cam, 40), so_lieu_cho_phep: mang(vao.so_lieu_cho_phep, 30), doi_thu: String(vao.doi_thu ?? "").slice(0, 2000), chinh_sach: String(vao.chinh_sach ?? "").slice(0, 2000), cau_chuyen: String(vao.cau_chuyen ?? "").slice(0, 3000),
  });
}
export async function luuDna(q: Truy, o: { workspaceId: string; nguoiDungId: string; noiDung: Partial<NoiDungDna>; nguon?: "thu_cong" | "ai_trich" }): Promise<number> {
  const d = chuanHoa(o.noiDung);
  if (!d.ten_doanh_nghiep) throw new Error("Tên doanh nghiệp không được trống");
  const v = [o.workspaceId, d.ten_doanh_nghiep, d.nganh, d.mo_ta, d.khach_hang_muc_tieu, d.noi_dau_khach, JSON.stringify(d.usp), d.xung_ho, d.phong_cach, JSON.stringify(d.tu_cam), JSON.stringify(d.so_lieu_cho_phep), d.doi_thu, d.chinh_sach, d.cau_chuyen, o.nguon ?? "thu_cong"];
  const r = await q.query<{ phien_ban: number }>(
    `insert into ho_so_dna(workspace_id, ${COT}, nguon_nap) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     on conflict (workspace_id) do update set ten_doanh_nghiep = excluded.ten_doanh_nghiep, nganh = excluded.nganh, mo_ta = excluded.mo_ta, khach_hang_muc_tieu = excluded.khach_hang_muc_tieu, noi_dau_khach = excluded.noi_dau_khach, usp = excluded.usp, xung_ho = excluded.xung_ho, phong_cach = excluded.phong_cach, tu_cam = excluded.tu_cam, so_lieu_cho_phep = excluded.so_lieu_cho_phep, doi_thu = excluded.doi_thu, chinh_sach = excluded.chinh_sach, cau_chuyen = excluded.cau_chuyen, nguon_nap = excluded.nguon_nap, phien_ban = ho_so_dna.phien_ban + 1, cap_nhat_luc = now()
     returning phien_ban`, v);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "luu_dna", chiTiet: { phien_ban: r.rows[0].phien_ban, nguon: o.nguon ?? "thu_cong" } });
  return r.rows[0].phien_ban;
}
/** Nạp DNA từ văn bản (giới thiệu công ty, trang web dán vào, brochure): AI trích thành hồ sơ NHÁP để người dùng duyệt rồi lưu. */
export async function trichDnaTuVanBan(q: Truy, o: { workspaceId: string; vanBan: string }): Promise<{ dna: NoiDungDna; cheDo: string }> {
  const vb = o.vanBan.trim().slice(0, 20_000);
  if (vb.length < 80) throw new Error("Văn bản quá ngắn (cần ≥ 80 ký tự): dán phần giới thiệu công ty, sản phẩm, khách hàng, cam kết.");
  const hienTai = await layDna(q);
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "trich_dna", schema: dnaSchema, timeoutMs: 150_000, boQuaDna: true,
    prompt: `Đọc tài liệu doanh nghiệp dưới đây và trích thành HỒ SƠ DNA để AI huấn luyện bán hàng dùng. Chỉ lấy thông tin CÓ TRONG tài liệu, không bịa; trường không có thì để chuỗi rỗng hoặc mảng rỗng.
- usp: 3–8 điểm khác biệt ngắn gọn. - tu_cam: từ/cụm không nên dùng khi bán hàng (vd: cam kết 100%, rẻ nhất, chắc chắn có lãi) — luôn thêm các cụm hứa kết quả tuyệt đối. - so_lieu_cho_phep: chỉ các con số CÓ trong tài liệu (số học viên, năm kinh nghiệm, tỷ lệ…), ghi kèm ngữ cảnh.
- xung_ho: cách xưng hô sale với khách (mặc định em – anh/chị). - phong_cach: giọng điệu giao tiếp. - doi_thu: đối thủ và cách nói (không nói xấu). - chinh_sach: bảo hành, hoàn tiền, thanh toán, hỗ trợ.
${hienTai.id ? `Hồ sơ hiện tại (giữ lại giá trị cũ nếu tài liệu không nói khác): ${JSON.stringify(hienTai).slice(0, 2000)}` : ""}
TÀI LIỆU:
${vb}`,
    cauTrucJson: `{"ten_doanh_nghiep":"string","nganh":"string","mo_ta":"string","khach_hang_muc_tieu":"string","noi_dau_khach":"string","usp":["string"],"xung_ho":"string","phong_cach":"string","tu_cam":["string"],"so_lieu_cho_phep":["string"],"doi_thu":"string","chinh_sach":"string","cau_chuyen":"string"}`,
    duPhong: () => trichDnaTheoLuat(vb, hienTai),
  });
  return { dna: chuanHoa(kq.duLieu), cheDo: kq.cheDo };
}
/** Dự phòng không AI: lấy tên (dòng đầu), mô tả (đoạn đầu), số liệu (cụm có chữ số), từ cấm mặc định. */
function trichDnaTheoLuat(vb: string, cu: HoSoDna): NoiDungDna {
  const dong = vb.split(/\n+/).map((d) => d.trim()).filter(Boolean);
  const so = Array.from(new Set((vb.match(/[^.\n]{0,40}\d[\d.,%]*\s?(?:học viên|khách hàng|năm|doanh nghiệp|%|tỷ|triệu|giờ|ngày)[^.\n]{0,30}/gi) ?? []).map((s) => s.trim()))).slice(0, 10);
  return chuanHoa({ ...cu, ten_doanh_nghiep: cu.ten_doanh_nghiep || dong[0]?.slice(0, 120) || "", mo_ta: cu.mo_ta || dong.slice(0, 3).join(" ").slice(0, 600), so_lieu_cho_phep: so.length ? so : cu.so_lieu_cho_phep, tu_cam: cu.tu_cam.length ? cu.tu_cam : ["cam kết 100%", "chắc chắn thành công", "đảm bảo lợi nhuận", "rẻ nhất thị trường"] });
}
