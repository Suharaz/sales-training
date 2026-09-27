// F-128: xét học viên có nguy cơ rớt học theo nhịp học.
export type MucRui = "cao" | "trung_binh" | "thap" | "xong";
export function mucRuiRo(o: { hocCuoiLuc: string | null; hoanThanhLuc: string | null; nguongNgay: number; bayGio?: number }): { muc: MucRui; ngayKhongHoc: number } {
  if (o.hoanThanhLuc) return { muc: "xong", ngayKhongHoc: 0 };
  const bayGio = o.bayGio ?? Date.now();
  const ngay = o.hocCuoiLuc ? Math.floor((bayGio - new Date(o.hocCuoiLuc).getTime()) / 86_400_000) : 999;
  if (ngay >= o.nguongNgay) return { muc: "cao", ngayKhongHoc: ngay };
  if (ngay >= Math.ceil(o.nguongNgay / 2)) return { muc: "trung_binh", ngayKhongHoc: ngay };
  return { muc: "thap", ngayKhongHoc: ngay };
}
export const TEN_MUC_RUI: Record<MucRui, string> = { cao: "Cao", trung_binh: "Trung bình", thap: "Thấp", xong: "Đã hoàn thành" };
