// Test DB: RLS chéo workspace, mốc tiến độ phát một lần, role-play dự phòng, chứng chỉ công khai. Cần Postgres local (DATABASE_URL).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool, poolChu, dongPool } from "./ket-noi";
import { apMigration } from "./khoi-tao";
import { voiWorkspace, truyNenTang } from "@/services/workspace-guard";
import { ghiTienDoBai, chiTietKhoa, ghiDanh, tienDoCuaToi } from "@/services/dao-tao";
import { taoPhien, guiLuot, ketThucPhien } from "@/services/luyen-tap";
import { napVaPhanTich, danhSachNhiemVu, capNhatNhiemVu } from "@/services/cuoc-goi";
import { bangXepHang } from "@/services/diem";
import { khoPhanDoi } from "@/services/kich-ban";

process.env.AI_MODE = "khong"; // ép dự phòng: test không gọi Claude
delete process.env.ANTHROPIC_API_KEY;

let wsA = "", wsB = "", saleA = "", saleB = "", khoaA = "", emailA = "";
beforeAll(async () => {
  await apMigration();
  const p = poolChu();
  await p.query("select set_config('app.nen_tang','1',false)");
  const t = Date.now();
  wsA = (await p.query<{ id: string }>("insert into workspace(ten, slug) values ($1,$2) returning id", ["Test A", `test-a-${t}`])).rows[0].id;
  wsB = (await p.query<{ id: string }>("insert into workspace(ten, slug) values ($1,$2) returning id", ["Test B", `test-b-${t}`])).rows[0].id;
  emailA = `a-${t}@test.vn`;
  saleA = await voiWorkspace(wsA, async (q) => (await q.query<{ id: string }>("insert into nguoi_dung(workspace_id, email, ten, vai_tro) values ($1,$2,'Sale A','sale') returning id", [wsA, emailA])).rows[0].id);
  saleB = await voiWorkspace(wsB, async (q) => (await q.query<{ id: string }>("insert into nguoi_dung(workspace_id, email, ten, vai_tro) values ($1,$2,'Sale B','sale') returning id", [wsB, `b-${t}@test.vn`])).rows[0].id);
  khoaA = await voiWorkspace(wsA, async (q) => {
    const k = (await q.query<{ id: string }>("insert into khoa_hoc(workspace_id, ten, nguong_hoan_thanh, chong_tua_ao) values ($1,'Khóa A',80,true) returning id", [wsA])).rows[0].id;
    const m1 = (await q.query<{ id: string }>("insert into module_hoc(workspace_id, khoa_hoc_id, ten, thu_tu) values ($1,$2,'M1',0) returning id", [wsA, k])).rows[0].id;
    const m2 = (await q.query<{ id: string }>("insert into module_hoc(workspace_id, khoa_hoc_id, ten, thu_tu) values ($1,$2,'M2',1) returning id", [wsA, k])).rows[0].id;
    await q.query("insert into bai_hoc(workspace_id, module_hoc_id, ten, thu_tu, loai, thoi_luong_giay) values ($1,$2,'B1',0,'noi_dung',100),($1,$2,'B2',1,'noi_dung',100),($1,$3,'B3',0,'noi_dung',100),($1,$3,'B4',1,'noi_dung',100),($1,$3,'Q',2,'quiz',0)", [wsA, m1, m2]);
    await q.query("update bai_hoc set cau_hoi = $1 where ten = 'Q'", [JSON.stringify([{ hoi: "?", luaChon: ["a", "b"], dapAn: 1 }, { hoi: "?", luaChon: ["a", "b"], dapAn: 0 }])]);
    await q.query("insert into phan_doi(workspace_id, loai, noi_dung, cau_tra_loi_chuan) values ($1,'gia','Giá cao','Ghi nhận...')", [wsA]);
    return k;
  });
});
afterAll(async () => {
  const c = await poolChu().connect();
  try { await c.query("begin"); await c.query("select set_config('app.nen_tang','1',true)"); await c.query("select set_config('app.xoa_du_lieu','1',true)"); await c.query("delete from workspace where id = any($1) or slug like 'test-%'", [[wsA, wsB]]); await c.query("commit"); }
  catch (e) { await c.query("rollback"); console.error("dọn test:", (e as Error).message); } finally { c.release(); }
  await dongPool();
});

