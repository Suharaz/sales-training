// DISC: 4 nhóm tính cách khách hàng và cách bán cho từng nhóm. Dùng cho kịch bản, role-play, copilot, phân tích.
import { z } from "zod";
export const NHOM_DISC = ["D", "I", "S", "C"] as const;
export type NhomDisc = (typeof NHOM_DISC)[number];
export const discSchema = z.enum(NHOM_DISC);
export type HoSoDisc = {
  ten: string; mo_ta: string; dau_hieu: string[]; tu_khoa: RegExp[]; muon: string; so: string;
  nen: string[]; tranh: string[]; bang_chung: string; kieu_chot: string; phan_doi_dien_hinh: string[]; nhip: string; mau: string;
};
export const DISC: Record<NhomDisc, HoSoDisc> = {
  D: { ten: "D — Thống trị", mo_ta: "Quyết đoán, thích kiểm soát, nói ngắn, ghét vòng vo, quan tâm kết quả và lợi ích cho mình.", mau: "#dc2626",
    dau_hieu: ["Câu ngắn, ra lệnh, hỏi thẳng «bao nhiêu», «bao lâu», «kết quả là gì»", "Ngắt lời, muốn đi thẳng vào vấn đề", "Nói về mục tiêu, tăng trưởng, thắng đối thủ"],
    tu_khoa: [/(nhanh|thẳng|kết quả|bao lâu|bao nhiêu|đi vào vấn đề|tóm lại|quyết|tăng trưởng|doanh số|vào việc|ngắn gọn|tôi cần|tôi muốn)/i],
    muon: "Kết quả, tốc độ, quyền quyết định, lợi thế cạnh tranh.", so: "Mất kiểm soát, bị lãng phí thời gian, bị coi thường.",
    nen: ["Nói kết luận trước, chi tiết sau", "Đưa 2–3 phương án để họ chọn", "Nêu con số và thời hạn rõ", "Tôn trọng thời gian: xin đúng số phút và giữ lời"],
    tranh: ["Kể lể, dài dòng, hỏi xã giao nhiều", "Áp đặt, nói «anh phải»", "Vòng vo về giá", "Nói quá nhiều về cảm xúc"],
    bang_chung: "Số liệu kết quả, thời gian hoàn vốn, case của doanh nghiệp lớn hơn họ.", kieu_chot: "Chốt trực tiếp, đưa lựa chọn: «Anh chọn gói A hay B? Em gửi hợp đồng hôm nay.»",
    phan_doi_dien_hinh: ["Tôi không có thời gian cho việc này", "Chứng minh nó ra kết quả đi", "Bên khác rẻ hơn / nhanh hơn"], nhip: "Nhanh, dứt khoát, ít câu hỏi mở." },
  I: { ten: "I — Ảnh hưởng", mo_ta: "Cởi mở, nhiệt tình, thích nói chuyện, quan tâm hình ảnh và cảm giác, dễ hào hứng nhưng dễ đổi ý.", mau: "#d97706",
    dau_hieu: ["Nói nhiều, kể chuyện, cười, hỏi về người khác", "Quan tâm «ai đang dùng», «có nổi không», xu hướng", "Hào hứng nhanh, hay nói «hay quá», «thích»"],
    tu_khoa: [/(hay quá|thích|vui|bạn bè|mọi người|nổi|xu hướng|cộng đồng|chia sẻ|kể|cảm giác|hào hứng|tuyệt|đẹp|ai đang dùng|nhiều người)/i],
    muon: "Được công nhận, được là người đi đầu, trải nghiệm vui, quan hệ tốt.", so: "Bị từ chối, bị coi là nhàm chán, mất mặt, chi tiết khô khan.",
    nen: ["Mở đầu thân thiện, khen thật lòng", "Kể câu chuyện khách hàng thành công, cộng đồng", "Nói về hình ảnh và cảm giác khi dùng", "Chốt ngay khi họ đang hào hứng, gửi việc cần làm ngắn gọn bằng văn bản"],
    tranh: ["Đổ số liệu, bảng biểu dày đặc", "Để họ tự quyết định lâu (sẽ nguội)", "Lạnh lùng, quá nghiêm túc", "Không ghi lại cam kết"],
    bang_chung: "Câu chuyện, lời chứng thực, cộng đồng, người nổi tiếng trong ngành đang dùng.", kieu_chot: "Chốt cảm xúc + giả định: «Vậy mình bắt đầu tuần này nhé, em giữ chỗ cho anh/chị luôn.» rồi xác nhận lại bằng tin nhắn.",
    phan_doi_dien_hinh: ["Để tôi hỏi bạn bè / đồng nghiệp đã", "Nghe hay nhưng để tôi suy nghĩ", "Tôi bận quá, mai tính"], nhip: "Nhanh, nhiều cảm xúc, hay lạc đề." },
  S: { ten: "S — Ổn định", mo_ta: "Điềm đạm, kiên nhẫn, ngại thay đổi, quan tâm an toàn và đội nhóm, cần thời gian và sự bảo đảm.", mau: "#16a34a",
    dau_hieu: ["Nói chậm, nhẹ, hay hỏi «có khó không», «có ai hỗ trợ không»", "Nhắc tới đội nhóm, gia đình, người khác", "Ngại quyết định nhanh, hay nói «để xem»"],
    tu_khoa: [/(có khó không|hỗ trợ|an toàn|đội|nhân viên của tôi|gia đình|từ từ|để xem|ổn định|quen|đang dùng quen|lo|sợ|thay đổi|phiền)/i],
    muon: "An toàn, quy trình rõ, được hỗ trợ, không làm phiền đội ngũ.", so: "Thay đổi đột ngột, áp lực, rủi ro, xung đột.",
    nen: ["Chậm rãi, hỏi thăm, lắng nghe kỹ", "Nhấn mạnh hỗ trợ từng bước, bảo hành, hoàn tiền", "Đưa lộ trình chuyển đổi nhẹ nhàng, dùng song song", "Cho thời gian, hẹn lịch gọi lại cụ thể"],
    tranh: ["Ép chốt, tạo áp lực «chỉ còn hôm nay»", "Nói về thay đổi lớn, cách mạng", "Bỏ qua người xung quanh họ", "Nói quá nhanh"],
    bang_chung: "Chính sách hỗ trợ, hoàn tiền, khách tương tự đã chuyển đổi êm, đội hỗ trợ.", kieu_chot: "Chốt từng bước nhỏ: «Mình thử bước đầu tiên trong 7 ngày, có gì em hỗ trợ trực tiếp, không phù hợp thì hoàn tiền.»",
    phan_doi_dien_hinh: ["Đội tôi đang quen cách cũ rồi", "Tôi sợ triển khai phức tạp", "Để tôi bàn với mọi người đã"], nhip: "Chậm, ôn hòa, cần được trấn an." },
  C: { ten: "C — Tuân thủ", mo_ta: "Logic, chi tiết, cẩn trọng, hỏi nhiều, cần dữ liệu và bằng chứng, ghét bị thúc ép và lời hứa suông.", mau: "#2563eb",
    dau_hieu: ["Hỏi chi tiết, so sánh, «tại sao», «dựa trên đâu»", "Yêu cầu tài liệu, bảng so sánh, điều khoản", "Nói về rủi ro, sai số, quy trình"],
    tu_khoa: [/(tại sao|dựa trên|chi tiết|so sánh|tài liệu|điều khoản|chính xác|số liệu|bảo mật|quy trình|rủi ro|chứng minh|nguồn|cụ thể|hợp đồng|cam kết gì)/i],
    muon: "Dữ liệu chính xác, minh bạch, quy trình rõ, quyết định đúng.", so: "Sai lầm, bị lừa, thiếu thông tin, bị thúc ép.",
    nen: ["Trả lời chính xác, có nguồn; không biết thì hẹn gửi sau", "Gửi tài liệu, bảng so sánh, điều khoản trước khi chốt", "Đi theo trình tự logic: vấn đề → giải pháp → bằng chứng → chi phí", "Cho thời gian đọc, hẹn lịch rõ"],
    tranh: ["Nói quá, hứa suông, số làm tròn", "Thúc ép, khuyến mãi giờ chót", "Lảng tránh câu hỏi khó", "Cảm xúc thái quá"],
    bang_chung: "Bảng số liệu, quy trình, chính sách bằng văn bản, so sánh khách quan với đối thủ.", kieu_chot: "Chốt bằng tóm tắt logic: «Dựa trên 3 điểm mình đã thống nhất, phương án phù hợp là… Em gửi bản đề xuất chi tiết, mình chốt sau khi anh/chị đọc, vào thứ X.»",
    phan_doi_dien_hinh: ["Tôi cần xem số liệu / tài liệu trước", "Cái này khác gì bên X?", "Rủi ro nếu không hiệu quả là gì?"], nhip: "Chậm, chính xác, nhiều câu hỏi." },
};
export const TEN_DISC: Record<NhomDisc, string> = { D: DISC.D.ten, I: DISC.I.ten, S: DISC.S.ten, C: DISC.C.ten };
export function laNhomDisc(s: unknown): s is NhomDisc { return typeof s === "string" && (NHOM_DISC as readonly string[]).includes(s); }
/** Tóm tắt hồ sơ một nhóm cho prompt AI (~600 ký tự). */
export function tomTatDisc(n: NhomDisc): string {
  const d = DISC[n];
  return `NHÓM ${d.ten}: ${d.mo_ta} Muốn: ${d.muon} Sợ: ${d.so} Nên: ${d.nen.join("; ")}. Tránh: ${d.tranh.join("; ")}. Bằng chứng ưu tiên: ${d.bang_chung} Kiểu chốt: ${d.kieu_chot} Nhịp nói: ${d.nhip}`;
}
/** Đoán nhóm DISC từ các câu KHÁCH nói (theo luật, dùng cho dự phòng và lớp tức thì). Trả null khi chưa đủ dấu hiệu. */
export function doanDisc(cauKhach: string[]): { nhom: NhomDisc; tinCay: number; diem: Record<NhomDisc, number> } | null {
  const diem: Record<NhomDisc, number> = { D: 0, I: 0, S: 0, C: 0 };
  const text = cauKhach.join(" ");
  if (text.trim().length < 20) return null;
  for (const n of NHOM_DISC) for (const r of DISC[n].tu_khoa) { const m = text.match(new RegExp(r.source, "gi")); diem[n] += m ? m.length : 0; }
  // Đặc trưng độ dài câu: D ngắn, I dài; C hỏi nhiều
  const tb = cauKhach.reduce((s, c) => s + c.length, 0) / cauKhach.length;
  if (tb < 40) diem.D += 1; if (tb > 120) diem.I += 1;
  const hoi = cauKhach.filter((c) => c.includes("?")).length; if (hoi >= Math.max(2, cauKhach.length / 2)) diem.C += 1;
  const tong = NHOM_DISC.reduce((s, n) => s + diem[n], 0);
  if (tong === 0) return null;
  const nhom = [...NHOM_DISC].sort((a, b) => diem[b] - diem[a])[0];
  const tinCay = Math.min(95, Math.round((diem[nhom] / tong) * 100));
  return tinCay >= 40 ? { nhom, tinCay, diem } : null;
}
// ---- Lược đồ bộ kịch bản theo nhóm (AI sinh, quản lý duyệt) ----
export const kichBanDiscSchema = z.object({
  mo_dau: z.string(),
  khai_thac: z.array(z.string()).min(3).max(6),
  gia_tri: z.string(),
  phan_doi: z.array(z.object({ cau_khach: z.string(), cau_tra_loi: z.string() })).min(2).max(4),
  chot: z.string(),
  theo_doi: z.string(),
  tu_nen_dung: z.array(z.string()).max(10),
  tu_tranh: z.array(z.string()).max(10),
});
export type KichBanDisc = z.infer<typeof kichBanDiscSchema>;
export const PHAN_KICH_BAN: [keyof KichBanDisc, string][] = [["mo_dau", "Mở đầu 30 giây"], ["khai_thac", "Câu hỏi khai thác"], ["gia_tri", "Trình bày giá trị"], ["phan_doi", "Xử lý phản đối điển hình"], ["chot", "Chốt"], ["theo_doi", "Theo dõi sau gọi"], ["tu_nen_dung", "Từ nên dùng"], ["tu_tranh", "Từ nên tránh"]];
