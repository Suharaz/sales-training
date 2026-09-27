// Copilot cuộc gọi trực tiếp (mockup #63 «AI Copilot»): nhận transcript đang chạy, trả gợi ý ngắn trong vài giây.
// Lớp 0 (tức thì, client): bắt phản đối bằng từ khóa + câu trả lời chuẩn. Lớp 1 (AI nhanh): gợi ý theo ngữ cảnh.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { copilotSchema, type GoiYCopilot, type LuotHoiThoai } from "@/core/ai-kieu";
import { copilotMau } from "@/core/du-phong-ai";
import type { LoaiPhanDoi } from "@/core/phan-doi";
import { goiAI } from "./ai-gateway";
import { danhSachKichBan, danhSachSanPham, moTaSanPhamChoAI } from "./kich-ban";
import { NHOM_DISC, doanDisc, tomTatDisc } from "@/core/disc";
import { kichBanDiscChoAI } from "./disc";

export async function goiYTrucTiep(q: Truy, o: { workspaceId: string; luot: LuotHoiThoai[]; sanPhamId: string | null; tenSale: string }): Promise<{ goiY: GoiYCopilot; cheDo: string; thoiGianMs: number }> {
  const luot = o.luot.slice(-14); // cửa sổ gần nhất để nhanh
  const kho = (await q.query<{ loai: LoaiPhanDoi; noi_dung: string; cau_tra_loi_chuan: string }>("select loai, noi_dung, cau_tra_loi_chuan from phan_doi where trang_thai = 'da_duyet' order by so_lan_gap desc limit 10")).rows;
  const sp = o.sanPhamId ? (await danhSachSanPham(q)).find((x) => x.id === o.sanPhamId) : null;
  const kb = (await danhSachKichBan(q)).find((k) => k.san_pham_id === o.sanPhamId) ?? null;
  const discLuat = doanDisc(luot.filter((l) => l.vai === "khach").map((l) => l.noi_dung));
  const kbDisc = discLuat ? await kichBanDiscChoAI(q, o.sanPhamId, discLuat.nhom) : "";
  const kq = await goiAI({
    workspaceId: o.workspaceId, tacVu: "copilot", schema: copilotSchema, timeoutMs: 40_000,
    prompt: `Bạn là COPILOT thì thầm cho nhân viên sale ${o.tenSale} ĐANG GỌI ĐIỆN với khách. Trả lời cực ngắn, dùng được ngay, tiếng Việt nói.
${sp ? moTaSanPhamChoAI(sp).slice(0, 1200) : ""}
${kb ? `Kịch bản: khai thác «${kb.khai_thac.slice(0, 300)}» · chốt «${kb.chot.slice(0, 200)}»` : ""}
${discLuat ? `Dấu hiệu theo luật: khách có vẻ nhóm DISC ${discLuat.nhom} (${discLuat.tinCay}%). ${tomTatDisc(discLuat.nhom).slice(0, 400)}\n${kbDisc}` : `Chưa rõ nhóm DISC; tham khảo: ${NHOM_DISC.map((n) => n + ": " + tomTatDisc(n).slice(0, 120)).join(" | ")}`}
Kho phản đối chuẩn: ${kho.map((k) => `[${k.loai}] ${k.noi_dung} → ${k.cau_tra_loi_chuan.slice(0, 160)}`).join(" | ") || "(chưa có)"}
TRANSCRIPT ĐANG DIỄN RA (mới nhất ở cuối):
${luot.map((l) => `${l.vai === "sale" ? "SALE" : "KHÁCH"}: ${l.noi_dung}`).join("\n")}
Yêu cầu: noi_tiep = câu sale NÊN NÓI NGAY (≤ 2 câu, đúng xưng hô DNA, có thể là câu hỏi); cau_hoi_nen_hoi = 2–3 câu hỏi khai thác còn thiếu (ngân sách, người quyết định, thời điểm, nỗi đau) phù hợp lúc này; phan_doi = nếu khách vừa nêu phản đối thì loại + cách trả lời ngắn (bám kho chuẩn), không thì null; canh_bao = câu sale vừa nói có rủi ro tuân thủ (hứa kết quả, bịa số, nói xấu đối thủ) hoặc lỗi lớn (nói quá nhiều, chưa hỏi đã chào giá), không có thì []; tin_hieu + san_sang_chot theo thái độ khách; buoc_tiep = bước chốt phù hợp hoặc «chưa chốt, khai thác thêm»; disc_doan = nhóm DISC của khách đoán từ cách nói (nhom, tin_cay, chinh_cach_noi = 1 câu sale nên đổi cách nói cho hợp nhóm) hoặc null nếu chưa đủ dấu hiệu. Gợi ý noi_tiep phải hợp nhóm DISC nếu đã đoán được.`,
    cauTrucJson: `{"noi_tiep":"string","cau_hoi_nen_hoi":["string"],"phan_doi":{"loai":"gia","cau_tra_loi":"string"}|null,"canh_bao":["string"],"tin_hieu":"tich_cuc|trung_tinh|tieu_cuc","san_sang_chot":0,"buoc_tiep":"string","disc_doan":{"nhom":"D","tin_cay":0,"chinh_cach_noi":"string"}}`,
    duPhong: () => ({ ...copilotMau(luot, kho), disc_doan: discLuat ? { nhom: discLuat.nhom, tin_cay: discLuat.tinCay, chinh_cach_noi: `Khách có vẻ nhóm ${discLuat.nhom}: ${tomTatDisc(discLuat.nhom).split("Nên: ")[1]?.split(". Tránh")[0] ?? ""}` } : null }),
  });
  return { goiY: kq.duLieu, cheDo: kq.cheDo, thoiGianMs: kq.thoiGianMs };
}
