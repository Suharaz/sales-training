-- Tích hợp giọng nói theo workspace: người dùng tự nhập khóa ElevenLabs / Azure Speech trong app. Khóa mã hóa AES-256-GCM (core/ma-hoa.ts).
create table tich_hop_giong_noi (
  workspace_id uuid primary key references workspace(id) on delete cascade,
  tts text not null default 'trinh_duyet' check (tts in ('trinh_duyet','elevenlabs','azure')),
  stt text not null default 'trinh_duyet' check (stt in ('trinh_duyet','azure')),
  elevenlabs_key_mh text,
  elevenlabs_voice_id text,
  elevenlabs_model text not null default 'eleven_flash_v2_5',
  azure_key_mh text,
  azure_region text,
  azure_voice text not null default 'vi-VN-HoaiMyNeural',
  toc_do numeric(3,2) not null default 1.0,
  cap_nhat_luc timestamptz not null default now()
);
alter table tich_hop_giong_noi enable row level security;
alter table tich_hop_giong_noi force row level security;
create policy tach_workspace on tich_hop_giong_noi using (workspace_id = ws_hien_tai() or nen_tang_ok()) with check (workspace_id = ws_hien_tai() or nen_tang_ok());
do $$ begin if exists (select 1 from pg_roles where rolname = 'app_user') then execute 'grant select, insert, update, delete on tich_hop_giong_noi to app_user'; end if; end $$;
