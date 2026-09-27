import { describe, expect, it } from "vitest";
import { chuanHoaDiem, diemTong, trungBinhKhung, xepTheoDiem, nhanXetDiem, KY_NANG } from "./khung-ky-nang";
import { doanLoaiPhanDoi } from "./phan-doi";
import { xepHang, hangKeTiep, tinhChuoiNgay, tenBangXepHang, ngayTheoMuiGio, DIEM_SU_KIEN } from "./gamification";
import { phanTramKhoa, hoanThanhHopLe, mocCanPhat, khoaMoc, chamQuiz } from "./tien-do";
import { maChungChi, laMaChungChi } from "./chung-chi";
import { bocJson } from "./boc-json";
import { bamMatKhau, kiemMatKhau, matKhauDuManh } from "./mat-khau";
import { coQuyen, xemDuocDiem } from "./phan-quyen";
import { chamTheoLuat, khachTraLoiMau, sinhPersonaMau, chamLuyenTapMau, tachTranscript, phanTichCuocGoiMau, goiHuanLuyenMau } from "./du-phong-ai";
import { ketQuaLuyenTapSchema, phanTichCuocGoiSchema, goiHuanLuyenSchema, luotKhachSchema, personaSchema } from "./ai-kieu";
import type { LuotHoiThoai } from "./ai-kieu";

describe("khung kỹ năng", () => {
  it("chuẩn hóa: thiếu → 0, ngoài biên → kẹp", () => {
    const d = chuanHoaDiem({ khai_thac: 120, lang_nghe: -5, gia_tri: "77", chot: 50.6 });
    expect(d).toEqual({ khai_thac: 100, lang_nghe: 0, gia_tri: 77, phan_doi: 0, chot: 51, tuan_thu: 0 });
  });
  it("tổng, trung bình, xếp theo điểm", () => {
    const a = chuanHoaDiem({ khai_thac: 80, lang_nghe: 60, gia_tri: 70, phan_doi: 40, chot: 90, tuan_thu: 100 });
    const b = chuanHoaDiem({ khai_thac: 60, lang_nghe: 80, gia_tri: 70, phan_doi: 60, chot: 70, tuan_thu: 100 });
    expect(diemTong(a)).toBe(73);
    expect(trungBinhKhung([a, b])).toEqual({ khai_thac: 70, lang_nghe: 70, gia_tri: 70, phan_doi: 50, chot: 80, tuan_thu: 100 });
    expect(trungBinhKhung([])).toBeNull();
    expect(xepTheoDiem(a)[0]).toBe("phan_doi");
    expect(xepTheoDiem(a).at(-1)).toBe("tuan_thu");
    expect(nhanXetDiem(92)).toBe("Xuất sắc"); expect(nhanXetDiem(64)).toBe("Cần cải thiện");
  });
});

describe("phản đối", () => {
  it("đoán loại theo từ khóa", () => {
    expect(doanLoaiPhanDoi("Giá này đắt quá em ơi")).toBe("gia");
    expect(doanLoaiPhanDoi("Để tháng sau anh tính, đang bận")).toBe("thoi_gian");
    expect(doanLoaiPhanDoi("Anh phải hỏi lại sếp đã")).toBe("quyet_dinh");
    expect(doanLoaiPhanDoi("Bên anh đang dùng bên khác rồi")).toBe("doi_thu");
    expect(doanLoaiPhanDoi("Cảm ơn em nhé")).toBe("khac");
  });
});

