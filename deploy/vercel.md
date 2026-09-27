# Đưa lên Vercel

1. Kết nối GitHub repo `sales-training` với project Vercel `sales-training` (region sin1, xem `vercel.json`).
2. Postgres: tích hợp Neon từ Vercel Marketplace (`vercel integration add neon`), lấy `DATABASE_URL`.
3. Biến môi trường production: `DATABASE_URL`, `PHIEN_SECRET` (32+ ký tự), `AI_MODE=api`, `ANTHROPIC_API_KEY` (Claude), `AI_MODEL=claude-sonnet-5`.
4. Migration + seed lên Neon TRƯỚC khi mở app: `DATABASE_URL=<neon> pnpm db:init && DATABASE_URL=<neon> pnpm db:seed`.
5. `git push` → Vercel tự build. Kiểm `/api/suc-khoe`.

Lưu ý: gói sub Claude (CLI) KHÔNG chạy trên Vercel — production cần `ANTHROPIC_API_KEY`; thiếu key app vẫn chạy ở chế độ dự phòng theo luật.

## Bẫy Neon đã gặp (26/09/2026)
- `neondb_owner` có `rolbypassrls = true` → RLS KHÔNG hiệu lực với role chủ. Bắt buộc tạo role `app_user` (nobypassrls) trên Neon,
  cấp quyền + default privileges, và trỏ `DATABASE_URL_APP` của app vào role đó. `DATABASE_URL` (chủ) chỉ dùng cho migration/seed.
- Neon không cho `create function ... set app.x = '…'` ở định nghĩa hàm (permission denied) → đặt cờ bằng `set_config` trong thân hàm.
- Tài nguyên Neon qua `vercel integration add neon -m region=sin1` (mã region là mã Vercel: sin1, iad1…), mặc định rơi vào us-east-1.
