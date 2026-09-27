// Chế độ DỰ PHÒNG khi không có Claude (không CLI, không API key): chấm theo luật + khách mẫu có kịch bản.
// Mục đích: app vẫn chạy đủ luồng, test không cần mạng. Kết quả gắn nhãn «dự phòng» để người dùng biết.
import type { DiemKhung, KyNang } from "./khung-ky-nang";
import { KY_NANG, xepTheoDiem } from "./khung-ky-nang";
import { LOAI_PHAN_DOI, TEN_LOAI_PHAN_DOI, doanLoaiPhanDoi, type LoaiPhanDoi } from "./phan-doi";
import type { DoKho, GoiHuanLuyen, GoiYCopilot, KetQuaLuyenTap, LuotHoiThoai, LuotKhach, Persona, PhanTichCuocGoi } from "./ai-kieu";

const CAM_TUAN_THU = [/cam kết 100/i, /chắc chắn (?:thành công|có lãi|x\d)/i, /đảm bảo (?:kết quả|lợi nhuận|doanh thu)/i, /không thể thất bại/i, /bên kia (?:lừa|dở|tệ)/i];
const TU_GIA_TRI = /(lợi ích|giúp|tiết kiệm|tăng|giảm|case|khách hàng trước|kết quả|ví dụ|so với)/i;
const TU_LANG_NGHE = /(em hiểu|dạ|tức là|nghĩa là|anh\/chị vừa nói|như anh nói|như chị nói|đúng không ạ|xin lỗi|em ghi nhận)/i;
const TU_CHOT = /(bước tiếp theo|hẹn|gửi (?:link|báo giá|tài liệu)|đăng ký|thanh toán|giữ chỗ|lịch|demo|thứ [2-7]|ngày mai|tuần sau)/i;
const TU_KHAI_THAC = /(mục tiêu|khó khăn|hiện tại|mong muốn|ngân sách|bao lâu|thế nào|ra sao|vì sao|tại sao|bao nhiêu|đã thử|đang dùng)/i;

function demCauHoi(s: string): number { return (s.match(/\?/g) || []).length; }
function kep(v: number): number { return Math.round(Math.min(100, Math.max(0, v))); }

/** Chấm 6 tiêu chí theo luật từ danh sách lượt (dùng cho cả role-play và transcript). */
export function chamTheoLuat(luot: LuotHoiThoai[]): { diem: DiemKhung; soCauHoi: number; tyLeSaleNoi: number; phanDoi: { loai: LoaiPhanDoi; cau: string; traLoi: string; tot: boolean }[]; ruiRo: string[] } {
  const sale = luot.filter((l) => l.vai === "sale"), khach = luot.filter((l) => l.vai === "khach");
  const chuSale = sale.reduce((s, l) => s + l.noi_dung.length, 0), chuKhach = khach.reduce((s, l) => s + l.noi_dung.length, 0);
  const tyLeSaleNoi = chuSale + chuKhach ? Math.round((chuSale / (chuSale + chuKhach)) * 100) : 50;
  const soCauHoi = sale.reduce((s, l) => s + demCauHoi(l.noi_dung), 0);
  const ruiRo: string[] = [];
  for (const l of sale) for (const r of CAM_TUAN_THU) if (r.test(l.noi_dung)) ruiRo.push(`«${l.noi_dung.slice(0, 80)}»`);
  // Phản đối: câu khách có dấu hiệu phản đối; lượt sale ngay sau được xem là cách xử lý.
  const phanDoi: { loai: LoaiPhanDoi; cau: string; traLoi: string; tot: boolean }[] = [];
  luot.forEach((l, i) => {
    if (l.vai !== "khach") return;
    const loai = doanLoaiPhanDoi(l.noi_dung);
    if (loai === "khac") return;
    const sau = luot.slice(i + 1).find((x) => x.vai === "sale");
    const traLoi = sau?.noi_dung ?? "";
    const tot = !!traLoi && TU_LANG_NGHE.test(traLoi) && (TU_GIA_TRI.test(traLoi) || demCauHoi(traLoi) > 0);
    phanDoi.push({ loai, cau: l.noi_dung, traLoi, tot });
  });
  const khaiThac = kep(35 + Math.min(soCauHoi, 8) * 7 + (sale.some((l) => TU_KHAI_THAC.test(l.noi_dung)) ? 10 : 0));
  const langNghe = kep(90 - Math.abs(tyLeSaleNoi - 45) * 1.2 + (sale.filter((l) => TU_LANG_NGHE.test(l.noi_dung)).length ? 8 : -10));
  const giaTri = kep(40 + sale.filter((l) => TU_GIA_TRI.test(l.noi_dung)).length * 12);
  const pd = phanDoi.length ? kep(45 + (phanDoi.filter((p) => p.tot).length / phanDoi.length) * 50) : 60;
  const chot = kep(sale.some((l) => TU_CHOT.test(l.noi_dung)) ? 75 + (sale[sale.length - 1] && TU_CHOT.test(sale[sale.length - 1].noi_dung) ? 15 : 0) : 35);
  const tuanThu = kep(100 - ruiRo.length * 25);
  return { diem: { khai_thac: khaiThac, lang_nghe: langNghe, gia_tri: giaTri, phan_doi: pd, chot, tuan_thu: tuanThu }, soCauHoi, tyLeSaleNoi, phanDoi, ruiRo };
}

