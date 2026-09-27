-- TAKI SALES TRAINING — nền dữ liệu. Mọi bảng nghiệp vụ mang workspace_id và bật RLS FORCE
-- (áp cả cho chủ bảng) theo biến phiên app.workspace_id do services/workspace-guard đặt.
create extension if not exists pgcrypto;

create or replace function ws_hien_tai() returns uuid language sql stable as $$
  select nullif(current_setting('app.workspace_id', true), '')::uuid
$$;
-- Cờ cấp nền tảng: chỉ các hàm SECURITY DEFINER và script migration/seed đặt (set_config('app.nen_tang','1',true)).
create or replace function nen_tang_ok() returns boolean language sql stable as $$
  select coalesce(current_setting('app.nen_tang', true), '') = '1'
$$;

create table workspace (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  slug text not null unique,
  mui_gio text not null default 'Asia/Ho_Chi_Minh',
  tao_luc timestamptz not null default now()
);
comment on table workspace is 'Tenant/Workspace (spec 2.3)';

create table nguoi_dung (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  email text not null,
  ten text not null,
  chuc_danh text not null default '',
  mat_khau_hash text,
  vai_tro text not null check (vai_tro in ('quan_ly','sale')),
  an_danh_bxh boolean not null default false,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  unique (workspace_id, email)
);
create index on nguoi_dung(email);

create table san_pham (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  ten text not null,
  tang smallint not null default 2 check (tang between 0 and 4),
  gia bigint not null default 0,
  mo_ta text not null default '',
  diem_ban_hang jsonb not null default '[]',
  tao_luc timestamptz not null default now()
);

create table kich_ban (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  san_pham_id uuid references san_pham(id) on delete set null,
  ten text not null,
  mo_dau text not null default '',
  khai_thac text not null default '',
  gia_tri text not null default '',
  chot text not null default '',
  trang_thai text not null default 'da_duyet' check (trang_thai in ('nhap','da_duyet')),
  cap_nhat_luc timestamptz not null default now(),
  tao_luc timestamptz not null default now()
);
comment on table kich_ban is 'F-114 kịch bản gọi theo sản phẩm';

create table phan_doi (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  loai text not null check (loai in ('gia','thoi_gian','niem_tin','nhu_cau','quyet_dinh','doi_thu','khac')),
  noi_dung text not null,
  cau_tra_loi_chuan text not null default '',
  nguon text not null default 'thu_cong' check (nguon in ('thu_cong','ai_de_xuat')),
  trang_thai text not null default 'da_duyet' check (trang_thai in ('nhap','da_duyet','tu_choi')),
  cuoc_goi_id uuid,
  so_lan_gap integer not null default 0,
  tao_luc timestamptz not null default now()
);
comment on table phan_doi is 'F-114/F-038 kho phản đối và câu trả lời chuẩn; AI đề xuất ở trạng thái nhap';

create table khoa_hoc (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  ten text not null,
  mo_ta text not null default '',
  nguong_hoan_thanh smallint not null default 80,
  chong_tua_ao boolean not null default true,
  trang_thai text not null default 'mo' check (trang_thai in ('nhap','mo','dong')),
  tao_luc timestamptz not null default now()
);
create table module_hoc (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  khoa_hoc_id uuid not null references khoa_hoc(id) on delete cascade,
  ten text not null,
  thu_tu integer not null default 0
);
create table bai_hoc (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  module_hoc_id uuid not null references module_hoc(id) on delete cascade,
  ten text not null,
  thu_tu integer not null default 0,
  loai text not null default 'noi_dung' check (loai in ('noi_dung','video','quiz')),
  noi_dung text not null default '',
  video_url text,
  thoi_luong_giay integer not null default 300,
  cau_hoi jsonb not null default '[]'
);
create table ghi_danh (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  khoa_hoc_id uuid not null references khoa_hoc(id) on delete cascade,
  phan_tram smallint not null default 0,
  moc_da_phat jsonb not null default '[]',
  hoc_cuoi_luc timestamptz,
  hoan_thanh_luc timestamptz,
  tao_luc timestamptz not null default now(),
  unique (nguoi_dung_id, khoa_hoc_id)
);
create table tien_do_bai (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  ghi_danh_id uuid not null references ghi_danh(id) on delete cascade,
  bai_hoc_id uuid not null references bai_hoc(id) on delete cascade,
  giay_da_hoc integer not null default 0,
  diem_quiz smallint,
  hoan_thanh_luc timestamptz,
  unique (ghi_danh_id, bai_hoc_id)
);

