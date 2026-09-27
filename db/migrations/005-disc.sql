-- Kịch bản chốt theo 4 nhóm DISC (mỗi sản phẩm × nhóm một bản, AI sinh → nháp → duyệt) + nhận diện DISC trong cuộc gọi và role-play.
create table kich_ban_disc (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace(id) on delete cascade,
  san_pham_id uuid not null references san_pham(id) on delete cascade,
  nhom text not null check (nhom in ('D','I','S','C')),
  noi_dung jsonb not null,
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap','da_duyet')),
  che_do_ai text,
  phien_ban_dna integer,
  cap_nhat_luc timestamptz not null default now(),
  tao_luc timestamptz not null default now(),
  unique (san_pham_id, nhom)
);
alter table kich_ban_disc enable row level security;
alter table kich_ban_disc force row level security;
create policy tach_workspace on kich_ban_disc using (workspace_id = ws_hien_tai() or nen_tang_ok()) with check (workspace_id = ws_hien_tai() or nen_tang_ok());
do $$ begin if exists (select 1 from pg_roles where rolname = 'app_user') then execute 'grant select, insert, update, delete on kich_ban_disc to app_user'; end if; end $$;
alter table cuoc_goi add column disc text check (disc in ('D','I','S','C'));
alter table cuoc_goi add column disc_tin_cay smallint;
alter table phien_luyen_tap add column disc text check (disc in ('D','I','S','C'));