const MAU_PERSONA: Omit<Persona, "phan_doi_chinh">[] = [
  { ten: "Lê Phương Anh", chuc_danh: "Giám đốc vận hành", cong_ty: "Công ty An Phát (mẫu)", boi_canh: "Doanh nghiệp 80 nhân sự, đội sale 6 người dùng Excel theo dõi khách.", muc_tieu: "Tự động hóa quy trình bán hàng và chăm sóc.", noi_dau: "Dữ liệu phân tán, báo cáo chậm, lead rơi.", ngan_sach: "150–250 triệu/năm", tinh_cach: "Thực tế, hỏi nhiều về số liệu." },
  { ten: "Trần Quốc Bảo", chuc_danh: "Chủ spa", cong_ty: "Bảo Spa", boi_canh: "Hai cơ sở, khách chủ yếu từ Facebook, tự chạy quảng cáo.", muc_tieu: "Có thêm khách mới ổn định mỗi tháng.", noi_dau: "Chi phí quảng cáo tăng, không biết cách chăm khách cũ.", ngan_sach: "Dưới 30 triệu", tinh_cach: "Thân thiện nhưng hay dời quyết định." },
  { ten: "Nguyễn Thị Hà", chuc_danh: "Giảng viên tự do", cong_ty: "Cá nhân", boi_canh: "Dạy tiếng Anh online, 300 học viên, đang dùng Zalo để bán khóa.", muc_tieu: "Xây hệ thống bán khóa học tự động.", noi_dau: "Mất nhiều thời gian trả lời inbox, không có phễu.", ngan_sach: "20–50 triệu", tinh_cach: "Cẩn thận, đã từng mua khóa không hiệu quả nên hoài nghi." },
];

export function sinhPersonaMau(doKho: DoKho, hat: number, phanDoiUuTien?: LoaiPhanDoi[]): Persona {
  const goc = MAU_PERSONA[Math.abs(hat) % MAU_PERSONA.length];
  const so = doKho === "de" ? 1 : doKho === "vua" ? 2 : 3;
  const pool = (phanDoiUuTien?.length ? phanDoiUuTien : (["gia", "niem_tin", "thoi_gian", "quyet_dinh", "doi_thu"] as LoaiPhanDoi[]));
  const phan_doi_chinh = Array.from(new Set([...pool, ...LOAI_PHAN_DOI.filter((l) => l !== "khac")])).slice(0, so);
  return { ...goc, phan_doi_chinh };
}

