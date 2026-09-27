-- Nhiệm vụ giao tay (quản lý giao bài tập role-play / việc cho sale) + liên kết hành động; cài đặt workspace.
alter table nhiem_vu add column loai text not null default 'cam_ket' check (loai in ('cam_ket','bai_tap','viec'));
alter table nhiem_vu add column lien_ket text;
alter table nhiem_vu add column nguoi_giao_id uuid references nguoi_dung(id) on delete set null;
comment on column nhiem_vu.loai is 'cam_ket: từ cuộc gọi (không xóa); bai_tap: quản lý giao role-play; viec: việc thường';
alter table workspace add column nguong_rot_hoc_ngay smallint not null default 7;
alter table workspace add column cap_nhat_luc timestamptz not null default now();
