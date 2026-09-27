// F-127: tiến độ khóa và mốc phát đúng một lần; chống tua ảo theo thời lượng tối thiểu.
export type Moc = "module_hoan_thanh" | "nguong_khoa" | "hoan_thanh_khoa";
export type MocPhat = { moc: Moc; thamChieu: string };

export function phanTramKhoa(soBaiXong: number, tongBai: number): number {
  if (tongBai <= 0) return 0;
  return Math.min(100, Math.round((soBaiXong / tongBai) * 100));
}

/**
 * Bài được tính hoàn thành hợp lệ nếu thời gian ở lại ≥ 60% thời lượng bài (khi bật chống tua ảo),
 * hoặc quiz đạt ngưỡng nếu là bài quiz.
 */
export function hoanThanhHopLe(o: { loai: "noi_dung" | "video" | "quiz"; thoiLuongGiay: number; giayDaHoc: number; diemQuiz?: number | null; chongTuaAo: boolean }): boolean {
  if (o.loai === "quiz") return (o.diemQuiz ?? -1) >= 70;
  if (!o.chongTuaAo || o.thoiLuongGiay <= 0) return true;
  return o.giayDaHoc >= Math.ceil(o.thoiLuongGiay * 0.6);
}

/**
 * Tính danh sách mốc CẦN phát sau một lượt cập nhật tiến độ, loại bỏ mốc đã phát (idempotent).
 * `modulesXong` là danh sách module vừa đạt 100%.
 */
export function mocCanPhat(o: { phanTram: number; nguong: number; modulesXong: string[]; daPhat: string[] }): MocPhat[] {
  const da = new Set(o.daPhat);
  const kq: MocPhat[] = [];
  for (const m of o.modulesXong) {
    const khoa = `module_hoan_thanh:${m}`;
    if (!da.has(khoa)) kq.push({ moc: "module_hoan_thanh", thamChieu: m });
  }
  if (o.phanTram >= o.nguong && !da.has("nguong_khoa")) kq.push({ moc: "nguong_khoa", thamChieu: String(o.nguong) });
  if (o.phanTram >= 100 && !da.has("hoan_thanh_khoa")) kq.push({ moc: "hoan_thanh_khoa", thamChieu: "100" });
  return kq;
}
export function khoaMoc(m: MocPhat): string {
  return m.moc === "module_hoan_thanh" ? `module_hoan_thanh:${m.thamChieu}` : m.moc;
}

export type CauHoiQuiz = { hoi: string; luaChon: string[]; dapAn: number; giaiThich?: string };
/** Chấm quiz: trả % đúng, chỉ tính câu có trả lời hợp lệ. */
export function chamQuiz(cauHoi: CauHoiQuiz[], traLoi: number[]): { diem: number; dung: number; tong: number } {
  const tong = cauHoi.length;
  if (tong === 0) return { diem: 0, dung: 0, tong: 0 };
  let dung = 0;
  cauHoi.forEach((c, i) => { if (traLoi[i] === c.dapAn) dung++; });
  return { diem: Math.round((dung / tong) * 100), dung, tong };
}