const DAY_LAI = "Mình vẫn chưa thấy thuyết phục lắm về chuyện ";
const CAU_PHAN_DOI: Record<LoaiPhanDoi, string> = {
  gia: "Nói thật là mức giá này hơi cao so với ngân sách của bên em. Có gói nào rẻ hơn không?",
  thoi_gian: "Giai đoạn này bên em đang bận quá, chắc để tháng sau tính tiếp được không?",
  niem_tin: "Em từng mua một giải pháp tương tự rồi mà không hiệu quả. Sao em biết lần này khác?",
  nhu_cau: "Thật ra hiện tại đội em vẫn làm ổn, em chưa thấy cần thiết lắm.",
  quyet_dinh: "Cái này em phải hỏi lại sếp và ban giám đốc đã, em không quyết được.",
  doi_thu: "Bên em đang dùng phần mềm của một bên khác rồi, đổi sang thì tốn công lắm.",
  khac: "Em chưa rõ lắm, anh/chị nói thêm được không?",
};

/**
 * Khách mẫu (không AI): nêu lần lượt các phản đối trong persona; sale trả lời có ghi nhận + giá trị thì
 * chuyển phản đối kế; hết phản đối và sale đề xuất bước tiếp → đồng ý và kết thúc.
 */
export function khachTraLoiMau(persona: Persona, lichSu: LuotHoiThoai[], tinNhanSale: string): LuotKhach {
  const luotSale = lichSu.filter((l) => l.vai === "sale").length + 1;
  // Khách mẫu luôn nói câu chuẩn nên suy trạng thái từ chính câu đã nói (không đoán từ khóa — tránh «giám đốc» bị hiểu là «giá»).
  const loaiCuaCau = (m: string): LoaiPhanDoi | null => {
    for (const l of LOAI_PHAN_DOI) if (m === CAU_PHAN_DOI[l] || (l !== "khac" && m.startsWith(DAY_LAI) && m.includes(TEN_LOAI_PHAN_DOI[l].toLowerCase()))) return l;
    return null;
  };
  const cacCauKhach = lichSu.filter((l) => l.vai === "khach").map((l) => loaiCuaCau(l.noi_dung)).filter((l): l is LoaiPhanDoi => !!l);
  const daNeu = persona.phan_doi_chinh.filter((p) => cacCauKhach.includes(p));
  const conLai = persona.phan_doi_chinh.filter((p) => !daNeu.includes(p));
  const xuLyTot = TU_LANG_NGHE.test(tinNhanSale) && (TU_GIA_TRI.test(tinNhanSale) || demCauHoi(tinNhanSale) > 0);
  const cauKhachCuoi = [...lichSu].reverse().find((l) => l.vai === "khach");
  const cuoi = cauKhachCuoi ? loaiCuaCau(cauKhachCuoi.noi_dung) : null; // chỉ đẩy lại khi câu khách NGAY TRƯỚC là phản đối
  if (luotSale === 1) {
    return { noi_dung: `Chào ${tinNhanSale.includes("anh") ? "em" : "bạn"}, mình là ${persona.ten}, ${persona.chuc_danh.toLowerCase()} ${persona.cong_ty}. Mình đang ${persona.muc_tieu.toLowerCase().replace(/\.$/, "")}, nhưng vấn đề là ${persona.noi_dau.toLowerCase().replace(/\.$/, "")}. Bên bạn giúp được gì?`, cam_xuc: "trung_tinh", phan_doi_dang_neu: null, san_sang_chot: 20, ket_thuc: false };
  }
  if (cuoi && !xuLyTot && luotSale <= 8) {
    return { noi_dung: `${DAY_LAI}${TEN_LOAI_PHAN_DOI[cuoi].toLowerCase()}. Bạn nói cụ thể hơn được không?`, cam_xuc: "tieu_cuc", phan_doi_dang_neu: cuoi, san_sang_chot: 30, ket_thuc: false };
  }
  if (conLai.length) {
    const p = conLai[0];
    return { noi_dung: CAU_PHAN_DOI[p], cam_xuc: "trung_tinh", phan_doi_dang_neu: p, san_sang_chot: 40 + daNeu.length * 15, ket_thuc: false };
  }
  if (TU_CHOT.test(tinNhanSale)) {
    return { noi_dung: "Nghe hợp lý đấy. Vậy bạn gửi mình tài liệu và báo giá chi tiết nhé, mình sẽ xem và phản hồi trong tuần này.", cam_xuc: "tich_cuc", phan_doi_dang_neu: null, san_sang_chot: 85, ket_thuc: true };
  }
  return { noi_dung: "Ừm, mình hiểu rồi. Vậy nếu làm thì bước tiếp theo là gì?", cam_xuc: "tich_cuc", phan_doi_dang_neu: null, san_sang_chot: 70, ket_thuc: false };
}

