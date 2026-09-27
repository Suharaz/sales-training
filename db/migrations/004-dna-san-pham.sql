-- DNA doanh nghiệp (M10 F-056/F-057 rút gọn): một hồ sơ mỗi workspace, có phiên bản; AI Gateway tự nạp vào mọi tác vụ.
create table ho_so_dna (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade unique,
  ten_doanh_nghiep text not null default '',
  nganh text not null default '',
  mo_ta text not null default '',
  khach_hang_muc_tieu text not null default '',
  noi_dau_khach text not null default '',
  usp jsonb not null default '[]',
  xung_ho text not null default 'em – anh/chị',
  phong_cach text not null default '',
  tu_cam jsonb not null default '[]',
  so_lieu_cho_phep jsonb not null default '[]',
  doi_thu text not null default '',
  chinh_sach text not null default '',
  cau_chuyen text not null default '',
  nguon_nap text not null default 'thu_cong' check (nguon_nap in ('thu_cong','ai_trich')),
  phien_ban integer not null default 1,
  cap_nhat_luc timestamptz not null default now(),
  tao_luc timestamptz not null default now()
);
comment on table ho_so_dna is 'DNA Profile (spec 2.3): hồ sơ doanh nghiệp có phiên bản, nội dung AI sinh tham chiếu phiên bản đã dùng';
alter table ho_so_dna enable row level security;
alter table ho_so_dna force row level security;
create policy tach_workspace on ho_so_dna using (workspace_id = ws_hien_tai() or nen_tang_ok()) with check (workspace_id = ws_hien_tai() or nen_tang_ok());
do $$ begin if exists (select 1 from pg_roles where rolname = 'app_user') then execute 'grant select, insert, update, delete on ho_so_dna to app_user'; end if; end $$;

-- Sản phẩm: hồ sơ đầy đủ (F-098 rút gọn) để AI đóng vai khách và gợi ý câu trả lời đúng sản phẩm.
alter table san_pham add column doi_tuong text not null default '';
alter table san_pham add column ket_qua_ky_vong text not null default '';
alter table san_pham add column hinh_thuc text not null default '';
alter table san_pham add column thoi_luong text not null default '';
alter table san_pham add column chinh_sach text not null default '';
alter table san_pham add column so_sanh_doi_thu text not null default '';
alter table san_pham add column phan_doi_thuong_gap jsonb not null default '[]';
alter table san_pham add column tai_lieu_url text;
alter table san_pham add column trang_thai text not null default 'dang_ban' check (trang_thai in ('dang_ban','ngung'));
alter table log_sinh_ai add column phien_ban_dna integer;