describe("RLS theo workspace", () => {
  it("workspace A không thấy dữ liệu B và ngược lại", async () => {
    const a = await voiWorkspace(wsA, async (q) => (await q.query("select id from nguoi_dung")).rows);
    const b = await voiWorkspace(wsB, async (q) => (await q.query("select id from nguoi_dung")).rows);
    expect(a.map((r) => r.id)).toEqual([saleA]); expect(b.map((r) => r.id)).toEqual([saleB]);
    const khoaTuB = await voiWorkspace(wsB, (q) => chiTietKhoa(q, khoaA));
    expect(khoaTuB).toBeNull();
  });
  it("không có ngữ cảnh → không thấy gì; chèn sai workspace_id bị chặn", async () => {
    expect((await pool().query("select count(*)::int as n from nguoi_dung")).rows[0].n).toBe(0);
    await expect(voiWorkspace(wsA, (q) => q.query("insert into san_pham(workspace_id, ten) values ($1,'lậu')", [wsB]))).rejects.toThrow();
  });
  it("bảng bất biến chặn update/delete; chỉ pipeline xóa dữ liệu (cờ app.xoa_du_lieu) mới xóa được", async () => {
    await expect(voiWorkspace(wsA, async (q) => { await q.query("insert into su_kien(workspace_id, loai) values ($1,'x')", [wsA]); await q.query("delete from su_kien"); })).rejects.toThrow(/bất biến/);
    await voiWorkspace(wsA, async (q) => { await q.query("select set_config('app.xoa_du_lieu','1',true)"); await q.query("delete from su_kien where loai = 'x'"); });
  });
  it("tra cứu nền tảng qua SECURITY DEFINER", async () => {
    const r = await truyNenTang<{ id: string }>("select id from tim_nguoi_dung_theo_email($1)", [emailA]);
    expect(r[0]?.id).toBe(saleA);
  });
});

describe("LMS F-127/F-129", () => {
  it("mốc phát đúng một lần, chống tua ảo, chứng chỉ khi 100%, học lại không cộng điểm", async () => {
    const ct = (await voiWorkspace(wsA, (q) => chiTietKhoa(q, khoaA)))!;
    const bai = ct.modules.flatMap((m) => m.bai);
    const chung = { workspaceId: wsA, nguoiDungId: saleA, tenNguoi: "Sale A", khoaId: khoaA };
    const r1 = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[0].id, giayDaHoc: 30 }));
    expect(r1.hopLe).toBe(false); expect(r1.phanTram).toBe(0);
    const r2 = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[0].id, giayDaHoc: 70 }));
    expect(r2.hopLe).toBe(true); expect(r2.phanTram).toBe(20); expect(r2.diemCong).toBe(50);
    const r3 = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[1].id, giayDaHoc: 100 }));
    expect(r3.mocMoi).toContain(`module_hoan_thanh:${ct.modules[0].id}`);
    const r3b = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[1].id, giayDaHoc: 100 }));
    expect(r3b.mocMoi).toEqual([]); expect(r3b.diemCong).toBe(0); // học lại: không mốc, không điểm
    await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[2].id, giayDaHoc: 100 }));
    const r5 = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[3].id, giayDaHoc: 100 }));
    expect(r5.phanTram).toBe(80); expect(r5.mocMoi).toContain("nguong_khoa");
    const q1 = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[4].id, traLoi: [0, 0] }));
    expect(q1.hopLe).toBe(false); expect(q1.diemQuiz).toBe(50); expect(q1.chungChiMa).toBeNull();
    const q2 = await voiWorkspace(wsA, (q) => ghiTienDoBai(q, { ...chung, baiId: bai[4].id, traLoi: [1, 0] }));
    expect(q2.hopLe).toBe(true); expect(q2.phanTram).toBe(100); expect(q2.mocMoi).toContain("hoan_thanh_khoa"); expect(q2.chungChiMa).toMatch(/^TST-/);
    const td = await voiWorkspace(wsA, (q) => tienDoCuaToi(q, saleA, khoaA));
    expect(td.chungChiMa).toBe(q2.chungChiMa);
    const cc = await truyNenTang<{ ten_nguoi: string }>("select * from tra_chung_chi($1)", [q2.chungChiMa]);
    expect(cc[0].ten_nguoi).toBe("Sale A");
    const moc = await voiWorkspace(wsA, async (q) => (await q.query("select payload->>'moc' as moc from su_kien where loai = 'course_progress_milestone'")).rows.map((r) => r.moc));
    expect(moc.filter((m) => m === "hoan_thanh_khoa").length).toBe(1); expect(moc.filter((m) => m === "nguong_khoa").length).toBe(1);
    const bxh = await voiWorkspace(wsA, (q) => bangXepHang(q, { nguoiXemId: saleA }));
    expect(bxh[0].diem).toBeGreaterThanOrEqual(50 * 5 + 100 + 300);
  });
  it("ghi danh idempotent", async () => {
    const a = await voiWorkspace(wsA, (q) => ghiDanh(q, { workspaceId: wsA, nguoiDungId: saleA, khoaId: khoaA }));
    const b = await voiWorkspace(wsA, (q) => ghiDanh(q, { workspaceId: wsA, nguoiDungId: saleA, khoaId: khoaA }));
    expect(a).toBe(b);
  });
});