export function chamLuyenTapMau(lichSu: LuotHoiThoai[]): KetQuaLuyenTap {
  const { diem, phanDoi, ruiRo } = chamTheoLuat(lichSu);
  const yeu = xepTheoDiem(diem).slice(0, 2);
  const manh = xepTheoDiem(diem).slice(-2).reverse();
  const TEN: Record<KyNang, string> = { khai_thac: "khai thác nhu cầu", lang_nghe: "lắng nghe", gia_tri: "trình bày giá trị", phan_doi: "xử lý phản đối", chot: "chốt", tuan_thu: "tuân thủ" };
  const goiY = lichSu.map((l, i) => ({ l, i })).filter(({ l }) => l.vai === "sale" && !TU_LANG_NGHE.test(l.noi_dung) && demCauHoi(l.noi_dung) === 0).slice(0, 3)
    .map(({ i }) => ({ luot: i + 1, van_de: "Trả lời thẳng mà chưa ghi nhận ý khách, cũng không hỏi lại.", cau_tot_hon: "Dạ em hiểu, anh/chị đang lo về … Cho em hỏi thêm: hiện tại … thế nào ạ?" }));
  return {
    diem,
    nhan_xet_chung: `(Chấm theo luật — chưa có AI) Điểm mạnh: ${manh.map((k) => TEN[k]).join(", ")}. Cần cải thiện: ${yeu.map((k) => TEN[k]).join(", ")}.${ruiRo.length ? " Có câu vi phạm tuân thủ." : ""}`,
    diem_manh: manh.map((k) => `Làm tốt phần ${TEN[k]}.`),
    can_cai_thien: yeu.map((k) => `Luyện thêm ${TEN[k]}.`),
    goi_y_theo_luot: goiY,
    phan_doi_da_gap: phanDoi.map((p) => ({ loai: p.loai, xu_ly_tot: p.tot, ghi_chu: p.tot ? "Có ghi nhận và nêu giá trị." : "Chưa ghi nhận cảm xúc khách trước khi trả lời." })),
  };
}

/** Tách transcript văn bản thành lượt: mỗi dòng «Tên: nội dung»; tên chứa «sale|nv|nhân viên» hoặc trùng tên sale → sale. */
export function tachTranscript(text: string, tenSale?: string): LuotHoiThoai[] {
  const luot: LuotHoiThoai[] = [];
  const ts = (tenSale ?? "").toLowerCase();
  for (const dongGoc of text.split(/\r?\n/)) {
    const dong = dongGoc.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "").trim();
    if (!dong) continue;
    const m = dong.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
    if (!m) { if (luot.length) luot[luot.length - 1].noi_dung += " " + dong; continue; }
    const ten = m[1].trim().toLowerCase();
    const laSale = /(sale|nv|nhân viên|tư vấn|bạn)/.test(ten) || (!!ts && ten.includes(ts));
    luot.push({ vai: laSale ? "sale" : "khach", noi_dung: m[2].trim(), luc: "" });
  }
  return luot;
}

