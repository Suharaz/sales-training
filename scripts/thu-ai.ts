// Chạy thử toàn bộ luồng role-play + phân tích cuộc gọi với AI THẬT (AI_MODE=cli|api). Dùng: pnpm -s exec tsx scripts/thu-ai.ts
import { voiWorkspace } from "../services/workspace-guard";
import { taoPhien, guiLuot, ketThucPhien } from "../services/luyen-tap";
import { napVaPhanTich } from "../services/cuoc-goi";
import { sinhGoiHuanLuyen } from "../services/huan-luyen";
import { poolChu, dongPool } from "../db/ket-noi";

async function main() {
  const p0 = poolChu();
  await p0.query("select set_config('app.nen_tang','1',false)");
  const ws = (await p0.query<{ id: string }>("select id from workspace where slug=$1", ["demo"])).rows[0].id;
  const sale = (await voiWorkspace(ws, async (q) => (await q.query<{ id: string }>("select id from nguoi_dung where email=$1", ["sale1@demo.vn"])).rows[0])).id;
  const sp = (await voiWorkspace(ws, async (q) => (await q.query<{ id: string }>("select id from san_pham order by tang limit 1")).rows[0])).id;
  const dem = (t: number) => `${((Date.now() - t) / 1000).toFixed(1)}s`;
  let t = Date.now();
  const p = await voiWorkspace(ws, (q) => taoPhien(q, { workspaceId: ws, nguoiDungId: sale, sanPhamId: sp, doKho: "vua", phanDoiUuTien: ["gia"] }));
  const persona = await voiWorkspace(ws, async (q) => (await q.query<{ persona: unknown }>("select persona from phien_luyen_tap where id=$1", [p.id])).rows[0].persona);
  console.log(`[taoPhien] ${p.cheDo} ${dem(t)}\n  PERSONA: ${JSON.stringify(persona).slice(0, 420)}`);
  const luot = [
    "Dạ chào anh/chị, em là Đức bên Công ty Demo. Em thấy mình vừa đăng ký nhận tài liệu về tự động hóa bán hàng. Anh/chị cho em hỏi hiện tại bên mình đang theo dõi khách hàng bằng cách nào ạ?",
    "Dạ em hiểu, tức là lead vào nhưng chưa ai chăm kịp đúng không ạ? Em xin hỏi thêm: nếu 3 tháng nữa nhìn lại, anh/chị muốn thay đổi rõ nhất ở điểm nào?",
    "Dạ em ghi nhận, mức đầu tư này cần cân nhắc là đúng ạ. Học viên trước của em tiết kiệm 30% thời gian chăm sóc sau 2 tháng. Mình có thể chia 3 kỳ. Em gửi anh/chị lộ trình và hẹn demo 15 phút thứ 5 lúc 10h được không ạ?",
  ];
  for (const [i, tin] of luot.entries()) {
    t = Date.now();
    const l = await voiWorkspace(ws, (q) => guiLuot(q, { workspaceId: ws, phienId: p.id, nguoiDungId: sale, tinNhan: tin }));
    console.log(`[luot ${i + 1}] ${l.cheDo} ${dem(t)} | cảm xúc ${l.khach.cam_xuc} | phản đối ${l.khach.phan_doi_dang_neu} | chốt ${l.khach.san_sang_chot}% | kết thúc ${l.khach.ket_thuc}\n  KHÁCH: ${l.khach.noi_dung}`);
    if (l.khach.ket_thuc) break;
  }
  t = Date.now();
  const kq = await voiWorkspace(ws, (q) => ketThucPhien(q, { workspaceId: ws, phienId: p.id, nguoiDungId: sale }));
  console.log(`[cham] ${kq.cheDo} ${dem(t)} | tổng ${kq.diemTong} | ${JSON.stringify(kq.ketQua.diem)} | +${kq.diemCong} điểm\n  NHẬN XÉT: ${kq.ketQua.nhan_xet_chung}\n  GỢI Ý: ${JSON.stringify(kq.ketQua.goi_y_theo_luot).slice(0, 400)}`);
  t = Date.now();
  const tr = `Trần Minh Đức: Dạ chào chị Lan, em là Đức bên Công ty Demo. Chị vừa xem webinar tối qua, chị thấy phần nào hữu ích ạ?
Chị Lan: Phần chatbot. Nhưng chị đang dùng phần mềm bên khác rồi, đổi thì phiền lắm.
Trần Minh Đức: Dạ em hiểu, chuyển đổi hệ thống là việc lớn. Chị hài lòng nhất và chưa hài lòng nhất ở điểm nào với bên đó ạ?
Chị Lan: Rẻ, nhưng không có ai hỗ trợ, hỏi gì cũng chờ 2 ngày.
Trần Minh Đức: Dạ, bên em có coach 1-1 hàng tuần, không cần thay ngay, nhiều học viên dùng song song rồi mới quyết. Em gửi chị video 5 phút về module chatbot và hẹn chị 15 phút thứ 4 lúc 9h nhé?
Chị Lan: Ừ, thứ 4 đi.
Trần Minh Đức: Dạ em cảm ơn chị, em sẽ gửi video ngay sau cuộc gọi ạ.`;
  const cg = await voiWorkspace(ws, (q) => napVaPhanTich(q, { workspaceId: ws, nguoiDungId: sale, tenSale: "Trần Minh Đức", sanPhamId: sp, tenKhach: "Chị Lan — thử AI", ketQua: "hen", transcript: tr, thoiLuongGiay: 420 }));
  const pt = await voiWorkspace(ws, async (q) => (await q.query<{ phan_tich: Record<string, unknown> }>("select phan_tich from cuoc_goi where id=$1", [cg.id])).rows[0].phan_tich);
  console.log(`[cuocGoi] ${cg.cheDo} ${dem(t)} | tổng ${cg.diemTong} | phản đối mới ${cg.phanDoiMoi} | nhiệm vụ ${cg.nhiemVu}\n  TÓM TẮT: ${JSON.stringify(pt.tom_tat).slice(0, 500)}\n  ĐOẠN HAY: ${JSON.stringify(pt.doan_hay).slice(0, 300)}`);
  t = Date.now();
  const g = await voiWorkspace(ws, (q) => sinhGoiHuanLuyen(q, { workspaceId: ws, nguoiDungId: sale }));
  console.log(`[goiHuanLuyen] ${g.cheDo} ${dem(t)}\n  ${g.noiDung.tom_tat}\n  BÀI TẬP: ${g.noiDung.bai_tap.map((b) => b.ten).join(" · ")}`);
  console.log(`PHIEN_ID=${p.id} CUOC_GOI_ID=${cg.id}`);
  await dongPool();
}
main().catch((e) => { console.error(e); process.exit(1); });