create table diem_hoc (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  su_kien text not null,
  diem integer not null,
  ngay date not null,
  tham_chieu text,
  luc timestamptz not null default now()
);
create index on diem_hoc(workspace_id, nguoi_dung_id, ngay);
comment on table diem_hoc is 'F-129 sổ điểm gamification (chỉ INSERT)';

create table chung_chi (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  khoa_hoc_id uuid not null references khoa_hoc(id) on delete cascade,
  ma text not null unique,
  ten_nguoi text not null,
  ten_khoa text not null,
  cap_luc timestamptz not null default now(),
  thu_hoi_luc timestamptz,
  unique (nguoi_dung_id, khoa_hoc_id)
);

create table phien_luyen_tap (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  san_pham_id uuid references san_pham(id) on delete set null,
  do_kho text not null default 'vua' check (do_kho in ('de','vua','kho')),
  persona jsonb not null,
  lich_su jsonb not null default '[]',
  trang_thai text not null default 'dang' check (trang_thai in ('dang','xong','huy')),
  ket_qua jsonb,
  diem_tong smallint,
  che_do_ai text,
  tao_luc timestamptz not null default now(),
  ket_thuc_luc timestamptz
);
comment on table phien_luyen_tap is 'Role-play với AI đóng vai khách (mockup #62)';

create table cuoc_goi (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  san_pham_id uuid references san_pham(id) on delete set null,
  ten_khach text not null default '',
  goi_luc timestamptz not null default now(),
  thoi_luong_giay integer,
  ket_qua text not null default 'khac' check (ket_qua in ('thang','thua','hen','khac')),
  transcript text not null,
  luot jsonb not null default '[]',
  phan_tich jsonb,
  diem_tong smallint,
  trang_thai text not null default 'cho' check (trang_thai in ('cho','xong','loi')),
  che_do_ai text,
  loi text,
  tao_luc timestamptz not null default now()
);
comment on table cuoc_goi is 'F-115 Call Record: transcript + AI phân tích';

create table doan_mau (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  cuoc_goi_id uuid references cuoc_goi(id) on delete set null,
  loai_phan_doi text not null,
  noi_dung text not null,
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap','da_duyet','tu_choi')),
  tao_luc timestamptz not null default now()
);
comment on table doan_mau is 'F-116 thư viện đoạn mẫu (ẩn danh, qua duyệt)';

create table goi_huan_luyen (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  radar jsonb not null,
  noi_dung jsonb not null,
  che_do_ai text,
  tao_luc timestamptz not null default now()
);

create table nhiem_vu (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  cuoc_goi_id uuid references cuoc_goi(id) on delete set null,
  noi_dung text not null,
  han timestamptz,
  trang_thai text not null default 'mo' check (trang_thai in ('mo','xong','huy')),
  ly_do_huy text,
  tao_luc timestamptz not null default now()
);
comment on table nhiem_vu is 'F-117 task từ cam kết: không xóa, chỉ xong hoặc hủy kèm lý do';

create table log_sinh_ai (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  tac_vu text not null,
  che_do text not null,
  model text,
  tokens_vao integer,
  tokens_ra integer,
  thoi_gian_ms integer,
  ok boolean not null,
  loi text,
  luc timestamptz not null default now()
);
create table nhat_ky_kiem_toan (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  nguoi_dung_id uuid,
  hanh_dong text not null,
  doi_tuong text,
  chi_tiet jsonb not null default '{}',
  luc timestamptz not null default now()
);
create table su_kien (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  loai text not null,
  nguoi_dung_id uuid,
  payload jsonb not null default '{}',
  luc timestamptz not null default now()
);
create index on su_kien(workspace_id, loai, luc);