export function phanTichCuocGoiMau(luot: LuotHoiThoai[]): PhanTichCuocGoi {
  const { diem, soCauHoi, tyLeSaleNoi, phanDoi, ruiRo } = chamTheoLuat(luot);
  const sale = luot.filter((l) => l.vai === "sale");
  const camKet = sale.filter((l) => /(em sẽ|sẽ gửi|gửi cho|hẹn|gọi lại|liên hệ lại)/i.test(l.noi_dung)).slice(0, 4)
    .map((l) => ({ noi_dung: l.noi_dung.slice(0, 120), ben: "sale" as const, han: null }));
  const khach = luot.filter((l) => l.vai === "khach");
  const nhuCau = khach.filter((l) => /(muốn|cần|mục tiêu|mong|đang tìm)/i.test(l.noi_dung)).slice(0, 3).map((l) => l.noi_dung.slice(0, 120));
  const tich = khach.filter((l) => /(được|hợp lý|ok|hay|tốt|đồng ý)/i.test(l.noi_dung)).length, tieu = khach.filter((l) => /(không|chưa|khó|đắt|bận)/i.test(l.noi_dung)).length;
  return {
    tom_tat: { nhu_cau: nhuCau.length ? nhuCau : ["(Chưa nhận diện được nhu cầu rõ ràng)"], phan_doi: phanDoi.map((p) => p.cau.slice(0, 120)), cam_ket: camKet, buoc_tiep: sale.length && TU_CHOT.test(sale[sale.length - 1].noi_dung) ? sale[sale.length - 1].noi_dung.slice(0, 160) : "Chưa có bước tiếp theo rõ ràng." },
    diem,
    vi_du_theo_ky_nang: KY_NANG.map((k) => ({ ky_nang: k, vi_du: "(chế độ dự phòng — không trích ví dụ)" })),
    phan_doi_phat_hien: phanDoi.map((p) => ({ loai: p.loai, noi_dung: p.cau.slice(0, 200), sale_tra_loi: p.traLoi.slice(0, 200), de_xuat_cau_tra_loi: "Ghi nhận cảm xúc → làm rõ bằng một câu hỏi → nêu giá trị gắn nhu cầu → kiểm tra lại." })),
    doan_hay: phanDoi.filter((p) => p.tot).map((p) => ({ loai_phan_doi: p.loai, trich_doan: p.traLoi.slice(0, 300) })),
    ty_le_sale_noi: tyLeSaleNoi,
    so_cau_hoi_sale: soCauHoi,
    cam_xuc_khach: khach.length ? Math.max(-1, Math.min(1, (tich - tieu) / khach.length)) : 0,
    rui_ro_tuan_thu: ruiRo,
  };
}

export function goiHuanLuyenMau(radar: DiemKhung, tenSale: string): GoiHuanLuyen {
  const yeu = xepTheoDiem(radar).slice(0, 2);
  const TEN: Record<KyNang, string> = { khai_thac: "Khai thác nhu cầu", lang_nghe: "Lắng nghe chủ động", gia_tri: "Trình bày giá trị", phan_doi: "Xử lý phản đối", chot: "Kỹ thuật chốt", tuan_thu: "Tuân thủ và đạo đức bán hàng" };
  const LOAI: Record<KyNang, LoaiPhanDoi> = { khai_thac: "nhu_cau", lang_nghe: "niem_tin", gia_tri: "gia", phan_doi: "gia", chot: "quyet_dinh", tuan_thu: "niem_tin" };
  return {
    tom_tat: `(Gói dự phòng theo luật) ${tenSale} cần ưu tiên ${yeu.map((k) => TEN[k].toLowerCase()).join(" và ")}.`,
    diem_yeu: yeu,
    bai_de_xuat: yeu.map((k) => ({ tieu_de: TEN[k], ly_do: `Điểm ${radar[k]}/100, thấp nhất trong khung.` })),
    bai_tap: yeu.map((k) => ({ ten: `Role-play luyện ${TEN[k].toLowerCase()}`, tinh_huong: "Khách nêu phản đối đúng loại, sale phải ghi nhận, làm rõ rồi nêu giá trị.", loai_phan_doi: LOAI[k], muc_tieu: `Đạt ≥ 80 điểm tiêu chí ${TEN[k].toLowerCase()} trong 2 phiên liên tiếp.` })),
    loi_khuyen: ["Mở đầu bằng câu hỏi mở, không thuyết trình.", "Ghi nhận cảm xúc khách trước khi trả lời phản đối.", "Kết thúc mọi cuộc gọi bằng bước tiếp theo có thời hạn."],
  };
}