describe("Role-play và cuộc gọi (chế độ dự phòng)", () => {
  it("tạo phiên → lượt → chấm, cộng điểm, không chấm lại", async () => {
    const { id, cheDo } = await voiWorkspace(wsA, (q) => taoPhien(q, { workspaceId: wsA, nguoiDungId: saleA, sanPhamId: null, doKho: "de", phanDoiUuTien: ["gia"] }));
    expect(cheDo).toBe("du_phong");
    await expect(voiWorkspace(wsA, (q) => ketThucPhien(q, { workspaceId: wsA, phienId: id, nguoiDungId: saleA }))).rejects.toThrow(/ít nhất 2 lượt/);
    const l1 = await voiWorkspace(wsA, (q) => guiLuot(q, { workspaceId: wsA, phienId: id, nguoiDungId: saleA, tinNhan: "Dạ chào chị, em là A bên Công ty Demo. Chị đang gặp khó gì ạ?" }));
    expect(l1.lichSu.length).toBe(2);
    await voiWorkspace(wsA, (q) => guiLuot(q, { workspaceId: wsA, phienId: id, nguoiDungId: saleA, tinNhan: "Dạ em hiểu. Em xin hỏi thêm ngân sách dự kiến thế nào ạ?" }));
    const kq = await voiWorkspace(wsA, (q) => ketThucPhien(q, { workspaceId: wsA, phienId: id, nguoiDungId: saleA }));
    expect(kq.diemTong).toBeGreaterThan(0); expect(kq.diemCong).toBeGreaterThan(0);
    const kq2 = await voiWorkspace(wsA, (q) => ketThucPhien(q, { workspaceId: wsA, phienId: id, nguoiDungId: saleA }));
    expect(kq2.diemCong).toBe(0);
    await expect(voiWorkspace(wsA, (q) => guiLuot(q, { workspaceId: wsA, phienId: id, nguoiDungId: saleA, tinNhan: "x" }))).rejects.toThrow(/kết thúc/);
    await expect(voiWorkspace(wsB, (q) => guiLuot(q, { workspaceId: wsB, phienId: id, nguoiDungId: saleB, tinNhan: "x" }))).rejects.toThrow(/Không tìm thấy/);
  });
  it("nạp transcript → phân tích, phản đối mới vào hàng duyệt, nhiệm vụ từ cam kết (hủy cần lý do)", async () => {
    const tr = `Sale A: Dạ chào anh, em là A bên Công ty Demo. Anh đang cần gì ạ?
Khách: Anh muốn tự động hóa. Nhưng để anh hỏi lại sếp đã.
Sale A: Dạ em hiểu, em sẽ gửi anh tài liệu tóm tắt và hẹn gọi lại thứ 5 nhé?
Khách: Ok em.`;
    const r = await voiWorkspace(wsA, (q) => napVaPhanTich(q, { workspaceId: wsA, nguoiDungId: saleA, tenSale: "Sale A", sanPhamId: null, tenKhach: "Anh X", ketQua: "hen", transcript: tr, thoiLuongGiay: 300 }));
    expect(r.cheDo).toBe("du_phong"); expect(r.phanDoiMoi).toBe(1); // quyet_dinh chưa có trong kho → nháp
    const kho = await voiWorkspace(wsA, (q) => khoPhanDoi(q, { trangThai: "nhap" }));
    expect(kho.some((p) => p.loai === "quyet_dinh" && p.nguon === "ai_de_xuat")).toBe(true);
    expect(r.nhiemVu).toBeGreaterThanOrEqual(1);
    const nv = await voiWorkspace(wsA, (q) => danhSachNhiemVu(q, { nguoiDungId: saleA }));
    expect(nv.length).toBeGreaterThanOrEqual(1);
    await expect(voiWorkspace(wsA, (q) => capNhatNhiemVu(q, { id: nv[0].id, nguoiDungId: saleA, vaiTro: "sale", trangThai: "huy" }))).rejects.toThrow(/lý do/);
    await voiWorkspace(wsA, (q) => capNhatNhiemVu(q, { id: nv[0].id, nguoiDungId: saleA, vaiTro: "sale", trangThai: "xong" }));
    await expect(voiWorkspace(wsA, (q) => napVaPhanTich(q, { workspaceId: wsA, nguoiDungId: saleA, tenSale: "Sale A", sanPhamId: null, tenKhach: "Y", ketQua: "khac", transcript: "chỉ có một dòng không có tên", thoiLuongGiay: null }))).rejects.toThrow();
  });
});
