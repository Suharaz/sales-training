# PHƯƠNG ÁN CODE — TAKI SALES TRAINING

*Lập ngày 26/09/2026 từ thư mục «SALE TRAINNING» (spec TAKI FUNNEL OS v2.0 + 72 mockup).*

## 1. Bối cảnh và quyết định phạm vi

Thư mục đầu vào chứa **đúng bộ tài liệu** của dự án auto-funnel (TAKI FUNNEL OS) đã code xong:
cùng file spec (md5 `c0f8d67a…`) và cùng 72 ảnh mockup. Tên thư mục là **SALE TRAINNING**, nên
sản phẩm được cắt ra là **nền tảng huấn luyện đội sale bằng AI**, dựng độc lập, không đụng auto-funnel.

Phần spec làm nguồn sự thật:

| Mã | Tính năng gốc | Cách dùng trong SALES TRAINING |
|---|---|---|
| F-114 | Màn hình gọi đủ ngữ cảnh | Kịch bản gọi theo sản phẩm + kho phản đối và câu trả lời chuẩn |
| F-115 | Ghi âm và AI phân tích cuộc gọi | Nạp transcript → AI tóm tắt 4 phần, chấm khung kỹ năng, trích phản đối và cam kết |
| F-116 | AI huấn luyện sale từ dữ liệu thật | Radar kỹ năng, thư viện đoạn mẫu (ẩn danh, qua duyệt), gói huấn luyện cá nhân |
| F-038 | Knowledge base huấn luyện | Kho phản đối và câu trả lời chuẩn có duyệt |
| F-127 | Tiến độ học làm trigger | Khóa → module → bài, tiến độ %, mốc phát đúng một lần |
| F-129 | Gamification và chứng chỉ | Điểm, chuỗi ngày, hạng Bronze→Diamond, bảng xếp hạng ẩn danh, chứng chỉ mã xác thực công khai |
| Mockup #62 | Sales Coaching + «Tạo Role-play» | **Luyện tập role-play với AI đóng vai khách** (tính năng trung tâm) |
| Mockup #63, #64, #66, #68 | Màn gọi, phân tích cuộc gọi, LMS, gamification | Bố cục, KPI, radar, scorecard |
| Chương 1.3 | Quy ước toàn hệ | workspace_id ở tầng dữ liệu, AI Gateway duy nhất, nội dung AI ở trạng thái nháp, audit log |

Không làm: CRM, phễu, email, thanh toán, tổng đài. Ghi âm: nhận dạng giọng nói ngay trong trình duyệt (Web Speech API, Chrome/Edge) thành transcript theo người nói; không lưu file audio (không cần blob storage).

## 2. Stack

Next.js 15 App Router + TypeScript + Tailwind v4 · PostgreSQL (`pg`, migration SQL, **RLS FORCE theo
`app.workspace_id`**, một role) · zod · vitest · pnpm · cổng **3020**. Claude qua **AI Gateway** ba chế độ:
`cli` (gói sub, máy local), `api` (`ANTHROPIC_API_KEY`, Vercel), `du_phong` (không có AI: chấm điểm theo
luật + khách mẫu, để app vẫn chạy và test không cần mạng). Tiếng Việt toàn bộ: giao diện, tên bảng, tên hàm.

## 3. Mô hình dữ liệu (db/migrations/001-nen.sql)

workspace · nguoi_dung (vai_tro quan_ly|sale, an_danh_bxh) · san_pham (tang 0–4) · kich_ban (theo sản phẩm,
4 phần: mở đầu/khai thác/giá trị/chốt) · phan_doi (loai, cau_tra_loi_chuan, nguon, trang_thai nhap|da_duyet)
· khoa_hoc · module_hoc · bai_hoc (noi_dung|video|quiz) · ghi_danh (phan_tram, moc_da_phat) · tien_do_bai ·
diem_hoc (sổ điểm, tính streak) · chung_chi (ma xác thực) · phien_luyen_tap (persona, lich_su, ket_qua) ·
cuoc_goi (transcript, phan_tich) · doan_mau (ẩn danh, duyệt) · goi_huan_luyen · nhiem_vu (từ cam kết) ·
log_sinh_ai · nhat_ky_kiem_toan · su_kien (chỉ INSERT).

Khung kỹ năng 6 tiêu chí cố định (core/khung-ky-nang.ts): khai_thac · lang_nghe · gia_tri · phan_doi · chot · tuan_thu.

## 4. IA (một sidebar)

Tổng quan · Luyện tập (role-play) · Cuộc gọi (phân tích) · Huấn luyện (radar đội + gói cá nhân) ·
Kịch bản & Phản đối · Đào tạo (LMS) · Bảng xếp hạng · Nhân viên · Cài đặt. Công khai: /chung-chi/[ma].

## 5. AI Gateway (services/ai-gateway.ts) — tác vụ

sinh_persona · khach_tra_loi (role-play từng lượt) · cham_luyen_tap · phan_tich_cuoc_goi · goi_huan_luyen ·
goi_y_tra_loi_phan_doi. Mọi lời gọi: ép JSON theo zod, ghi log_sinh_ai, nội dung sinh ra ở trạng thái nháp.

## 6. Kiểm thử

`core/core.test.ts` (logic thuần: điểm, streak, hạng, tiến độ, mốc idempotent, mã chứng chỉ, bóc JSON,
chấm dự phòng, phân quyền) · `db/db.test.ts` (RLS chéo workspace, mốc phát một lần, ghi danh).

## 7. Triển khai

GitHub `sales-training` → Vercel (project `sales-training`, region sin1) + Neon qua tích hợp Vercel;
migration + seed chạy lên Neon trước khi bật. Tunnel Cloudflare trỏ app local 3020 (có Claude CLI thật).
Tài khoản demo: quản lý `quanly@demo.vn / Demo@2026`, sale `sale1@demo.vn … sale5@demo.vn / Sale@2026`.

## 8. Bổ sung 27/09/2026
- DNA doanh nghiệp (M10 rút gọn: F-056 nhập tay, F-057 nạp từ tài liệu) làm ngữ cảnh chung cho AI Gateway; sản phẩm hồ sơ đầy đủ (F-098 rút gọn).
- Copilot cuộc gọi thật theo mockup #63: lớp tức thì (luật) + lớp AI nhanh; đọc gợi ý vào tai nghe; giọng đọc tự nhiên chọn theo trình duyệt.
