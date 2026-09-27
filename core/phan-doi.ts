// Loại phản đối chuẩn hóa (F-114 kho phản đối, F-115 phát hiện phản đối mới).
export const LOAI_PHAN_DOI = ["gia", "thoi_gian", "niem_tin", "nhu_cau", "quyet_dinh", "doi_thu", "khac"] as const;
export type LoaiPhanDoi = (typeof LOAI_PHAN_DOI)[number];
export const TEN_LOAI_PHAN_DOI: Record<LoaiPhanDoi, string> = {
  gia: "Giá cao / ngân sách",
  thoi_gian: "Chưa có thời gian",
  niem_tin: "Chưa tin hiệu quả",
  nhu_cau: "Chưa thấy cần",
  quyet_dinh: "Cần hỏi người khác",
  doi_thu: "Đang dùng bên khác",
  khac: "Khác",
};
export function laLoaiPhanDoi(s: unknown): s is LoaiPhanDoi {
  return typeof s === "string" && (LOAI_PHAN_DOI as readonly string[]).includes(s);
}
/** Đoán loại phản đối từ câu nói của khách bằng từ khóa — dùng cho chế độ dự phòng và gợi ý nhanh. */
export function doanLoaiPhanDoi(cau: string): LoaiPhanDoi {
  const t = cau.toLowerCase();
  if (/(giá(?!\p{L})|đắt|tiền|ngân sách|chi phí|mắc(?!\p{L})|rẻ hơn|khuyến mãi|giảm giá)/u.test(t)) return "gia";
  if (/(bận|thời gian|để sau|tháng sau|chưa rảnh|hôm khác)/.test(t)) return "thoi_gian";
  if (/(không tin|hiệu quả|thật không|cam kết|bảo đảm|đảm bảo|lừa|review|có ai)/.test(t)) return "niem_tin";
  if (/(chưa cần|không cần|tự làm|đủ rồi|ổn rồi)/.test(t)) return "nhu_cau";
  if (/(hỏi vợ|hỏi chồng|sếp|hỏi lại|bàn với|đối tác|ban giám đốc|hội đồng)/.test(t)) return "quyet_dinh";
  if (/(bên khác|đang dùng|đối thủ|so sánh|nơi khác|công ty kia)/.test(t)) return "doi_thu";
  return "khac";
}