-- Bảng bất biến: chặn UPDATE/DELETE
create or replace function chan_sua_xoa() returns trigger language plpgsql as $$
begin raise exception 'Bảng % là bất biến (chỉ INSERT)', tg_table_name; end $$;
create trigger bat_bien_su_kien before update or delete on su_kien for each row execute function chan_sua_xoa();
create trigger bat_bien_kiem_toan before update or delete on nhat_ky_kiem_toan for each row execute function chan_sua_xoa();
create trigger bat_bien_log_ai before update or delete on log_sinh_ai for each row execute function chan_sua_xoa();
create trigger bat_bien_diem_hoc before update or delete on diem_hoc for each row execute function chan_sua_xoa();

-- RLS FORCE cho mọi bảng có workspace_id (kể cả chủ bảng). Không có ngữ cảnh → không thấy gì.
do $$
declare b text;
begin
  for b in select unnest(array['nguoi_dung','san_pham','kich_ban','phan_doi','khoa_hoc','module_hoc','bai_hoc','ghi_danh','tien_do_bai','diem_hoc','chung_chi','phien_luyen_tap','cuoc_goi','doan_mau','goi_huan_luyen','nhiem_vu','log_sinh_ai','nhat_ky_kiem_toan','su_kien']) loop
    execute format('alter table %I enable row level security', b);
    execute format('alter table %I force row level security', b);
    execute format('create policy tach_workspace on %I using (workspace_id = ws_hien_tai() or nen_tang_ok()) with check (workspace_id = ws_hien_tai() or nen_tang_ok())', b);
  end loop;
end $$;
-- Bảng workspace: chỉ thấy workspace hiện tại (tra cứu cấp nền tảng dùng hàm bypass bên dưới)
alter table workspace enable row level security;
alter table workspace force row level security;
create policy tach_workspace on workspace using (id = ws_hien_tai() or nen_tang_ok()) with check (id = ws_hien_tai() or nen_tang_ok());
-- Role ứng dụng local (app_user, không superuser) nếu tồn tại: cấp quyền để RLS thật sự có hiệu lực khi dev/test.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    execute 'grant usage on schema public to app_user';
    execute 'grant select, insert, update, delete on all tables in schema public to app_user';
    execute 'grant execute on all functions in schema public to app_user';
    execute 'alter default privileges in schema public grant select, insert, update, delete on tables to app_user';
    execute 'alter default privileges in schema public grant execute on functions to app_user';
  end if;
end $$;

-- Tra cứu cấp nền tảng (đăng nhập, xác thực chứng chỉ công khai): SECURITY DEFINER + cờ app.nen_tang đặt TRONG thân hàm
-- (Neon không cho khai báo SET app.* ở định nghĩa hàm), trả xong thì hạ cờ ngay để không rò ra phần còn lại của transaction.
create or replace function tim_nguoi_dung_theo_email(p_email text)
returns table (id uuid, workspace_id uuid, email text, ten text, mat_khau_hash text, vai_tro text, hoat_dong boolean, ws_ten text, ws_slug text, mui_gio text)
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.nen_tang', '1', true);
  return query
    select n.id, n.workspace_id, n.email, n.ten, n.mat_khau_hash, n.vai_tro, n.hoat_dong, w.ten, w.slug, w.mui_gio
    from nguoi_dung n join workspace w on w.id = n.workspace_id where lower(n.email) = lower(p_email) limit 1;
  perform set_config('app.nen_tang', '', true);
end $$;
create or replace function tra_chung_chi(p_ma text)
returns table (ma text, ten_nguoi text, ten_khoa text, cap_luc timestamptz, thu_hoi_luc timestamptz, ws_ten text)
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.nen_tang', '1', true);
  return query
    select c.ma, c.ten_nguoi, c.ten_khoa, c.cap_luc, c.thu_hoi_luc, w.ten from chung_chi c join workspace w on w.id = c.workspace_id where c.ma = upper(p_ma) limit 1;
  perform set_config('app.nen_tang', '', true);
end $$;
