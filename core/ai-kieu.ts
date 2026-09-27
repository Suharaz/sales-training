// Kiểu dữ liệu và lược đồ zod cho MỌI đầu ra AI (gateway ép model trả đúng lược đồ; chế độ dự phòng cũng trả đúng kiểu này).
import { z } from "zod";
import { KY_NANG } from "./khung-ky-nang";
import { LOAI_PHAN_DOI } from "./phan-doi";
import { discSchema } from "./disc";

const diemKhungSchema = z.object(Object.fromEntries(KY_NANG.map((k) => [k, z.number().min(0).max(100)])) as Record<(typeof KY_NANG)[number], z.ZodNumber>);
const loaiPhanDoi = z.enum(LOAI_PHAN_DOI);

export const DO_KHO = ["de", "vua", "kho"] as const;
export type DoKho = (typeof DO_KHO)[number];
export const TEN_DO_KHO: Record<DoKho, string> = { de: "Dễ — khách cởi mở", vua: "Vừa — khách có 2 phản đối", kho: "Khó — khách hoài nghi, nhiều phản đối" };

export const personaSchema = z.object({
  ten: z.string().min(1),
  chuc_danh: z.string(),
  cong_ty: z.string(),
  boi_canh: z.string(),
  muc_tieu: z.string(),
  noi_dau: z.string(),
  ngan_sach: z.string(),
  tinh_cach: z.string(),
  phan_doi_chinh: z.array(loaiPhanDoi).min(1).max(4),
  disc: discSchema.optional(),
});
export type Persona = z.infer<typeof personaSchema>;

export const luotKhachSchema = z.object({
  noi_dung: z.string().min(1),
  cam_xuc: z.enum(["tich_cuc", "trung_tinh", "tieu_cuc"]),
  phan_doi_dang_neu: loaiPhanDoi.nullable(),
  san_sang_chot: z.number().min(0).max(100),
  ket_thuc: z.boolean(),
});
export type LuotKhach = z.infer<typeof luotKhachSchema>;

export const ketQuaLuyenTapSchema = z.object({
  diem: diemKhungSchema,
  nhan_xet_chung: z.string(),
  diem_manh: z.array(z.string()),
  can_cai_thien: z.array(z.string()),
  goi_y_theo_luot: z.array(z.object({ luot: z.number(), van_de: z.string(), cau_tot_hon: z.string() })),
  phan_doi_da_gap: z.array(z.object({ loai: loaiPhanDoi, xu_ly_tot: z.boolean(), ghi_chu: z.string() })),
  phu_hop_disc: z.object({ diem: z.number().min(0).max(100), nhan_xet: z.string() }).optional(),
});
export type KetQuaLuyenTap = z.infer<typeof ketQuaLuyenTapSchema>;

export const phanTichCuocGoiSchema = z.object({
  tom_tat: z.object({
    nhu_cau: z.array(z.string()),
    phan_doi: z.array(z.string()),
    cam_ket: z.array(z.object({ noi_dung: z.string(), ben: z.enum(["sale", "khach"]), han: z.string().nullable() })),
    buoc_tiep: z.string(),
  }),
  diem: diemKhungSchema,
  vi_du_theo_ky_nang: z.array(z.object({ ky_nang: z.enum(KY_NANG), vi_du: z.string() })),
  phan_doi_phat_hien: z.array(z.object({ loai: loaiPhanDoi, noi_dung: z.string(), sale_tra_loi: z.string(), de_xuat_cau_tra_loi: z.string() })),
  doan_hay: z.array(z.object({ loai_phan_doi: loaiPhanDoi, trich_doan: z.string() })),
  ty_le_sale_noi: z.number().min(0).max(100),
  so_cau_hoi_sale: z.number().min(0),
  cam_xuc_khach: z.number().min(-1).max(1),
  rui_ro_tuan_thu: z.array(z.string()),
  disc: z.object({ nhom: discSchema, tin_cay: z.number().min(0).max(100), ly_do: z.string(), goi_y_lan_sau: z.string() }).nullable().optional(),
});
export type PhanTichCuocGoi = z.infer<typeof phanTichCuocGoiSchema>;

export const goiHuanLuyenSchema = z.object({
  tom_tat: z.string(),
  diem_yeu: z.array(z.enum(KY_NANG)).min(1).max(3),
  bai_de_xuat: z.array(z.object({ tieu_de: z.string(), ly_do: z.string() })),
  bai_tap: z.array(z.object({ ten: z.string(), tinh_huong: z.string(), loai_phan_doi: loaiPhanDoi, muc_tieu: z.string() })).min(1),
  loi_khuyen: z.array(z.string()),
});
export type GoiHuanLuyen = z.infer<typeof goiHuanLuyenSchema>;

export const goiYTraLoiSchema = z.object({ cau_tra_loi: z.string().min(1), ly_do: z.string() });
export type GoiYTraLoi = z.infer<typeof goiYTraLoiSchema>;

export type LuotHoiThoai = { vai: "sale" | "khach"; noi_dung: string; luc: string };

export { dnaSchema as dnaTrichSchema } from "./dna";

// Copilot cuộc gọi trực tiếp: gợi ý trong khi sale đang gọi (độ trễ thấp, câu ngắn).
export const copilotSchema = z.object({
  noi_tiep: z.string(),                       // câu nên nói ngay (≤ 2 câu)
  cau_hoi_nen_hoi: z.array(z.string()).max(3), // câu hỏi khai thác nên hỏi tiếp
  phan_doi: z.object({ loai: loaiPhanDoi, cau_tra_loi: z.string() }).nullable(),
  canh_bao: z.array(z.string()).max(3),       // tuân thủ / rủi ro
  tin_hieu: z.enum(["tich_cuc", "trung_tinh", "tieu_cuc"]),
  san_sang_chot: z.number().min(0).max(100),
  buoc_tiep: z.string(),                      // bước chốt/đề xuất phù hợp lúc này
  disc_doan: z.object({ nhom: discSchema, tin_cay: z.number().min(0).max(100), chinh_cach_noi: z.string() }).nullable().optional(),
});
export type GoiYCopilot = z.infer<typeof copilotSchema>;