describe("gamification F-129", () => {
  it("hạng theo điểm", () => {
    expect(xepHang(0)).toBe("Bronze"); expect(xepHang(4999)).toBe("Bronze"); expect(xepHang(5000)).toBe("Silver");
    expect(xepHang(15000)).toBe("Gold"); expect(xepHang(40000)).toBe("Diamond");
    expect(hangKeTiep(4000)).toEqual({ ten: "Silver", conThieu: 1000 });
    expect(hangKeTiep(50000)).toBeNull();
  });
  it("chuỗi ngày liên tiếp: hôm nay hoặc hôm qua còn sống, đứt thì 0", () => {
    expect(tinhChuoiNgay(["2026-09-26", "2026-09-25", "2026-09-24", "2026-09-22"], "2026-09-26")).toBe(3);
    expect(tinhChuoiNgay(["2026-09-25", "2026-09-24"], "2026-09-26")).toBe(2);
    expect(tinhChuoiNgay(["2026-09-23"], "2026-09-26")).toBe(0);
    expect(tinhChuoiNgay([], "2026-09-26")).toBe(0);
  });
  it("tên bảng xếp hạng tôn trọng ẩn danh, mặc định rút gọn", () => {
    expect(tenBangXepHang("Nguyễn Văn An", false, "x")).toBe("Nguyễn V. An");
    expect(tenBangXepHang("An", false, "x")).toBe("An");
    expect(tenBangXepHang("Nguyễn Văn An", true, "9d5c1a5b-0000-0000-0000-0000deadbeef")).toBe("Thành viên #BEEF");
  });
  it("ngày theo múi giờ VN", () => {
    expect(ngayTheoMuiGio(new Date("2026-09-26T18:30:00Z"))).toBe("2026-09-27");
    expect(DIEM_SU_KIEN.hoan_thanh_khoa).toBeGreaterThan(DIEM_SU_KIEN.hoan_thanh_bai);
  });
});

describe("tiến độ F-127", () => {
  it("phần trăm và hoàn thành hợp lệ", () => {
    expect(phanTramKhoa(3, 12)).toBe(25); expect(phanTramKhoa(0, 0)).toBe(0); expect(phanTramKhoa(13, 12)).toBe(100);
    expect(hoanThanhHopLe({ loai: "video", thoiLuongGiay: 100, giayDaHoc: 59, chongTuaAo: true })).toBe(false);
    expect(hoanThanhHopLe({ loai: "video", thoiLuongGiay: 100, giayDaHoc: 60, chongTuaAo: true })).toBe(true);
    expect(hoanThanhHopLe({ loai: "video", thoiLuongGiay: 100, giayDaHoc: 0, chongTuaAo: false })).toBe(true);
    expect(hoanThanhHopLe({ loai: "quiz", thoiLuongGiay: 0, giayDaHoc: 0, diemQuiz: 69, chongTuaAo: true })).toBe(false);
    expect(hoanThanhHopLe({ loai: "quiz", thoiLuongGiay: 0, giayDaHoc: 0, diemQuiz: 70, chongTuaAo: true })).toBe(true);
  });
  it("mốc phát đúng một lần (idempotent)", () => {
    const l1 = mocCanPhat({ phanTram: 80, nguong: 80, modulesXong: ["m1"], daPhat: [] });
    expect(l1.map(khoaMoc)).toEqual(["module_hoan_thanh:m1", "nguong_khoa"]);
    const l2 = mocCanPhat({ phanTram: 85, nguong: 80, modulesXong: ["m1"], daPhat: l1.map(khoaMoc) });
    expect(l2).toEqual([]);
    const l3 = mocCanPhat({ phanTram: 100, nguong: 80, modulesXong: ["m1", "m2"], daPhat: l1.map(khoaMoc) });
    expect(l3.map(khoaMoc)).toEqual(["module_hoan_thanh:m2", "hoan_thanh_khoa"]);
  });
  it("chấm quiz", () => {
    const ch = [{ hoi: "a", luaChon: ["1", "2"], dapAn: 1 }, { hoi: "b", luaChon: ["1", "2"], dapAn: 0 }, { hoi: "c", luaChon: ["1", "2"], dapAn: 0 }];
    expect(chamQuiz(ch, [1, 0, 1])).toEqual({ diem: 67, dung: 2, tong: 3 });
    expect(chamQuiz([], [])).toEqual({ diem: 0, dung: 0, tong: 0 });
  });
});

describe("chứng chỉ", () => {
  it("mã tất định và đúng định dạng", () => {
    const a = maChungChi("ws", "u", "k", 2026), b = maChungChi("ws", "u", "k", 2026), c = maChungChi("ws", "u2", "k", 2026);
    expect(a).toBe(b); expect(a).not.toBe(c); expect(laMaChungChi(a)).toBe(true); expect(laMaChungChi("abc")).toBe(false);
  });
});

