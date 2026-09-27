// Bộ kịch bản chốt theo 4 nhóm DISC: AI sinh từ DNA + sản phẩm → nháp → quản lý duyệt/sửa; cung cấp cho copilot, role-play, phân tích.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { DISC, NHOM_DISC, kichBanDiscSchema, laNhomDisc, tomTatDisc, type KichBanDisc, type NhomDisc } from "@/core/disc";
import { goiAI } from "./ai-gateway";
import { danhSachSanPham, moTaSanPhamChoAI } from "./kich-ban";
import { ghiKiemToan } from "./nhat-ky";

export type HangKichBanDisc = { id: string; san_pham_id: string; nhom: NhomDisc; noi_dung: KichBanDisc; trang_thai: "nhap" | "da_duyet"; che_do_ai: string | null; phien_ban_dna: number | null; cap_nhat_luc: string };
export async function layBoKichBan(q: Truy, sanPhamId: string): Promise<Record<NhomDisc, HangKichBanDisc | null>> {
  const rows = (await q.query<HangKichBanDisc>("select id, san_pham_id, nhom, noi_dung, trang_thai, che_do_ai, phien_ban_dna, cap_nhat_luc::text from kich_ban_disc where san_pham_id = $1", [sanPhamId])).rows;
  const kq = { D: null, I: null, S: null, C: null } as Record<NhomDisc, HangKichBanDisc | null>;
  for (const r of rows) kq[r.nhom] = r;
  return kq;
}
export async function tongQuanDisc(q: Truy): Promise<{ san_pham_id: string; ten: string; so_nhap: number; so_duyet: number }[]> {
  return (await q.query<{ san_pham_id: string; ten: string; so_nhap: number; so_duyet: number }>(`select s.id as san_pham_id, s.ten,
    (select count(*) from kich_ban_disc k where k.san_pham_id = s.id and k.trang_thai = 'nhap')::int as so_nhap,
    (select count(*) from kich_ban_disc k where k.san_pham_id = s.id and k.trang_thai = 'da_duyet')::int as so_duyet
    from san_pham s where s.trang_thai = 'dang_ban' order by s.tang, s.ten`)).rows;
}
function kichBanMau(nhom: NhomDisc, tenSp: string): KichBanDisc {
  const d = DISC[nhom];
  return {
    mo_dau: `Dạ chào anh/chị, em là [Tên] bên [Công ty]. ${nhom === "D" ? "Em xin đúng 3 phút để nói thẳng vào việc." : nhom === "I" ? "Em thấy anh/chị vừa quan tâm tới " + tenSp + ", nhiều khách bên em đang rất hào hứng với nó." : nhom === "S" ? "Em gọi hỏi thăm nhẹ nhàng thôi, anh/chị có tiện 5 phút không ạ?" : "Em gọi để cung cấp thông tin chính xác về " + tenSp + " và trả lời các câu hỏi của anh/chị."}`,
    khai_thac: nhom === "D" ? ["Mục tiêu 3 tháng tới của anh/chị là gì?", "Hiện tại điều gì đang cản kết quả đó?", "Anh/chị muốn thấy con số nào thay đổi?"] : nhom === "I" ? ["Anh/chị biết tới bên em qua đâu ạ?", "Điều gì làm anh/chị hứng thú nhất?", "Anh/chị hình dung đội mình sẽ khác thế nào khi làm được?"] : nhom === "S" ? ["Hiện tại đội mình đang làm việc này thế nào ạ?", "Có điều gì khiến anh/chị lo khi thay đổi không?", "Ai sẽ cùng anh/chị dùng giải pháp này?"] : ["Anh/chị đang so sánh những phương án nào?", "Tiêu chí quan trọng nhất để quyết định là gì?", "Anh/chị cần những tài liệu nào để đánh giá?"],
    gia_tri: `Trình bày ${tenSp} theo nhu cầu vừa khai thác. ${d.bang_chung}`,
    phan_doi: d.phan_doi_dien_hinh.slice(0, 3).map((c) => ({ cau_khach: c, cau_tra_loi: "Ghi nhận → làm rõ → giá trị gắn nhu cầu → kiểm tra lại (bám kho phản đối chuẩn)." })),
    chot: d.kieu_chot, theo_doi: nhom === "I" ? "Nhắn ngay sau cuộc gọi tóm tắt 3 dòng + việc cần làm; gọi lại sau 1 ngày." : nhom === "C" ? "Gửi tài liệu đầy đủ trong 1 giờ; hẹn lịch đọc xong; không thúc." : nhom === "S" ? "Gửi lộ trình từng bước, nhắc lại chính sách hỗ trợ; gọi lại đúng lịch đã hẹn." : "Gửi đề xuất 1 trang có con số; chốt hạn trả lời trong 24 giờ.",
    tu_nen_dung: d.nen.slice(0, 4), tu_tranh: d.tranh.slice(0, 4),
  };
}
/** Sinh kịch bản cho một nhóm bằng AI (DNA tự nạp qua gateway). */
export async function sinhKichBanDisc(q: Truy, o: { workspaceId: string; nguoiDungId: string; sanPhamId: string; nhom: NhomDisc }): Promise<{ noiDung: KichBanDisc; cheDo: string }> {
  const sp = (await danhSachSanPham(q)).find((x) => x.id === o.sanPhamId);
  if (!sp) throw new Error("Không tìm thấy sản phẩm");
  const kho = (await q.query<{ loai: string; noi_dung: string; cau_tra_loi_chuan: string }>("select loai, noi_dung, cau_tra_loi_chuan from phan_doi where trang_thai = 'da_duyet' order by so_lan_gap desc limit 8")).rows;
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "sinh_kich_ban_disc", schema: kichBanDiscSchema, timeoutMs: 150_000,
    prompt: `Viết KỊCH BẢN GỌI ĐIỆN CHỐT SALE đầy đủ cho sản phẩm dưới đây, dành riêng cho khách hàng thuộc ${tomTatDisc(o.nhom)}
${moTaSanPhamChoAI(sp)}
Kho phản đối chuẩn của doanh nghiệp (bám sát khi viết câu trả lời): ${kho.map((k) => `[${k.loai}] ${k.noi_dung} → ${k.cau_tra_loi_chuan.slice(0, 150)}`).join(" | ") || "(chưa có)"}
Yêu cầu từng phần (tiếng Việt nói, xưng hô theo DNA, dùng [Tên] và [Công ty] làm chỗ trống):
- mo_dau: 30 giây đầu đúng nhịp của nhóm này (2–4 câu).
- khai_thac: 3–6 câu hỏi theo thứ tự, phù hợp nhóm.
- gia_tri: cách trình bày sản phẩm cho nhóm này (5–8 câu), chỉ dùng số liệu được phép trong DNA.
- phan_doi: 3 phản đối ĐIỂN HÌNH của nhóm này với sản phẩm này, mỗi cái một câu trả lời hoàn chỉnh 3–5 câu.
- chot: câu chốt đúng kiểu nhóm (2–4 câu).
- theo_doi: việc làm sau cuộc gọi cho nhóm này.
- tu_nen_dung / tu_tranh: 5–8 từ hoặc cụm mỗi bên.`,
    cauTrucJson: `{"mo_dau":"string","khai_thac":["string"],"gia_tri":"string","phan_doi":[{"cau_khach":"string","cau_tra_loi":"string"}],"chot":"string","theo_doi":"string","tu_nen_dung":["string"],"tu_tranh":["string"]}`,
    duPhong: () => kichBanMau(o.nhom, sp.ten),
  });
  await q.query(`insert into kich_ban_disc(workspace_id, san_pham_id, nhom, noi_dung, trang_thai, che_do_ai, phien_ban_dna) values ($1,$2,$3,$4,'nhap',$5,$6)
    on conflict (san_pham_id, nhom) do update set noi_dung = excluded.noi_dung, trang_thai = 'nhap', che_do_ai = excluded.che_do_ai, phien_ban_dna = excluded.phien_ban_dna, cap_nhat_luc = now()`,
    [o.workspaceId, o.sanPhamId, o.nhom, JSON.stringify(kq.duLieu), kq.cheDo, kq.phienBanDna]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "sinh_kich_ban_disc", doiTuong: o.sanPhamId, chiTiet: { nhom: o.nhom, che_do: kq.cheDo } });
  return { noiDung: kq.duLieu, cheDo: kq.cheDo };
}
export async function luuKichBanDisc(q: Truy, o: { workspaceId: string; nguoiDungId: string; sanPhamId: string; nhom: string; noiDung: unknown; duyet?: boolean }) {
  if (!laNhomDisc(o.nhom)) throw new Error("Nhóm DISC không hợp lệ");
  const nd = kichBanDiscSchema.parse(o.noiDung);
  await q.query(`insert into kich_ban_disc(workspace_id, san_pham_id, nhom, noi_dung, trang_thai) values ($1,$2,$3,$4,$5)
    on conflict (san_pham_id, nhom) do update set noi_dung = excluded.noi_dung, trang_thai = excluded.trang_thai, cap_nhat_luc = now()`,
    [o.workspaceId, o.sanPhamId, o.nhom, JSON.stringify(nd), o.duyet ? "da_duyet" : "nhap"]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: o.duyet ? "duyet_kich_ban_disc" : "sua_kich_ban_disc", doiTuong: o.sanPhamId, chiTiet: { nhom: o.nhom } });
}
export async function doiTrangThaiDisc(q: Truy, o: { sanPhamId: string; nhom: string; trangThai: "nhap" | "da_duyet" }) {
  if (!laNhomDisc(o.nhom)) return;
  await q.query("update kich_ban_disc set trang_thai = $3, cap_nhat_luc = now() where san_pham_id = $1 and nhom = $2", [o.sanPhamId, o.nhom, o.trangThai]);
}
/** Kịch bản DISC (đã duyệt) rút gọn cho prompt copilot/role-play. */
export async function kichBanDiscChoAI(q: Truy, sanPhamId: string | null, nhom: NhomDisc): Promise<string> {
  if (!sanPhamId) return "";
  const r = (await q.query<{ noi_dung: KichBanDisc }>("select noi_dung from kich_ban_disc where san_pham_id = $1 and nhom = $2 and trang_thai = 'da_duyet'", [sanPhamId, nhom])).rows[0];
  if (!r) return "";
  const k = r.noi_dung;
  return `KỊCH BẢN ĐÃ DUYỆT CHO NHÓM ${nhom}: mở đầu «${k.mo_dau.slice(0, 200)}» · khai thác: ${k.khai_thac.slice(0, 4).join(" / ")} · chốt «${k.chot.slice(0, 200)}» · phản đối: ${k.phan_doi.slice(0, 3).map((p) => `«${p.cau_khach}» → ${p.cau_tra_loi.slice(0, 160)}`).join(" | ")} · nên dùng: ${k.tu_nen_dung.join(", ")} · tránh: ${k.tu_tranh.join(", ")}`.slice(0, 1800);
}
export async function thongKeDisc(q: Truy): Promise<{ nhom: NhomDisc; so_goi: number; thang: number; diem_tb: number | null; so_phien: number; diem_phien: number | null }[]> {
  const rows = (await q.query<{ nhom: NhomDisc; so_goi: string; thang: string; diem_tb: string | null; so_phien: string; diem_phien: string | null }>(`select n.nhom,
    (select count(*) from cuoc_goi c where c.disc = n.nhom and c.trang_thai = 'xong')::text as so_goi,
    (select count(*) from cuoc_goi c where c.disc = n.nhom and c.trang_thai = 'xong' and c.ket_qua = 'thang')::text as thang,
    (select round(avg(diem_tong)) from cuoc_goi c where c.disc = n.nhom and c.trang_thai = 'xong')::text as diem_tb,
    (select count(*) from phien_luyen_tap p where p.disc = n.nhom and p.trang_thai = 'xong')::text as so_phien,
    (select round(avg(diem_tong)) from phien_luyen_tap p where p.disc = n.nhom and p.trang_thai = 'xong')::text as diem_phien
    from (values ('D'),('I'),('S'),('C')) as n(nhom)`)).rows;
  return rows.map((r) => ({ nhom: r.nhom, so_goi: Number(r.so_goi), thang: Number(r.thang), diem_tb: r.diem_tb ? Number(r.diem_tb) : null, so_phien: Number(r.so_phien), diem_phien: r.diem_phien ? Number(r.diem_phien) : null }));
}
export { NHOM_DISC };
