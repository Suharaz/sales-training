-- Bảng bất biến vẫn chặn UPDATE/DELETE, trừ khi pipeline xóa dữ liệu (F-135, quyền xóa theo NĐ13) đặt cờ app.xoa_du_lieu = '1'
-- trong cùng transaction. Cờ này chỉ script dọn/xóa cấp nền tảng dùng, ứng dụng không bao giờ đặt.
create or replace function chan_sua_xoa() returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.xoa_du_lieu', true), '') = '1' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'Bảng % là bất biến (chỉ INSERT)', tg_table_name;
end $$;
