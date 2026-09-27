-- Màn hình khởi động cho workspace mới: quản lý được yêu cầu nạp DNA + sản phẩm ngay sau đăng nhập (có thể bỏ qua).
alter table workspace add column khoi_dong_xong boolean not null default false;
update workspace w set khoi_dong_xong = true where exists (select 1 from ho_so_dna d where d.workspace_id = w.id and d.ten_doanh_nghiep <> '');
