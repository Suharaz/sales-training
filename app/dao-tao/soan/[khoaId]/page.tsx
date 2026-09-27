import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { yeuCauQuanLy } from "@/services/xac-thuc";
import { chiTietKhoa, luuKhoa, luuModule, xoaModule, luuBai, xoaBai, doiThuTu, phanTichQuizVanBan, quizThanhVanBan } from "@/services/dao-tao";
export const dynamic = "force-dynamic";
const HD_QUIZ = `Mỗi câu cách nhau một dòng trống. Dòng 1: câu hỏi. Các dòng sau: lựa chọn, đáp án đúng bắt đầu bằng dấu *. Dòng bắt đầu bằng > là giải thích.

Trong 10 phút đầu, khách nên nói bao nhiêu %?
30%
* 70%
90%
> Nguyên tắc 70/30.`;
export default async function TrangSoanNoiDung({ params, searchParams }: { params: Promise<{ khoaId: string }>; searchParams: Promise<{ loi?: string; sua?: string }> }) {
  await yeuCauQuanLy();
  const { khoaId } = await params; const { loi, sua } = await searchParams;
  const { phien, ws } = await nguCanhTrang();
  const ct = await ws((q) => chiTietKhoa(q, khoaId));
  if (!ct) notFound();
  const ve = `/dao-tao/soan/${khoaId}`;
  async function suaKhoa(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; try { await ws((q) => luuKhoa(q, { workspaceId: phien.workspaceId, id: khoaId, ten: String(form.get("ten") ?? ""), moTa: String(form.get("mo_ta") ?? ""), nguong: Number(form.get("nguong") ?? 80), chongTuaAo: form.get("chong_tua_ao") === "1", trangThai: String(form.get("trang_thai") ?? "nhap") })); } catch (e) { redirect(`/dao-tao/soan/${khoaId}?loi=${encodeURIComponent((e as Error).message)}`); } revalidatePath(ve); }
  async function themModule(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; try { await ws((q) => luuModule(q, { workspaceId: phien.workspaceId, khoaId, id: String(form.get("id") ?? "") || undefined, ten: String(form.get("ten") ?? "") })); } catch (e) { redirect(`/dao-tao/soan/${khoaId}?loi=${encodeURIComponent((e as Error).message)}`); } revalidatePath(ve); }
  async function boModule(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => xoaModule(q, String(form.get("id")))); revalidatePath(ve); }
  async function luuBaiHoc(form: FormData) {
    "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const loai = String(form.get("loai") ?? "noi_dung");
    try { await ws((q) => luuBai(q, { workspaceId: phien.workspaceId, moduleId: String(form.get("module_id")), id: String(form.get("id") ?? "") || undefined, ten: String(form.get("ten") ?? ""), loai, noiDung: String(form.get("noi_dung") ?? ""), videoUrl: String(form.get("video_url") ?? ""), thoiLuongPhut: Number(form.get("thoi_luong_phut") ?? 5), cauHoi: loai === "quiz" ? phanTichQuizVanBan(String(form.get("quiz") ?? "")) : [] })); } catch (e) { redirect(`/dao-tao/soan/${khoaId}?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath(ve); redirect(ve);
  }
  async function boBai(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => xoaBai(q, String(form.get("id")))); revalidatePath(ve); }
  async function doi(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => doiThuTu(q, { bang: String(form.get("bang")) === "module_hoc" ? "module_hoc" : "bai_hoc", id: String(form.get("id")), huong: String(form.get("huong")) === "len" ? "len" : "xuong" })); revalidatePath(ve); }
  const baiSua = sua ? ct.modules.flatMap((m) => m.bai).find((b) => b.id === sua) : undefined;
  return (
    <KhungShell phien={phien} duongDan="/dao-tao" tieuDe={`Soạn: ${ct.khoa.ten}`} moTa={`${ct.khoa.so_module} module · ${ct.khoa.so_bai} bài`} hanhDong={<><Link href="/dao-tao/soan" className="nut">← Danh sách khóa</Link><Link href={`/dao-tao/${khoaId}`} className="nut">Xem như học viên</Link></>}>
      {loi && <div className="thong-bao thong-bao-do mb-3">{loi}</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-3">
          <form action={suaKhoa} className="the p-4 grid gap-2 text-sm md:grid-cols-2">
            <div className="md:col-span-2 font-semibold">Thông tin khóa</div>
            <input name="ten" className="o-nhap md:col-span-2" defaultValue={ct.khoa.ten} required /><textarea name="mo_ta" className="o-nhap md:col-span-2" rows={2} defaultValue={ct.khoa.mo_ta} />
            <label className="flex items-center gap-2">Ngưỡng %<input name="nguong" type="number" min={1} max={100} defaultValue={ct.khoa.nguong_hoan_thanh} className="o-nhap w-20" /></label>
            <select name="trang_thai" className="o-nhap" defaultValue={ct.khoa.trang_thai}><option value="nhap">Nháp (ẩn)</option><option value="mo">Đang mở</option><option value="dong">Đã đóng</option></select>
            <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" name="chong_tua_ao" value="1" defaultChecked={ct.khoa.chong_tua_ao} />Chống tua ảo</label>
            <div className="md:col-span-2"><button className="nut nut-chinh">Lưu khóa</button></div>
          </form>
          {ct.modules.map((m, mi) => (
            <div key={m.id} className="the p-4">
              <div className="flex items-center gap-2 mb-2"><form action={themModule} className="flex-1 flex gap-1"><input type="hidden" name="id" value={m.id} /><span className="font-semibold shrink-0 pt-1.5">Module {mi + 1}</span><input name="ten" className="o-nhap py-1" defaultValue={m.ten} /><button className="nut nut-nho">Đổi tên</button></form>
                <form action={doi}><input type="hidden" name="bang" value="module_hoc" /><input type="hidden" name="id" value={m.id} /><button name="huong" value="len" className="nut nut-nho">↑</button></form><form action={doi}><input type="hidden" name="bang" value="module_hoc" /><input type="hidden" name="id" value={m.id} /><button name="huong" value="xuong" className="nut nut-nho">↓</button></form>
                <form action={boModule}><input type="hidden" name="id" value={m.id} /><button className="nut nut-nho nut-nguy">Xóa module</button></form></div>
              <table className="bang"><tbody>{m.bai.map((b) => (
                <tr key={b.id}><td className="w-8 tabular">{b.thu_tu + 1}</td><td className="font-medium">{b.ten}</td><td><span className="nhan nhan-xam">{b.loai === "quiz" ? `Quiz ${b.cau_hoi.length} câu` : b.loai === "video" ? "Video" : `${Math.round(b.thoi_luong_giay / 60)} phút`}</span></td>
                  <td className="text-right"><div className="flex gap-1 justify-end"><form action={doi}><input type="hidden" name="bang" value="bai_hoc" /><input type="hidden" name="id" value={b.id} /><button name="huong" value="len" className="nut nut-nho">↑</button></form><form action={doi}><input type="hidden" name="bang" value="bai_hoc" /><input type="hidden" name="id" value={b.id} /><button name="huong" value="xuong" className="nut nut-nho">↓</button></form>
                    <Link href={`${ve}?sua=${b.id}`} className="nut nut-nho">Sửa</Link><form action={boBai}><input type="hidden" name="id" value={b.id} /><button className="nut nut-nho nut-nguy">Xóa</button></form></div></td></tr>))}
                {m.bai.length === 0 && <tr><td colSpan={4} className="mo-ta">Chưa có bài. Thêm ở cột phải (chọn module này).</td></tr>}</tbody></table>
            </div>))}
          <form action={themModule} className="the p-4 flex gap-2 text-sm"><input name="ten" className="o-nhap" placeholder="Tên module mới" required /><button className="nut nut-chinh shrink-0">Thêm module</button></form>
        </div>
        <form action={luuBaiHoc} className="the p-4 flex flex-col gap-2 text-sm h-fit" key={baiSua?.id ?? "moi"}>
          <div className="font-semibold">{baiSua ? `Sửa bài: ${baiSua.ten}` : "Thêm bài học"}</div>
          {baiSua && <input type="hidden" name="id" value={baiSua.id} />}
          <select name="module_id" className="o-nhap" defaultValue={baiSua?.module_hoc_id ?? ct.modules[0]?.id ?? ""} required>{ct.modules.map((m, i) => <option key={m.id} value={m.id}>Module {i + 1}: {m.ten}</option>)}</select>
          <input name="ten" className="o-nhap" placeholder="Tên bài" required defaultValue={baiSua?.ten} />
          <select name="loai" className="o-nhap" defaultValue={baiSua?.loai ?? "noi_dung"}><option value="noi_dung">Nội dung (văn bản)</option><option value="video">Video (nhúng)</option><option value="quiz">Bài kiểm tra</option></select>
          <label className="flex items-center gap-2">Thời lượng (phút)<input name="thoi_luong_phut" type="number" min={0} className="o-nhap w-24" defaultValue={baiSua ? Math.round(baiSua.thoi_luong_giay / 60) : 5} /></label>
          <input name="video_url" className="o-nhap" placeholder="Link nhúng video https://www.youtube.com/embed/… (bài video)" defaultValue={baiSua?.video_url ?? ""} />
          <textarea name="noi_dung" className="o-nhap font-mono text-[12px]" rows={8} placeholder="Nội dung bài (hỗ trợ ## tiêu đề, - gạch đầu dòng, **đậm**)" defaultValue={baiSua?.noi_dung} />
          <textarea name="quiz" className="o-nhap font-mono text-[12px]" rows={8} placeholder={HD_QUIZ} defaultValue={baiSua?.loai === "quiz" ? quizThanhVanBan(baiSua.cau_hoi) : ""} />
          <div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>Quiz: mỗi câu cách một dòng trống, đáp án đúng bắt đầu bằng *, dòng {">"} là giải thích. Cần ≥ 70% để qua.</div>
          <div className="flex gap-2"><button className="nut nut-chinh">{baiSua ? "Lưu bài" : "Thêm bài"}</button>{baiSua && <Link href={ve} className="nut">Hủy</Link>}</div>
        </form>
      </div>
    </KhungShell>
  );
}
