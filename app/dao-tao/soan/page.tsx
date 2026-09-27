import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { yeuCauQuanLy } from "@/services/xac-thuc";
import { danhSachKhoaQuanLy, luuKhoa, xoaKhoa } from "@/services/dao-tao";
export const dynamic = "force-dynamic";
const TEN_TT: Record<string, string> = { nhap: "Nháp", mo: "Đang mở", dong: "Đã đóng" };
export default async function TrangSoanKhoa({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  await yeuCauQuanLy();
  const { phien, ws } = await nguCanhTrang();
  const khoa = await ws((q) => danhSachKhoaQuanLy(q));
  const { loi } = await searchParams;
  async function tao(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    let id = "";
    try { id = await ws((q) => luuKhoa(q, { workspaceId: phien.workspaceId, ten: String(form.get("ten") ?? ""), moTa: String(form.get("mo_ta") ?? ""), nguong: Number(form.get("nguong") ?? 80), chongTuaAo: form.get("chong_tua_ao") === "1", trangThai: "nhap" })); }
    catch (e) { redirect(`/dao-tao/soan?loi=${encodeURIComponent((e as Error).message)}`); }
    redirect(`/dao-tao/soan/${id}`);
  }
  async function xoa(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => xoaKhoa(q, String(form.get("id")))); revalidatePath("/dao-tao/soan"); }
  return (
    <KhungShell phien={phien} duongDan="/dao-tao" tieuDe="Soạn khóa học" moTa="Tạo khóa, module, bài học và bài kiểm tra. Khóa ở trạng thái Nháp không hiện cho học viên." hanhDong={<Link href="/dao-tao" className="nut">← Đào tạo</Link>}>
      {loi && <div className="thong-bao thong-bao-do mb-3">{loi}</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="the overflow-x-auto"><table className="bang"><thead><tr><th>Khóa</th><th>Module / bài</th><th>Ngưỡng</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>{khoa.length === 0 ? <tr><td colSpan={5} className="text-center mo-ta py-6">Chưa có khóa nào.</td></tr> : khoa.map((k) => (
            <tr key={k.id}><td><div className="font-medium">{k.ten}</div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>{k.mo_ta}</div></td><td className="tabular">{k.so_module} / {k.so_bai}</td><td className="tabular">{k.nguong_hoan_thanh}%</td>
              <td><span className={`nhan ${k.trang_thai === "mo" ? "nhan-xanh" : k.trang_thai === "dong" ? "nhan-xam" : "nhan-vang"}`}>{TEN_TT[k.trang_thai]}</span></td>
              <td><div className="flex gap-1"><Link href={`/dao-tao/soan/${k.id}`} className="nut nut-nho nut-chinh">Soạn</Link><form action={xoa}><input type="hidden" name="id" value={k.id} /><button className="nut nut-nho nut-nguy" onClick={undefined}>Xóa</button></form></div></td></tr>))}</tbody></table></div>
        <form action={tao} className="the p-4 flex flex-col gap-2 text-sm h-fit"><div className="font-semibold">Khóa mới</div>
          <input name="ten" className="o-nhap" placeholder="Tên khóa" required /><textarea name="mo_ta" className="o-nhap" rows={3} placeholder="Mô tả ngắn" />
          <label className="flex items-center gap-2">Ngưỡng hoàn thành (%)<input name="nguong" type="number" min={1} max={100} defaultValue={80} className="o-nhap w-24" /></label>
          <label className="flex items-center gap-2"><input type="checkbox" name="chong_tua_ao" value="1" defaultChecked />Chống tua ảo (cần ở lại ≥ 60% thời lượng bài)</label>
          <button className="nut nut-chinh">Tạo và soạn nội dung</button></form>
      </div>
    </KhungShell>
  );
}
