// Seed dữ liệu DEMO trung tính (Công ty Demo — không chứa dữ liệu thật của khách hàng nào): 1 quản lý, 5 sale, DNA mẫu, 2 sản phẩm, kịch bản, kho phản đối, 1 khóa học
// (4 module × 3 bài + quiz), cuộc gọi mẫu đã phân tích, phiên role-play đã chấm, điểm, chứng chỉ. Chạy lại an toàn (bỏ qua nếu đã có).
import { poolChu, dongPool } from "./ket-noi";
import { bamMatKhau } from "../core/mat-khau";
import { maChungChi } from "../core/chung-chi";
import { chuanHoaDiem, diemTong } from "../core/khung-ky-nang";
import { chamLuyenTapMau, phanTichCuocGoiMau, tachTranscript } from "../core/du-phong-ai";

const MK_QL = "Demo@2026", MK_SALE = "Sale@2026";

export async function seed(): Promise<{ workspaceId: string; daCo: boolean }> {
  const p = poolChu();
  await p.query("select set_config('app.nen_tang','1',false)");
  const co = (await p.query<{ id: string }>("select id from workspace where slug = 'demo'")).rows[0];
  if (co) return { workspaceId: co.id, daCo: true };
  const c = await p.connect();
  try {
    await c.query("begin");
    await c.query("select set_config('app.nen_tang','1',true)");
    const ws = (await c.query<{ id: string }>("insert into workspace(ten, slug) values ('Công ty Demo','demo') returning id")).rows[0].id;
    await c.query("select set_config('app.workspace_id', $1, true)", [ws]);
    const nd = async (email: string, ten: string, chuc: string, vai: string, mk: string) =>
      (await c.query<{ id: string }>("insert into nguoi_dung(workspace_id, email, ten, chuc_danh, vai_tro, mat_khau_hash) values ($1,$2,$3,$4,$5,$6) returning id", [ws, email, ten, chuc, vai, bamMatKhau(mk)])).rows[0].id;
    const ql = await nd("quanly@demo.vn", "Nguyễn Quản Lý", "Sales Manager", "quan_ly", MK_QL);
    const sales = [
      await nd("sale1@demo.vn", "Trần Minh Đức", "Senior Sales Consultant", "sale", MK_SALE),
      await nd("sale2@demo.vn", "Lê Thu Hương", "Sales Consultant", "sale", MK_SALE),
      await nd("sale3@demo.vn", "Phạm Quốc Huy", "Sales Consultant", "sale", MK_SALE),
      await nd("sale4@demo.vn", "Nguyễn Hải Nam", "Sales Executive", "sale", MK_SALE),
      await nd("sale5@demo.vn", "Đỗ Anh Thư", "Sales Executive", "sale", MK_SALE),
    ];
    await c.query(`insert into ho_so_dna(workspace_id, ten_doanh_nghiep, nganh, mo_ta, khach_hang_muc_tieu, noi_dau_khach, usp, xung_ho, phong_cach, tu_cam, so_lieu_cho_phep, doi_thu, chinh_sach, cau_chuyen) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [ws,
      "Công ty Demo", "Đào tạo và tư vấn doanh nghiệp", "Doanh nghiệp đào tạo kỹ năng và triển khai hệ thống bán hàng cho doanh nghiệp nhỏ tại Việt Nam; bán khóa học online và chương trình đồng hành.",
      "Chủ doanh nghiệp nhỏ 5–50 nhân sự, đang tự chạy quảng cáo và chăm khách bằng Excel/Zalo.", "Lead rơi vì không ai chăm kịp, không có quy trình, tốn thời gian trả lời inbox, không đo được hiệu quả quảng cáo.",
      JSON.stringify(["Coach 1-1 hàng tuần", "Mẫu quy trình dùng ngay", "Hoàn tiền 7 ngày", "Đo bằng số liệu hàng tuần"]), "em – anh/chị", "Thân thiện, thẳng thắn, hỏi trước nói sau, dùng bằng chứng thay lời hứa.",
      JSON.stringify(["cam kết 100%", "chắc chắn thành công", "đảm bảo lợi nhuận", "rẻ nhất thị trường"]), JSON.stringify(["Học viên trước tiết kiệm 30% thời gian chăm sóc sau 2 tháng", "Hoàn tiền 7 ngày", "Coach 1-1 mỗi tuần"]),
      "Có vài đơn vị bán khóa rẻ hơn nhưng không có coach; không nói xấu, so sánh bằng giá trị đồng hành.", "Hoàn tiền trong 7 ngày đầu; thanh toán chia 3 kỳ; hỗ trợ qua nhóm và coach hàng tuần.", ""]);
    const sp1 = (await c.query<{ id: string }>("insert into san_pham(workspace_id, ten, tang, gia, mo_ta, diem_ban_hang) values ($1,'Khóa Hệ thống bán hàng tự động',2,19800000,'Khóa học 8 tuần xây hệ thống bán hàng tự động cho doanh nghiệp nhỏ.',$2) returning id", [ws, JSON.stringify(["Có mẫu quy trình dùng ngay", "Coach 1-1 mỗi tuần", "Cộng đồng học viên hỗ trợ", "Hoàn tiền 7 ngày nếu không phù hợp"])])).rows[0].id;
    const sp2 = (await c.query<{ id: string }>("insert into san_pham(workspace_id, ten, tang, gia, mo_ta, diem_ban_hang) values ($1,'Chương trình đồng hành 6 tháng',3,98000000,'Đồng hành triển khai hệ thống marketing và sale tại doanh nghiệp.',$2) returning id", [ws, JSON.stringify(["Triển khai tận nơi", "Đo bằng số liệu hàng tuần", "Đội ngũ chuyên gia trực tiếp làm cùng"])])).rows[0].id;
    await c.query("insert into kich_ban(workspace_id, san_pham_id, ten, mo_dau, khai_thac, gia_tri, chot) values ($1,$2,$3,$4,$5,$6,$7)", [ws, sp1, "Kịch bản gọi lead webinar — Khóa Hệ thống bán hàng tự động",
      "Dạ chào anh/chị [Tên], em là [Tên sale] bên Công ty Demo. Anh/chị vừa tham gia webinar «Tự động hóa bán hàng bằng AI» tối qua đúng không ạ? Em gọi để hỏi thăm phần anh/chị thấy hữu ích nhất và xem có gì em hỗ trợ thêm.",
      "1) Hiện tại anh/chị đang bán qua kênh nào là chính? 2) Đội sale/chăm sóc có mấy người, đang theo dõi khách bằng gì? 3) Mỗi tháng có khoảng bao nhiêu lead mới, tỷ lệ chốt hiện ra sao? 4) Nếu 3 tháng nữa nhìn lại, anh/chị muốn thay đổi rõ nhất ở đâu? 5) Ngân sách dự kiến cho việc này?",
      "Gắn đúng nỗi đau đã khai thác: lead rơi → chuỗi bám đuổi tự động; mất thời gian trả lời inbox → AI phân loại; không có báo cáo → dashboard. Bằng chứng: học viên trước tiết kiệm 30% thời gian chăm sóc sau 2 tháng (số được phép dùng). Có template dùng ngay, coach 1-1 hàng tuần.",
      "Đề xuất bước tiếp theo cụ thể: «Em gửi anh/chị lộ trình 8 tuần và link giữ chỗ, mình chốt trong hôm nay để kịp lớp khai giảng thứ 2 tuần sau nhé?» Nếu chưa sẵn sàng: hẹn ngày giờ gọi lại cụ thể, gửi tài liệu ngay sau cuộc gọi."]);
    await c.query("insert into kich_ban(workspace_id, san_pham_id, ten, mo_dau, khai_thac, gia_tri, chot) values ($1,$2,$3,$4,$5,$6,$7)", [ws, sp2, "Kịch bản tư vấn Chương trình đồng hành",
      "Dạ chào anh/chị, em là [Tên sale], chuyên viên tư vấn chương trình đồng hành của Công ty Demo. Anh/chị đã nộp đơn ứng tuyển chương trình 6 tháng, em xin 20 phút để hiểu rõ doanh nghiệp mình trước khi đề xuất.",
      "Doanh thu hiện tại và mục tiêu 12 tháng? Đội ngũ marketing/sale hiện có? Đã từng thuê agency/coach chưa, kết quả? Ai là người ra quyết định cuối cùng? Thời điểm muốn bắt đầu?",
      "Khác agency ở chỗ đội chuyên gia làm cùng và đo bằng số liệu hàng tuần; phù hợp doanh nghiệp đã có sản phẩm bán được và muốn hệ thống hóa. Không cam kết doanh thu; cam kết quy trình và số giờ đồng hành.",
      "Mời vào buổi thẩm định 45 phút với founder; chốt lịch ngay trong cuộc gọi. Gửi hồ sơ chương trình và 2 case tương tự."]);
    const pd = [
      ["gia", "Giá cao quá, ngân sách bên em không tới.", "Dạ em hiểu, mức đầu tư này cần cân nhắc là đúng ạ. Cho em hỏi: hiện mỗi tháng mình mất khoảng bao nhiêu lead vì không chăm kịp? Nếu chỉ giữ lại được 10% số đó thì giá trị đã hơn học phí. Mình có thể chia 3 kỳ, anh/chị thấy phù hợp không ạ?"],
      ["thoi_gian", "Dạo này bận quá, để tháng sau tính.", "Dạ em hiểu anh/chị đang rất bận. Thực ra khóa học sinh ra để giảm đúng phần việc đang chiếm thời gian đó. Mỗi tuần chỉ cần 2 giờ, có bản ghi xem lại. Nếu tháng sau, em hẹn anh/chị ngày cụ thể là ngày nào để em gọi lại ạ?"],
      ["niem_tin", "Em từng mua khóa tương tự rồi mà không hiệu quả.", "Dạ em rất tiếc về trải nghiệm đó, và em hiểu vì sao anh/chị thận trọng. Cho em hỏi khóa trước thiếu gì khiến mình không áp dụng được? Bên em có coach 1-1 hàng tuần và hoàn tiền 7 ngày, tức là rủi ro nằm ở phía em chứ không phải anh/chị."],
      ["nhu_cau", "Hiện tại đội anh vẫn làm ổn, chưa cần.", "Dạ, mừng là đội mình đang vận hành tốt ạ. Em tò mò một chút: nếu tháng sau lead tăng gấp đôi thì đội có kịp chăm không ạ? Nhiều học viên của em bắt đầu khi «vẫn ổn» để chuẩn bị cho lúc tăng trưởng."],
      ["quyet_dinh", "Anh phải hỏi lại sếp/vợ đã.", "Dạ đúng rồi ạ, quyết định này nên có người đồng hành. Để buổi trao đổi đó hiệu quả, em gửi anh/chị bản tóm tắt 1 trang và 2 case tương tự nhé. Mình hẹn em gọi lại sau khi anh/chị bàn xong, thứ 5 hay thứ 6 tiện hơn ạ?"],
      ["doi_thu", "Bên anh đang dùng bên khác rồi.", "Dạ tốt ạ, vậy là mình đã có nền. Anh/chị hài lòng nhất và chưa hài lòng nhất ở điểm nào với bên đó? Em không cần anh/chị thay thế ngay; nhiều học viên dùng song song rồi mới quyết định."],
    ];
    for (const [loai, nd2, tl] of pd) await c.query("insert into phan_doi(workspace_id, loai, noi_dung, cau_tra_loi_chuan, so_lan_gap) values ($1,$2,$3,$4,$5)", [ws, loai, nd2, tl, Math.floor(Math.random() * 20) + 3]);
    // Khóa học
    const khoa = (await c.query<{ id: string }>("insert into khoa_hoc(workspace_id, ten, mo_ta) values ($1,'Kỹ năng bán hàng tư vấn','Khóa nền tảng cho sale mới: khai thác nhu cầu, trình bày giá trị, xử lý phản đối, chốt và tuân thủ.') returning id", [ws])).rows[0].id;
    const modules: [string, [string, string, string, number, unknown[]][]][] = [
      ["Khai thác nhu cầu", [
        ["Vì sao phải hỏi trước khi nói", "noi_dung", "## Nguyên tắc 70/30\nTrong 10 phút đầu, khách nói 70%. Sale chỉ đặt câu hỏi mở và tóm tắt lại.\n\n## 5 câu hỏi vàng\n1. Hiện tại anh/chị đang làm việc này thế nào?\n2. Điều gì khiến anh/chị chưa hài lòng?\n3. Nếu giải quyết được thì khác gì?\n4. Đã thử cách nào rồi?\n5. Ai cùng ra quyết định?\n\n## Lỗi thường gặp\n- Thuyết trình ngay khi khách vừa nghe máy.\n- Hỏi câu đóng (có/không).\n- Không tóm tắt lại ý khách trước khi chuyển phần.", 300, []],
        ["Kịch bản khai thác theo sản phẩm", "noi_dung", "Xem phần «Khai thác» trong Kịch bản & Phản đối của từng sản phẩm. Ghi nhớ thứ tự: kênh → đội → lead → mục tiêu → ngân sách.\n\nBài tập: mở một phiên role-play độ khó Dễ và chỉ đặt câu hỏi trong 4 lượt đầu.", 240, []],
        ["Kiểm tra: khai thác nhu cầu", "quiz", "", 0, [
          { hoi: "Trong 10 phút đầu, tỷ lệ khách nói lý tưởng là bao nhiêu?", luaChon: ["30%", "50%", "70%", "90%"], dapAn: 2, giaiThich: "Nguyên tắc 70/30: khách nói 70%." },
          { hoi: "Câu nào là câu hỏi mở?", luaChon: ["Anh có quan tâm không?", "Anh đang theo dõi khách bằng cách nào?", "Anh mua chứ?", "Giá vậy ok không anh?"], dapAn: 1 },
          { hoi: "Việc cần làm trước khi chuyển sang trình bày giá trị?", luaChon: ["Báo giá", "Tóm tắt lại ý khách", "Gửi link", "Hỏi thêm về gia đình"], dapAn: 1 },
        ]],
      ]],
      ["Trình bày giá trị", [
        ["Công thức Nhu cầu → Tính năng → Lợi ích → Bằng chứng", "noi_dung", "Mỗi ý trình bày phải bắt đầu từ một nhu cầu KHÁCH ĐÃ NÓI. Ví dụ: «Anh nói lead rơi vì không ai chăm kịp (nhu cầu) → hệ thống có chuỗi bám đuổi tự động (tính năng) → không lead nào bị bỏ quá 5 phút (lợi ích) → học viên trước tiết kiệm 30% thời gian chăm sóc (bằng chứng được phép dùng)».\n\nChỉ dùng số liệu trong danh sách được phép. Không tự bịa.", 300, []],
        ["Kể case study trong 60 giây", "noi_dung", "Khung: Bối cảnh (1 câu) → Vấn đề (1 câu) → Hành động (2 câu) → Kết quả (1 câu, số được phép) → Liên hệ với khách (1 câu hỏi).", 200, []],
        ["Kiểm tra: trình bày giá trị", "quiz", "", 0, [
          { hoi: "Mỗi ý trình bày phải bắt đầu từ đâu?", luaChon: ["Tính năng nổi bật nhất", "Nhu cầu khách đã nói", "Giá", "Khuyến mãi"], dapAn: 1 },
          { hoi: "Số liệu nào được dùng khi kể case?", luaChon: ["Số nghe đồng nghiệp kể", "Số trong danh sách được phép", "Số ước lượng", "Số của đối thủ"], dapAn: 1 },
        ]],
      ]],
      ["Xử lý phản đối", [
        ["Khung 4 bước: Ghi nhận – Làm rõ – Giá trị – Kiểm tra", "noi_dung", "1. **Ghi nhận**: «Dạ em hiểu, anh lo về … là đúng.»\n2. **Làm rõ**: một câu hỏi để biết phản đối thật («Anh so với gì ạ?»).\n3. **Giá trị**: trả lời gắn nhu cầu, có bằng chứng.\n4. **Kiểm tra**: «Anh thấy hướng đó ổn không ạ?»\n\nKhông bao giờ: cãi, hạ giá ngay, hứa kết quả.", 300, []],
        ["6 loại phản đối và câu trả lời chuẩn", "noi_dung", "Xem Kho phản đối trong hệ thống: giá, thời gian, niềm tin, nhu cầu, quyết định, đối thủ. Học thuộc câu trả lời chuẩn, sau đó luyện role-play độ khó Vừa với phản đối ưu tiên «Giá».", 240, []],
        ["Kiểm tra: xử lý phản đối", "quiz", "", 0, [
          { hoi: "Bước đầu tiên khi khách nói «giá cao»?", luaChon: ["Giảm giá", "Ghi nhận cảm xúc", "Nói giá không cao", "Chuyển sản phẩm rẻ hơn"], dapAn: 1 },
          { hoi: "Câu nào vi phạm tuân thủ?", luaChon: ["Em cam kết 100% anh sẽ có lãi", "Học viên trước tiết kiệm 30% thời gian", "Bên em có coach 1-1", "Hoàn tiền 7 ngày"], dapAn: 0 },
          { hoi: "Sau khi trả lời phản đối cần làm gì?", luaChon: ["Im lặng", "Kiểm tra lại với khách", "Báo giá lại", "Kết thúc cuộc gọi"], dapAn: 1 },
        ]],
      ]],
      ["Chốt và tuân thủ", [
        ["Chốt bằng bước tiếp theo có thời hạn", "noi_dung", "Mọi cuộc gọi kết thúc bằng MỘT bước tiếp theo cụ thể: ai làm gì, khi nào. «Em gửi link giữ chỗ ngay bây giờ, anh xác nhận trước 17h hôm nay nhé?» Nếu khách chưa sẵn sàng: chốt lịch gọi lại có ngày giờ.", 240, []],
        ["Những điều không bao giờ nói", "noi_dung", "- Không hứa kết quả («chắc chắn», «cam kết 100%», «đảm bảo lợi nhuận»).\n- Không bịa số liệu, không dùng số ngoài danh sách được phép.\n- Không nói xấu đối thủ.\n- Không ghi âm khi khách chưa đồng ý.\n- Xưng hô đúng, không suồng sã.", 200, []],
        ["Kiểm tra cuối khóa", "quiz", "", 0, [
          { hoi: "Kết thúc cuộc gọi chuẩn là gì?", luaChon: ["Cảm ơn rồi cúp", "Một bước tiếp theo cụ thể có thời hạn", "Gửi báo giá", "Hỏi khách có câu hỏi không"], dapAn: 1 },
          { hoi: "Câu nào an toàn tuân thủ?", luaChon: ["Đảm bảo doanh thu x2", "Bên kia lừa đảo", "Học viên trước tiết kiệm 30% thời gian chăm sóc", "Chắc chắn thành công"], dapAn: 2 },
          { hoi: "Khách nói «để anh hỏi vợ» — phản đối loại gì?", luaChon: ["Giá", "Quyết định", "Đối thủ", "Nhu cầu"], dapAn: 1 },
          { hoi: "Tỷ lệ nói/nghe lý tưởng của sale?", luaChon: ["80/20", "45/55", "10/90", "100/0"], dapAn: 1 },
        ]],
      ]],
    ];
    const baiIds: { id: string; module: string; loai: string; cau: unknown[] }[] = [];
    let tt = 0;
    for (const [tenM, bais] of modules) {
      const mId = (await c.query<{ id: string }>("insert into module_hoc(workspace_id, khoa_hoc_id, ten, thu_tu) values ($1,$2,$3,$4) returning id", [ws, khoa, tenM, tt++])).rows[0].id;
      let bt = 0;
      for (const [ten, loai, nd3, giay, cau] of bais) {
        const bId = (await c.query<{ id: string }>("insert into bai_hoc(workspace_id, module_hoc_id, ten, thu_tu, loai, noi_dung, thoi_luong_giay, cau_hoi) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id", [ws, mId, ten, bt++, loai, nd3, giay, JSON.stringify(cau)])).rows[0].id;
        baiIds.push({ id: bId, module: mId, loai, cau });
      }
    }
    // Tiến độ demo: sale1 hoàn thành 100% (có chứng chỉ), sale2 75%, sale3 40%, sale4 10%, sale5 chưa học
    const tienDo = [12, 9, 5, 1, 0];
    for (let i = 0; i < sales.length; i++) {
      if (tienDo[i] === 0) continue;
      const g = (await c.query<{ id: string }>("insert into ghi_danh(workspace_id, nguoi_dung_id, khoa_hoc_id, phan_tram, hoc_cuoi_luc, hoan_thanh_luc, moc_da_phat) values ($1,$2,$3,$4, now() - ($5 || ' days')::interval, $6, $7) returning id",
        [ws, sales[i], khoa, Math.round((tienDo[i] / 12) * 100), String(i * 2), tienDo[i] === 12 ? new Date() : null, JSON.stringify(tienDo[i] === 12 ? ["module_hoan_thanh:" + baiIds[0].module, "nguong_khoa", "hoan_thanh_khoa"] : [])])).rows[0].id;
      for (let b = 0; b < tienDo[i]; b++) {
        const bai = baiIds[b];
        await c.query("insert into tien_do_bai(workspace_id, ghi_danh_id, bai_hoc_id, giay_da_hoc, diem_quiz, hoan_thanh_luc) values ($1,$2,$3,$4,$5, now() - ($6 || ' days')::interval)", [ws, g, bai.id, 400, bai.loai === "quiz" ? 80 + (b % 3) * 5 : null, String(20 - b)]);
        await c.query("insert into diem_hoc(workspace_id, nguoi_dung_id, su_kien, diem, ngay, tham_chieu, luc) values ($1,$2,'hoan_thanh_bai',50, (now() - ($3 || ' days')::interval)::date, $4, now() - ($3 || ' days')::interval)", [ws, sales[i], String(20 - b), `bai:${bai.id}`]);
        if (bai.loai === "quiz") await c.query("insert into diem_hoc(workspace_id, nguoi_dung_id, su_kien, diem, ngay, tham_chieu, luc) values ($1,$2,'vuot_quiz',100, (now() - ($3 || ' days')::interval)::date, $4, now() - ($3 || ' days')::interval)", [ws, sales[i], String(20 - b), `quiz:${bai.id}`]);
      }
      if (tienDo[i] === 12) {
        await c.query("insert into diem_hoc(workspace_id, nguoi_dung_id, su_kien, diem, ngay, tham_chieu) values ($1,$2,'hoan_thanh_khoa',300, current_date, $3)", [ws, sales[i], `khoa:${khoa}`]);
        await c.query("insert into chung_chi(workspace_id, nguoi_dung_id, khoa_hoc_id, ma, ten_nguoi, ten_khoa) values ($1,$2,$3,$4,'Trần Minh Đức','Kỹ năng bán hàng tư vấn')", [ws, sales[i], khoa, maChungChi(ws, sales[i], khoa, new Date().getFullYear())]);
      }
    }
    // Cuộc gọi mẫu đã phân tích (chế độ dự phòng để seed không cần AI)
    const GOI = [
      [0, "Cty ABC — Nguyễn Văn A", "thang", 1398, `Trần Minh Đức: Dạ chào anh A, em là Đức bên Công ty Demo. Anh vừa tham gia webinar tối qua đúng không ạ? Anh thấy phần nào hữu ích nhất?
Nguyễn Văn A: Phần chuỗi email tự động. Bên anh đang mất nhiều lead lắm.
Trần Minh Đức: Dạ em hiểu, tức là lead vào nhưng không ai chăm kịp đúng không ạ? Hiện đội anh có mấy người và đang theo dõi khách bằng gì?
Nguyễn Văn A: Ba bạn sale, dùng Excel với Zalo thôi. Mỗi tháng khoảng 200 lead, chốt được 15.
Trần Minh Đức: Dạ, tức là hơn 90% lead chưa được chăm tới nơi. Nếu 3 tháng nữa nhìn lại, anh muốn thay đổi rõ nhất ở đâu ạ?
Nguyễn Văn A: Muốn tăng tỷ lệ chốt lên gấp đôi. Nhưng giá khóa 19,8 triệu hơi cao so với ngân sách bên anh.
Trần Minh Đức: Dạ em ghi nhận, mức đầu tư này cần cân nhắc là đúng ạ. Nếu chỉ giữ lại được thêm 5 khách mỗi tháng từ số lead đang rơi thì giá trị đã vượt học phí. Học viên trước của em tiết kiệm 30% thời gian chăm sóc sau 2 tháng. Mình chia 3 kỳ được, anh thấy phù hợp không ạ?
Nguyễn Văn A: Chia 3 kỳ thì được. Anh cần hỏi lại kế toán chút.
Trần Minh Đức: Dạ, để buổi trao đổi hiệu quả em gửi anh lộ trình 8 tuần và bảng chia kỳ ngay sau cuộc gọi. Em hẹn gọi lại anh thứ 5 lúc 10h để chốt lớp khai giảng thứ 2 nhé?
Nguyễn Văn A: Ok em, thứ 5 nhé.`],
      [0, "Cty DEF — Lê Thị B", "hen", 963, `Trần Minh Đức: Dạ chào chị B, em là Đức bên Công ty Demo. Chị đang quan tâm hệ thống bán hàng tự động đúng không ạ? Em xin hỏi chị đang bán qua kênh nào chính?
Lê Thị B: Facebook là chính. Nhưng chị bận lắm, để tháng sau tính được không?
Trần Minh Đức: Dạ em hiểu chị đang rất bận. Thực ra khóa sinh ra để giảm đúng phần việc đang chiếm thời gian đó, mỗi tuần 2 giờ có bản ghi. Chị cho em hỏi phần nào đang tốn thời gian nhất ạ?
Lê Thị B: Trả lời inbox, nhiều quá.
Trần Minh Đức: Dạ, phần AI phân loại inbox là module tuần 3. Em gửi chị video 5 phút về module đó và hẹn chị 15 phút thứ 4 tuần sau lúc 9h để xem có phù hợp không nhé?
Lê Thị B: Ừ thứ 4 nhé.`],
      [1, "Cty GHI — Trần Văn C", "thang", 1220, `Lê Thu Hương: Dạ chào anh C, em là Hương bên Công ty Demo ạ. Anh vừa đăng ký nhận tài liệu, em gọi hỏi thăm anh đang cần gì ạ?
Trần Văn C: Anh muốn tự động hóa chăm sóc khách cũ.
Lê Thu Hương: Dạ em hiểu, tức là khách mua rồi nhưng không được chăm để mua lại đúng không ạ? Hiện anh có khoảng bao nhiêu khách cũ?
Trần Văn C: Tầm 800. Nhưng anh từng mua khóa tương tự rồi mà không áp dụng được.
Lê Thu Hương: Dạ em rất tiếc về trải nghiệm đó, em hiểu vì sao anh thận trọng. Khóa trước thiếu gì khiến anh không áp dụng được ạ?
Trần Văn C: Không ai hướng dẫn, học xong bỏ đó.
Lê Thu Hương: Dạ, bên em có coach 1-1 hàng tuần và hoàn tiền 7 ngày, tức là rủi ro nằm ở phía em. Học viên trước tiết kiệm 30% thời gian chăm sóc sau 2 tháng. Em gửi anh link giữ chỗ, anh xác nhận trước 17h hôm nay để kịp lớp thứ 2 nhé?
Trần Văn C: Ok, gửi anh link.`],
      [2, "Cty JKL — Phạm Thị D", "thua", 640, `Phạm Quốc Huy: Chào chị D, em Huy bên Công ty Demo. Bên em có khóa AI Business Systems rất tốt, giúp tự động hóa bán hàng, cam kết 100% hiệu quả.
Phạm Thị D: Chị chưa cần đâu, đội chị vẫn ổn.
Phạm Quốc Huy: Không đâu chị, khóa này ai cũng cần, chắc chắn thành công. Giá 19,8 triệu thôi.
Phạm Thị D: Giá cao quá, chị không có ngân sách.
Phạm Quốc Huy: Không cao đâu chị, bên kia còn dở hơn nhiều. Chị mua đi.
Phạm Thị D: Thôi chị bận, cảm ơn em.`],
      [3, "Cty MNO — Nguyễn Hữu E", "thua", 780, `Nguyễn Hải Nam: Dạ chào anh E, em Nam bên Công ty Demo. Anh có vài phút không ạ? Em muốn giới thiệu khóa AI Business Systems.
Nguyễn Hữu E: Anh đang dùng phần mềm bên khác rồi.
Nguyễn Hải Nam: Dạ, nhưng bên em tốt hơn ạ, có nhiều tính năng hơn.
Nguyễn Hữu E: Đổi thì tốn công lắm. Thôi anh không quan tâm.
Nguyễn Hải Nam: Dạ vâng, cảm ơn anh.`],
      [1, "Cty PQR — Vũ Thị F", "hen", 1010, `Lê Thu Hương: Dạ chào chị F, em Hương bên Công ty Demo. Chị vừa nộp đơn chương trình đồng hành, em xin 20 phút để hiểu doanh nghiệp mình ạ. Doanh thu hiện tại và mục tiêu 12 tháng của chị là gì?
Vũ Thị F: Khoảng 2 tỷ/năm, muốn lên 5 tỷ. Nhưng chị phải hỏi lại chồng chị, anh ấy quản tài chính.
Lê Thu Hương: Dạ đúng rồi ạ, quyết định này nên có người đồng hành. Để buổi trao đổi hiệu quả, em gửi chị bản tóm tắt 1 trang và 2 case tương tự nhé. Chị cho em hỏi, ai cùng chị làm marketing hiện nay ạ?
Vũ Thị F: Chị tự làm hết.
Lê Thu Hương: Dạ em hiểu, vậy là chị đang ôm quá nhiều việc. Chương trình bên em đội chuyên gia làm cùng và đo bằng số liệu hàng tuần. Em hẹn chị và anh nhà buổi thẩm định 45 phút với founder vào thứ 6 lúc 14h nhé?
Vũ Thị F: Để chị hỏi anh ấy rồi báo em.
Lê Thu Hương: Dạ, em gọi lại chị thứ 5 lúc 10h để chốt lịch ạ.`],
    ] as const;
    for (const [si, khach, kq, giay, tr] of GOI) {
      const luot = tachTranscript(tr, ["Trần Minh Đức", "Lê Thu Hương", "Phạm Quốc Huy", "Nguyễn Hải Nam", "Đỗ Anh Thư"][si]);
      const pt = phanTichCuocGoiMau(luot);
      const ngay = Math.floor(Math.random() * 20) + 1;
      const cg = (await c.query<{ id: string }>("insert into cuoc_goi(workspace_id, nguoi_dung_id, san_pham_id, ten_khach, goi_luc, thoi_luong_giay, ket_qua, transcript, luot, phan_tich, diem_tong, trang_thai, che_do_ai) values ($1,$2,$3,$4, now() - ($5 || ' days')::interval, $6,$7,$8,$9,$10,$11,'xong','du_phong') returning id",
        [ws, sales[si], sp1, khach, String(ngay), giay, kq, tr, JSON.stringify(luot), JSON.stringify(pt), diemTong(pt.diem)])).rows[0].id;
      for (const d of pt.doan_hay) await c.query("insert into doan_mau(workspace_id, cuoc_goi_id, loai_phan_doi, noi_dung, trang_thai) values ($1,$2,$3,$4,'da_duyet')", [ws, cg, d.loai_phan_doi, d.trich_doan]);
      for (const ck of pt.tom_tat.cam_ket) await c.query("insert into nhiem_vu(workspace_id, nguoi_dung_id, cuoc_goi_id, noi_dung, han) values ($1,$2,$3,$4, now() + interval '2 days')", [ws, sales[si], cg, ck.noi_dung]);
      await c.query("insert into diem_hoc(workspace_id, nguoi_dung_id, su_kien, diem, ngay, tham_chieu, luc) values ($1,$2,'cuoc_goi_phan_tich',30,(now() - ($3 || ' days')::interval)::date,$4, now() - ($3 || ' days')::interval)", [ws, sales[si], String(ngay), `goi:${cg}`]);
    }
    // Phiên role-play đã chấm (lịch sử mẫu ngắn) cho sale1, sale2, sale3
    const persona = { ten: "Lê Phương Anh", chuc_danh: "Giám đốc vận hành", cong_ty: "Công ty An Phát (mẫu)", boi_canh: "Doanh nghiệp 80 nhân sự, đội sale 6 người dùng Excel theo dõi khách.", muc_tieu: "Tự động hóa quy trình bán hàng và chăm sóc.", noi_dau: "Dữ liệu phân tán, báo cáo chậm, lead rơi.", ngan_sach: "150–250 triệu/năm", tinh_cach: "Thực tế, hỏi nhiều về số liệu.", phan_doi_chinh: ["gia", "niem_tin"] };
    const LS = [
      { vai: "sale", noi_dung: "Dạ chào chị, em là Đức bên Công ty Demo. Chị cho em hỏi hiện đội sale bên mình đang theo dõi khách thế nào ạ?", luc: "" },
      { vai: "khach", noi_dung: "Bên chị dùng Excel, lead rơi nhiều lắm.", luc: "" },
      { vai: "sale", noi_dung: "Dạ em hiểu, tức là lead vào nhưng không ai chăm kịp đúng không ạ? Mục tiêu 3 tháng tới chị muốn gì?", luc: "" },
      { vai: "khach", noi_dung: "Muốn tăng tỷ lệ chốt. Nhưng giá bên em cao quá, ngân sách chị có hạn.", luc: "" },
      { vai: "sale", noi_dung: "Dạ em ghi nhận, chị lo về chi phí là đúng. Khách hàng trước của em tiết kiệm 30% thời gian chăm sóc sau 2 tháng, lợi ích vượt chi phí. Chị thấy hợp lý không ạ?", luc: "" },
      { vai: "khach", noi_dung: "Nghe cũng được.", luc: "" },
      { vai: "sale", noi_dung: "Vậy em gửi báo giá và hẹn chị demo thứ 5 tuần này 10h nhé?", luc: "" },
      { vai: "khach", noi_dung: "Ok em.", luc: "" },
    ] as const;
    for (const [si, lech] of [[0, 0], [0, 3], [1, 1], [2, 5], [1, 8]] as const) {
      const ls: { vai: "sale" | "khach"; noi_dung: string; luc: string }[] = LS.map((l) => ({ ...l }));
      if (si === 2) ls[4].noi_dung = "Không cao đâu chị, mua đi, cam kết 100% hiệu quả.";
      const kq = chamLuyenTapMau(ls);
      const tong = diemTong(chuanHoaDiem(kq.diem));
      const ph = (await c.query<{ id: string }>("insert into phien_luyen_tap(workspace_id, nguoi_dung_id, san_pham_id, do_kho, persona, lich_su, trang_thai, ket_qua, diem_tong, che_do_ai, tao_luc, ket_thuc_luc) values ($1,$2,$3,'vua',$4,$5,'xong',$6,$7,'du_phong', now() - ($8 || ' days')::interval, now() - ($8 || ' days')::interval) returning id",
        [ws, sales[si], sp1, JSON.stringify(persona), JSON.stringify(ls), JSON.stringify(kq), tong, String(lech)])).rows[0].id;
      await c.query("insert into diem_hoc(workspace_id, nguoi_dung_id, su_kien, diem, ngay, tham_chieu, luc) values ($1,$2,'luyen_tap_xong',80,(now() - ($3 || ' days')::interval)::date,$4, now() - ($3 || ' days')::interval)", [ws, sales[si], String(lech), `phien:${ph}`]);
    }
    await c.query("update san_pham set doi_tuong = $2, ket_qua_ky_vong = $3, hinh_thuc = $4, thoi_luong = $5, chinh_sach = $6, phan_doi_thuong_gap = $7 where id = $1", [sp1, "Chủ doanh nghiệp nhỏ đã có sản phẩm bán được, muốn hệ thống hóa", "Có quy trình chăm lead tự động và báo cáo rõ sau 8 tuần (không hứa doanh thu)", "Online + coach 1-1", "8 tuần, 2 giờ/tuần", "Hoàn tiền 7 ngày; chia 3 kỳ", JSON.stringify(["Giá cao so với ngân sách", "Bận không có thời gian học", "Từng mua khóa không hiệu quả"])]);
    await c.query("update san_pham set doi_tuong = $2, ket_qua_ky_vong = $3, hinh_thuc = $4, thoi_luong = $5 where id = $1", [sp2, "Doanh nghiệp doanh thu 2–20 tỷ/năm muốn tăng trưởng có hệ thống", "Hệ thống marketing và sale vận hành được, đo bằng số liệu tuần", "Đồng hành tận nơi", "6 tháng"]);
    await c.query("insert into nhat_ky_kiem_toan(workspace_id, nguoi_dung_id, hanh_dong, chi_tiet) values ($1,$2,'seed_demo','{}')", [ws, ql]);
    await c.query("commit");
    return { workspaceId: ws, daCo: false };
  } catch (e) { await c.query("rollback"); throw e; } finally { c.release(); }
}

if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) {
  seed().then(async (r) => { console.log(r.daCo ? "Đã có dữ liệu demo, bỏ qua." : `Đã seed workspace Công ty Demo (${r.workspaceId}). Đăng nhập: quanly@demo.vn / ${MK_QL} · sale1..5@demo.vn / ${MK_SALE}`); await dongPool(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
