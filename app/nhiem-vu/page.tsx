import { revalidatePath } from "next/cache";
import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang, dinhDangNgay } from "@/services/trang";
import { danhSachNhiemVu, capNhatNhiemVu } from "@/services/cuoc-goi";
export const dynamic = "force-dynamic";
export default async function TrangNhiemVu({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const ds = await ws((q) => danhSachNhiemVu(q, phien.vaiTro === "quan_ly" ? {} : { nguoiDungId: phien.nguoiDungId }));
  const { loi } = await searchParams;
  async function capNhat(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang();
    try { await ws((q) => capNhatNhiemVu(q, { id: String(form.get("id")), nguoiDungId: phien.nguoiDungId, vaiTro: phien.vaiTro, trangThai: String(form.get("trang_thai")) === "huy" ? "huy" : "xong", lyDo: String(form.get("ly_do") ?? "") })); }
    catch (e) { const { redirect } = await import("next/navigation"); redirect(`/nhiem-vu?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/nhiem-vu");
  }
  const mo = ds.filter((n) => n.trang_thai === "mo"), xong = ds.filter((n) => n.trang_thai !== "mo");
  return (
    <KhungShell phien={phien} duongDan="/nhiem-vu" tieuDe="Nhiệm vụ từ cam kết" moTa="Cam kết với khách từ cuộc gọi, bài tập quản lý giao và việc thường. Không xóa được — chỉ hoàn thành hoặc hủy kèm lý do.">
      {loi && <div className="text-sm px-3 py-2 rounded-lg mb-3" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
      <div className="the overflow-x-auto mb-4"><table className="bang">
        <thead><tr>{phien.vaiTro === "quan_ly" && <th>Sale</th>}<th>Nhiệm vụ</th><th>Khách</th><th>Hạn</th><th>Thao tác</th></tr></thead>
        <tbody>{mo.length === 0 ? <tr><td colSpan={5} className="text-center mo-ta py-6">Không có nhiệm vụ mở.</td></tr> : mo.map((n) => { const qua = n.han && new Date(n.han) < new Date(); return (
          <tr key={n.id}>{phien.vaiTro === "quan_ly" && <td>{n.ten_sale}</td>}<td><div className="font-medium">{n.noi_dung}</div><div className="flex gap-1 mt-1"><span className={`nhan ${n.loai === "cam_ket" ? "nhan-vang" : n.loai === "bai_tap" ? "nhan-tim" : "nhan-xam"}`}>{n.loai === "cam_ket" ? "Cam kết với khách" : n.loai === "bai_tap" ? "Bài tập" : "Việc"}</span>{n.ten_nguoi_giao && <span className="text-[11px]" style={{ color: "var(--chu-mo)" }}>giao bởi {n.ten_nguoi_giao}</span>}{n.lien_ket && <Link href={n.lien_ket} className="nut nut-nho nut-chinh">Làm ngay</Link>}</div></td><td>{n.cuoc_goi_id ? <Link href={`/cuoc-goi/${n.cuoc_goi_id}`} className="hover:underline">{n.ten_khach || "Xem cuộc gọi"}</Link> : "—"}</td>
            <td><span className={`nhan ${qua ? "nhan-do" : "nhan-xam"}`}>{dinhDangNgay(n.han, phien.muiGio)}{qua ? " · quá hạn" : ""}</span></td>
            <td><div className="flex gap-1 items-center"><form action={capNhat}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="trang_thai" value="xong" /><button className="nut nut-nho">Xong</button></form>
              <form action={capNhat} className="flex gap-1"><input type="hidden" name="id" value={n.id} /><input type="hidden" name="trang_thai" value="huy" /><input name="ly_do" className="o-nhap py-1 text-xs w-36" placeholder="Lý do hủy" /><button className="nut nut-nho nut-nguy">Hủy</button></form></div></td></tr>); })}</tbody>
      </table></div>
      {xong.length > 0 && <details className="the p-4"><summary className="font-semibold cursor-pointer">Đã xử lý ({xong.length})</summary><table className="bang mt-2"><tbody>{xong.map((n) => <tr key={n.id}><td>{n.noi_dung}</td><td><span className={`nhan ${n.trang_thai === "xong" ? "nhan-xanh" : "nhan-xam"}`}>{n.trang_thai === "xong" ? "Xong" : `Hủy: ${n.ly_do_huy}`}</span></td></tr>)}</tbody></table></details>}
    </KhungShell>
  );
}