/** Copilot dự phòng (không AI): bắt phản đối bằng từ khóa + câu hỏi khai thác theo giai đoạn + cảnh báo tuân thủ tức thì. */
export function copilotMau(luot: LuotHoiThoai[], kho: { loai: LoaiPhanDoi; cau_tra_loi_chuan: string }[]): GoiYCopilot {
  const khach = [...luot].reverse().find((l) => l.vai === "khach");
  const loai = khach ? doanLoaiPhanDoi(khach.noi_dung) : "khac";
  const chuan = loai !== "khac" ? kho.find((k) => k.loai === loai)?.cau_tra_loi_chuan : undefined;
  const { ruiRo, soCauHoi } = chamTheoLuat(luot);
  const giaiDoan = soCauHoi < 2 ? "khai_thac" : luot.length < 8 ? "gia_tri" : "chot";
  const cauHoi = giaiDoan === "khai_thac" ? ["Hiện tại anh/chị đang xử lý việc này thế nào ạ?", "Điều gì khiến anh/chị chưa hài lòng nhất?", "Nếu giải quyết được thì khác gì cho mình ạ?"]
    : giaiDoan === "gia_tri" ? ["Ngân sách dự kiến của mình khoảng bao nhiêu ạ?", "Ai cùng anh/chị ra quyết định?", "Anh/chị muốn bắt đầu khi nào?"] : ["Mình chốt bước tiếp theo là gì ạ?", "Em gửi tài liệu và hẹn lịch cụ thể được không ạ?"];
  const tich = khach && /(được|hợp lý|ok|hay|tốt|đồng ý|quan tâm)/i.test(khach.noi_dung), tieu = khach && /(không|chưa|khó|đắt|bận|thôi)/i.test(khach.noi_dung);
  return {
    noi_tiep: chuan ? chuan.split(/(?<=[.?!])\s/).slice(0, 2).join(" ") : giaiDoan === "khai_thac" ? "Dạ em hiểu. " + cauHoi[0] : giaiDoan === "gia_tri" ? "Dạ, với tình huống đó thì điểm hợp nhất với mình là … Anh/chị thấy sao ạ?" : "Dạ, vậy em đề xuất bước tiếp theo: em gửi tài liệu ngay và hẹn mình … nhé?",
    cau_hoi_nen_hoi: cauHoi.slice(0, 3),
    phan_doi: loai !== "khac" ? { loai, cau_tra_loi: chuan ?? "Ghi nhận cảm xúc → hỏi làm rõ → nêu giá trị gắn nhu cầu → kiểm tra lại." } : null,
    canh_bao: ruiRo.slice(0, 3).map((r) => `Câu có rủi ro tuân thủ: ${r}`),
    tin_hieu: tich && !tieu ? "tich_cuc" : tieu ? "tieu_cuc" : "trung_tinh",
    san_sang_chot: Math.min(100, 20 + luot.filter((l) => l.vai === "khach").length * 10 + (tich ? 20 : 0) - (tieu ? 15 : 0)),
    buoc_tiep: giaiDoan === "chot" ? "Đề xuất lịch cụ thể (ngày, giờ) và gửi tài liệu ngay sau cuộc gọi." : "Chưa chốt: tiếp tục khai thác thêm 1–2 câu rồi mới trình bày.",
  };
}