describe("bóc JSON + mật khẩu + quyền", () => {
  it("bóc JSON từ nhiều dạng", () => {
    expect(bocJson('{"a":1}')).toEqual({ a: 1 });
    expect(bocJson('Đây là kết quả:\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(bocJson('blah {"a":3} xong')).toEqual({ a: 3 });
    expect(() => bocJson("không có gì")).toThrow();
  });
  it("scrypt và độ mạnh", () => {
    const h = bamMatKhau("Demo@2026");
    expect(kiemMatKhau("Demo@2026", h)).toBe(true); expect(kiemMatKhau("sai", h)).toBe(false); expect(kiemMatKhau("x", null)).toBe(false);
    expect(matKhauDuManh("Demo@2026")).toBeNull(); expect(matKhauDuManh("aaaaaaaa")).not.toBeNull(); expect(matKhauDuManh("abc")).not.toBeNull();
  });
  it("phân quyền", () => {
    expect(coQuyen("quan_ly", "duyet")).toBe(true); expect(coQuyen("sale", "duyet")).toBe(false);
    expect(xemDuocDiem("sale", "u1", "u1")).toBe(true); expect(xemDuocDiem("sale", "u1", "u2")).toBe(false); expect(xemDuocDiem("quan_ly", "u1", "u2")).toBe(true);
  });
});

const HOI_THOAI_TOT: LuotHoiThoai[] = [
  { vai: "sale", noi_dung: "Dạ chào chị, em là Minh bên Công ty Demo. Chị cho em hỏi hiện tại đội sale bên mình đang theo dõi khách thế nào ạ?", luc: "" },
  { vai: "khach", noi_dung: "Bên chị dùng Excel, mà lead rơi nhiều lắm.", luc: "" },
  { vai: "sale", noi_dung: "Dạ em hiểu, tức là lead vào nhưng không ai chăm kịp đúng không ạ? Vậy mục tiêu chị muốn trong 3 tháng tới là gì?", luc: "" },
  { vai: "khach", noi_dung: "Muốn tăng tỷ lệ chốt. Nhưng giá bên em cao quá, ngân sách chị có hạn.", luc: "" },
  { vai: "sale", noi_dung: "Dạ em ghi nhận, chị lo về chi phí là đúng. Khách hàng trước của em, Cty An Phát, tiết kiệm 30% thời gian chăm sóc sau 2 tháng. Nếu tính trên số lead đang rơi thì lợi ích vượt chi phí. Chị thấy hợp lý không ạ?", luc: "" },
  { vai: "khach", noi_dung: "Ừ nghe cũng được.", luc: "" },
  { vai: "sale", noi_dung: "Vậy em gửi báo giá và hẹn chị demo thứ 5 tuần này 10h nhé?", luc: "" },
  { vai: "khach", noi_dung: "Ok em.", luc: "" },
];
const HOI_THOAI_XAU: LuotHoiThoai[] = [
  { vai: "sale", noi_dung: "Chào chị, sản phẩm bên em tốt nhất thị trường, cam kết 100% hiệu quả, chắc chắn thành công.", luc: "" },
  { vai: "khach", noi_dung: "Giá cao quá.", luc: "" },
  { vai: "sale", noi_dung: "Không cao đâu chị, mua đi.", luc: "" },
];

describe("dự phòng AI: chấm theo luật", () => {
  it("hội thoại tốt điểm cao hơn hội thoại xấu, phát hiện phản đối và rủi ro tuân thủ", () => {
    const tot = chamTheoLuat(HOI_THOAI_TOT), xau = chamTheoLuat(HOI_THOAI_XAU);
    expect(diemTong(tot.diem)).toBeGreaterThan(diemTong(xau.diem));
    expect(tot.phanDoi.length).toBe(1); expect(tot.phanDoi[0].loai).toBe("gia"); expect(tot.phanDoi[0].tot).toBe(true);
    expect(xau.phanDoi[0].tot).toBe(false);
    expect(xau.ruiRo.length).toBeGreaterThan(0); expect(xau.diem.tuan_thu).toBeLessThan(80); expect(tot.diem.tuan_thu).toBe(100);
    expect(tot.soCauHoi).toBeGreaterThanOrEqual(4);
    expect(tot.diem.chot).toBeGreaterThanOrEqual(75); expect(xau.diem.chot).toBeLessThan(50);
  });
  it("kết quả chấm role-play đúng lược đồ", () => {
    const kq = chamLuyenTapMau(HOI_THOAI_TOT);
    expect(ketQuaLuyenTapSchema.safeParse(kq).success).toBe(true);
    expect(kq.phan_doi_da_gap[0].xu_ly_tot).toBe(true);
  });
  it("khách mẫu nêu lần lượt phản đối rồi chốt khi được xử lý", () => {
    const persona = sinhPersonaMau("vua", 0, ["gia", "niem_tin"]);
    expect(personaSchema.safeParse(persona).success).toBe(true);
    expect(persona.phan_doi_chinh).toEqual(["gia", "niem_tin"]);
    const ls: LuotHoiThoai[] = [];
    const s1 = "Dạ chào chị, em là Minh bên Công ty Demo ạ. Chị cho em hỏi bên mình đang gặp khó gì?";
    const k1 = khachTraLoiMau(persona, ls, s1); ls.push({ vai: "sale", noi_dung: s1, luc: "" }, { vai: "khach", noi_dung: k1.noi_dung, luc: "" });
    expect(k1.ket_thuc).toBe(false);
    const s2 = "Dạ em hiểu, chị đang cần tự động hóa. Em xin hỏi thêm ngân sách dự kiến bên mình thế nào ạ?";
    const k2 = khachTraLoiMau(persona, ls, s2); ls.push({ vai: "sale", noi_dung: s2, luc: "" }, { vai: "khach", noi_dung: k2.noi_dung, luc: "" });
    expect(k2.phan_doi_dang_neu).toBe("gia");
    const s3 = "Không cao đâu chị.";
    const k3 = khachTraLoiMau(persona, ls, s3); ls.push({ vai: "sale", noi_dung: s3, luc: "" }, { vai: "khach", noi_dung: k3.noi_dung, luc: "" });
    expect(k3.cam_xuc).toBe("tieu_cuc"); // chưa xử lý tốt → khách đẩy lại
    const s4 = "Dạ em ghi nhận, chị lo về chi phí là đúng. Khách hàng trước tiết kiệm 30% chi phí chăm sóc. Chị thấy sao ạ?";
    const k4 = khachTraLoiMau(persona, ls, s4); ls.push({ vai: "sale", noi_dung: s4, luc: "" }, { vai: "khach", noi_dung: k4.noi_dung, luc: "" });
    expect(k4.phan_doi_dang_neu).toBe("niem_tin");
    const s5 = "Dạ em hiểu chị từng thất vọng. Ví dụ khách hàng trước của em cũng vậy, nhưng kết quả sau 2 tháng rất khác. Chị muốn xem case cụ thể không ạ?";
    const k5 = khachTraLoiMau(persona, ls, s5); ls.push({ vai: "sale", noi_dung: s5, luc: "" }, { vai: "khach", noi_dung: k5.noi_dung, luc: "" });
    expect(k5.phan_doi_dang_neu).toBeNull();
    const s6 = "Vậy em gửi tài liệu và hẹn chị demo thứ 5 nhé?";
    const k6 = khachTraLoiMau(persona, ls, s6);
    expect(k6.ket_thuc).toBe(true); expect(k6.san_sang_chot).toBeGreaterThanOrEqual(80);
    expect(luotKhachSchema.safeParse(k6).success).toBe(true);
  });
});

describe("dự phòng AI: transcript và gói huấn luyện", () => {
  it("tách transcript theo dòng «Tên: nội dung», bỏ timecode", () => {
    const l = tachTranscript("[00:12] Minh (sale): Chào chị\n00:20 Chị Lan: Chào em, giá bao nhiêu?\nnói thêm dòng lẻ\nNV Minh: Dạ 19 triệu ạ", "Minh");
    expect(l.length).toBe(3);
    expect(l[0].vai).toBe("sale"); expect(l[1].vai).toBe("khach"); expect(l[1].noi_dung).toBe("Chào em, giá bao nhiêu? nói thêm dòng lẻ"); expect(l[2].vai).toBe("sale");
  });
  it("phân tích cuộc gọi đúng lược đồ và có 4 phần tóm tắt", () => {
    const pt = phanTichCuocGoiMau(HOI_THOAI_TOT);
    expect(phanTichCuocGoiSchema.safeParse(pt).success).toBe(true);
    expect(pt.tom_tat.nhu_cau.length).toBeGreaterThan(0); expect(pt.tom_tat.phan_doi.length).toBe(1);
    expect(pt.tom_tat.cam_ket.length).toBeGreaterThan(0); expect(pt.tom_tat.buoc_tiep).toContain("demo");
    expect(pt.doan_hay.length).toBe(1);
  });
  it("gói huấn luyện đúng lược đồ, nhắm đúng điểm yếu", () => {
    const g = goiHuanLuyenMau(chuanHoaDiem({ khai_thac: 90, lang_nghe: 85, gia_tri: 80, phan_doi: 40, chot: 55, tuan_thu: 100 }), "Minh");
    expect(goiHuanLuyenSchema.safeParse(g).success).toBe(true);
    expect(g.diem_yeu).toEqual(["phan_doi", "chot"]);
    expect(g.bai_tap.length).toBe(2);
  });
  it("mọi tiêu chí đều có mặt trong KY_NANG", () => { expect(KY_NANG.length).toBe(6); });
});

describe("csv + rớt học", () => {
  it("csv có BOM, escape và chặn công thức", async () => {
    const { taoCsv, dongCsv } = await import("./csv");
    expect(dongCsv(["a", 'b"c', "d,e", "=SUM(1)", null])).toBe('a,"b""c","d,e",\'=SUM(1),');
    expect(taoCsv(["x"], [["1"]]).startsWith("﻿")).toBe(true);
  });
  it("mức rủi ro theo ngưỡng", async () => {
    const { mucRuiRo } = await import("./rot-hoc");
    const now = Date.parse("2026-09-27T00:00:00Z");
    expect(mucRuiRo({ hocCuoiLuc: "2026-09-26T00:00:00Z", hoanThanhLuc: null, nguongNgay: 7, bayGio: now }).muc).toBe("thap");
    expect(mucRuiRo({ hocCuoiLuc: "2026-09-23T00:00:00Z", hoanThanhLuc: null, nguongNgay: 7, bayGio: now }).muc).toBe("trung_binh");
    expect(mucRuiRo({ hocCuoiLuc: "2026-09-19T00:00:00Z", hoanThanhLuc: null, nguongNgay: 7, bayGio: now }).muc).toBe("cao");
    expect(mucRuiRo({ hocCuoiLuc: null, hoanThanhLuc: null, nguongNgay: 7, bayGio: now }).muc).toBe("cao");
    expect(mucRuiRo({ hocCuoiLuc: "2026-09-19T00:00:00Z", hoanThanhLuc: "2026-09-20T00:00:00Z", nguongNgay: 7, bayGio: now }).muc).toBe("xong");
  });
});

describe("DNA doanh nghiệp", () => {
  it("độ đầy đủ, tóm tắt, từ cấm", async () => {
    const { DNA_RONG, doDayDuDna, tomTatDna, timTuCam, dnaDaNap } = await import("./dna");
    expect(dnaDaNap(DNA_RONG)).toBe(false); expect(doDayDuDna(DNA_RONG).diem).toBe(0);
    const d = { ...DNA_RONG, ten_doanh_nghiep: "Công ty Demo", nganh: "Đào tạo", mo_ta: "Doanh nghiệp đào tạo kỹ năng bán hàng cho đội ngũ doanh nghiệp nhỏ tại Việt Nam.", usp: ["Coach 1-1", "Hoàn tiền 7 ngày"], tu_cam: ["cam kết 100%", "rẻ nhất"], so_lieu_cho_phep: ["1.200 học viên"] };
    expect(dnaDaNap(d)).toBe(true);
    const dd = doDayDuDna(d); expect(dd.diem).toBeGreaterThan(40); expect(dd.thieu).toContain("Đối thủ");
    const tt = tomTatDna(d); expect(tt).toContain("TỪ CẤM"); expect(tt).toContain("1.200 học viên"); expect(tt.length).toBeLessThanOrEqual(1600);
    expect(timTuCam("Em CAM KẾT 100% anh sẽ có lãi", d.tu_cam)).toEqual(["cam kết 100%"]);
    expect(timTuCam("Bên em có coach", d.tu_cam)).toEqual([]);
  });
});
