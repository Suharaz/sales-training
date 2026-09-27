// Khung kỹ năng 6 tiêu chí (mockup #62 radar, F-115 chấm điểm theo khung). Cố định toàn hệ, điểm 0–100.
export const KY_NANG = ["khai_thac", "lang_nghe", "gia_tri", "phan_doi", "chot", "tuan_thu"] as const;
export type KyNang = (typeof KY_NANG)[number];
export type DiemKhung = Record<KyNang, number>;

export const TEN_KY_NANG: Record<KyNang, string> = {
  khai_thac: "Khai thác nhu cầu",
  lang_nghe: "Lắng nghe",
  gia_tri: "Trình bày giá trị",
  phan_doi: "Xử lý phản đối",
  chot: "Chốt và bước tiếp",
  tuan_thu: "Tuân thủ",
};

export const MO_TA_KY_NANG: Record<KyNang, string> = {
  khai_thac: "Đặt câu hỏi mở, tìm mục tiêu, nỗi đau, ngân sách, thời điểm quyết định.",
  lang_nghe: "Không cắt lời, tóm tắt lại ý khách, tỷ lệ nói/nghe hợp lý.",
  gia_tri: "Gắn lợi ích với đúng nhu cầu, có bằng chứng (case, số liệu được phép).",
  phan_doi: "Ghi nhận, làm rõ, trả lời theo kho phản đối chuẩn, kiểm tra lại.",
  chot: "Đề xuất bước tiếp theo rõ ràng, có thời hạn, xin cam kết.",
  tuan_thu: "Không hứa kết quả, không bịa số liệu, không nói xấu đối thủ, xưng hô đúng.",
};

export function laKyNang(s: unknown): s is KyNang {
  return typeof s === "string" && (KY_NANG as readonly string[]).includes(s);
}

/** Ép một object bất kỳ về DiemKhung: thiếu → 0, ngoài biên → kẹp 0–100, làm tròn. */
export function chuanHoaDiem(d: Partial<Record<string, unknown>> | null | undefined): DiemKhung {
  const kq = {} as DiemKhung;
  for (const k of KY_NANG) {
    const v = Number((d ?? {})[k]);
    kq[k] = Number.isFinite(v) ? Math.round(Math.min(100, Math.max(0, v))) : 0;
  }
  return kq;
}

export function diemTong(d: DiemKhung): number {
  return Math.round(KY_NANG.reduce((s, k) => s + d[k], 0) / KY_NANG.length);
}

/** Trung bình theo từng tiêu chí của nhiều bản chấm (radar đội / radar cá nhân). */
export function trungBinhKhung(ds: DiemKhung[]): DiemKhung | null {
  if (ds.length === 0) return null;
  const kq = {} as DiemKhung;
  for (const k of KY_NANG) kq[k] = Math.round(ds.reduce((s, d) => s + d[k], 0) / ds.length);
  return kq;
}

/** Tiêu chí yếu nhất → mạnh nhất (dùng cho gói huấn luyện cá nhân F-116). */
export function xepTheoDiem(d: DiemKhung): KyNang[] {
  return [...KY_NANG].sort((a, b) => d[a] - d[b]);
}

export function nhanXetDiem(diem: number): "Xuất sắc" | "Tốt" | "Khá" | "Cần cải thiện" {
  if (diem >= 90) return "Xuất sắc";
  if (diem >= 80) return "Tốt";
  if (diem >= 65) return "Khá";
  return "Cần cải thiện";
}
