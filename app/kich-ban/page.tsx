import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { danhSachKichBan, danhSachSanPham, khoPhanDoi, luuKichBan, xoaKichBan, luuPhanDoi, duyetPhanDoi, xoaPhanDoi } from "@/services/kich-ban";
import { LOAI_PHAN_DOI, TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
import { FormKichBan, FormPhanDoi } from "@/components/FormKichBan";
export const dynamic = "force-dynamic";
export default async function TrangKichBan({ searchParams }: { searchParams: Promise<{ tab?: string; sua?: string; loi?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { tab = "kich-ban", sua, loi } = await searchParams;
  const [kb, sp, pd] = await ws(async (q) => Promise.all([danhSachKichBan(q), danhSachSanPham(q), khoPhanDoi(q, {})]));
  const quanLy = phien.vaiTro === "quan_ly";
  async function luuKb(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    try { await ws((q) => luuKichBan(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id") ?? "") || undefined, sanPhamId: String(form.get("san_pham_id") ?? "") || null, ten: String(form.get("ten") ?? ""), moDau: String(form.get("mo_dau") ?? ""), khaiThac: String(form.get("khai_thac") ?? ""), giaTri: String(form.get("gia_tri") ?? ""), chot: String(form.get("chot") ?? "") })); }
    catch (e) { redirect(`/kich-ban?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/kich-ban"); redirect("/kich-ban");
  }
  async function xoaKb(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => xoaKichBan(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id")) })); revalidatePath("/kich-ban"); }
  async function luuPd(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    try { await ws((q) => luuPhanDoi(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id") ?? "") || undefined, loai: String(form.get("loai")), noiDung: String(form.get("noi_dung") ?? ""), cauTraLoi: String(form.get("cau_tra_loi") ?? "") })); }
    catch (e) { redirect(`/kich-ban?tab=phan-doi&loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/kich-ban"); redirect("/kich-ban?tab=phan-doi");
  }
  async function duyetPd(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => duyetPhanDoi(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id")), trangThai: String(form.get("trang_thai")) === "tu_choi" ? "tu_choi" : "da_duyet", cauTraLoi: String(form.get("cau_tra_loi") ?? "") || undefined })); revalidatePath("/kich-ban"); }
  async function xoaPd(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => xoaPhanDoi(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, id: String(form.get("id")) })); revalidatePath("/kich-ban"); }
  const kbSua = sua ? kb.find((k) => k.id === sua) : undefined;
  const pdSua = sua ? pd.find((p) => p.id === sua) : undefined;
  const pdCho = pd.filter((p) => p.trang_thai === "nhap"), pdDuyet = pd.filter((p) => p.trang_thai === "da_duyet");
  return (
    <KhungShell phien={phien} duongDan="/kich-ban" tieuDe="Kịch bản & Kho phản đối" moTa="Kịch bản gọi 4 phần theo sản phẩm và câu trả lời chuẩn cho từng loại phản đối (F-114, F-038).">
      <div className="flex gap-1 mb-4">{[["kich-ban", `Kịch bản (${kb.length})`], ["phan-doi", `Kho phản đối (${pdDuyet.length})${pdCho.length ? ` · ${pdCho.length} chờ duyệt` : ""}`]].map(([t, n]) => <a key={t} href={`/kich-ban?tab=${t}`} className={`nut ${tab === t ? "nut-chinh" : ""}`}>{n}</a>)}<a href="/kich-ban/disc" className="nut">Kịch bản theo DISC →</a><a href="/san-pham" className="nut">Sản phẩm ({sp.length}) →</a></div>
      {loi && <div className="text-sm px-3 py-2 rounded-lg mb-3" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
      {tab === "kich-ban" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-3">{kb.length === 0 && <div className="the p-8 text-center mo-ta">Chưa có kịch bản.</div>}{kb.map((k) => (
            <div key={k.id} className="the p-4"><div className="flex items-start justify-between gap-2 mb-2"><div><div className="font-semibold">{k.ten}</div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>{k.ten_san_pham ?? "Không gắn sản phẩm"}</div></div>
              {quanLy && <div className="flex gap-1"><a href={`/kich-ban?sua=${k.id}`} className="nut nut-nho">Sửa</a><form action={xoaKb}><input type="hidden" name="id" value={k.id} /><button className="nut nut-nho nut-nguy">Xóa</button></form></div>}</div>
              <div className="grid gap-2 md:grid-cols-2 text-sm">{[["Mở đầu", k.mo_dau], ["Khai thác", k.khai_thac], ["Trình bày giá trị", k.gia_tri], ["Chốt", k.chot]].map(([t, n]) => <div key={t} className="the-2 p-3"><div className="text-xs font-semibold mb-1" style={{ color: "var(--nhan-sang)" }}>{t}</div><div className="whitespace-pre-wrap" style={{ color: "var(--chu-mo)" }}>{n || "—"}</div></div>)}</div></div>))}</div>
          {quanLy && <div className="the p-4 h-fit"><div className="font-semibold mb-2">{kbSua ? "Sửa kịch bản" : "Thêm kịch bản"}</div><FormKichBan action={luuKb} sanPham={sp.map((s) => ({ id: s.id, ten: s.ten }))} kichBan={kbSua ? { id: kbSua.id, san_pham_id: kbSua.san_pham_id, ten: kbSua.ten, mo_dau: kbSua.mo_dau, khai_thac: kbSua.khai_thac, gia_tri: kbSua.gia_tri, chot: kbSua.chot } : undefined} /></div>}
        </div>)}
      {tab === "phan-doi" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-4">
            {pdCho.length > 0 && <div className="the p-4" style={{ borderColor: "var(--vang)" }}><div className="font-semibold mb-1">Chờ duyệt ({pdCho.length})</div><div className="mo-ta mb-3">AI phát hiện từ cuộc gọi thật. Chỉ hiệu lực sau khi quản lý duyệt.</div>
              <div className="flex flex-col gap-3">{pdCho.map((p) => (
                <form key={p.id} action={duyetPd} className="the-2 p-3 text-sm flex flex-col gap-2"><input type="hidden" name="id" value={p.id} />
                  <div><span className="nhan nhan-vang mr-2">{TEN_LOAI_PHAN_DOI[p.loai]}</span><b>“{p.noi_dung}”</b>{p.cuoc_goi_id && <a href={`/cuoc-goi/${p.cuoc_goi_id}`} className="text-xs ml-2" style={{ color: "var(--nhan-sang)" }}>cuộc gọi →</a>}</div>
                  <textarea name="cau_tra_loi" className="o-nhap" rows={3} defaultValue={p.cau_tra_loi_chuan} disabled={!quanLy} />
                  {quanLy && <div className="flex gap-1"><button name="trang_thai" value="da_duyet" className="nut nut-nho nut-chinh">Duyệt vào kho</button><button name="trang_thai" value="tu_choi" className="nut nut-nho">Từ chối</button></div>}</form>))}</div></div>}
            <div className="the overflow-x-auto"><table className="bang"><thead><tr><th>Loại</th><th>Phản đối</th><th>Câu trả lời chuẩn</th><th>Gặp</th>{quanLy && <th></th>}</tr></thead>
              <tbody>{pdDuyet.map((p) => <tr key={p.id}><td><span className="nhan nhan-xam">{TEN_LOAI_PHAN_DOI[p.loai]}</span></td><td className="font-medium">{p.noi_dung}</td><td className="text-xs max-w-[420px]" style={{ color: "var(--chu-mo)" }}>{p.cau_tra_loi_chuan}</td><td className="tabular">{p.so_lan_gap}</td>
                {quanLy && <td><div className="flex gap-1"><a href={`/kich-ban?tab=phan-doi&sua=${p.id}`} className="nut nut-nho">Sửa</a><form action={xoaPd}><input type="hidden" name="id" value={p.id} /><button className="nut nut-nho nut-nguy">Xóa</button></form></div></td>}</tr>)}</tbody></table></div>
          </div>
          {quanLy && <div className="the p-4 h-fit"><div className="font-semibold mb-2">{pdSua ? "Sửa phản đối" : "Thêm phản đối"}</div><FormPhanDoi action={luuPd} loai={LOAI_PHAN_DOI.map((l) => ({ ma: l, ten: TEN_LOAI_PHAN_DOI[l] }))} sanPham={sp.map((s) => ({ id: s.id, ten: s.ten }))} phanDoi={pdSua ? { id: pdSua.id, loai: pdSua.loai, noi_dung: pdSua.noi_dung, cau_tra_loi_chuan: pdSua.cau_tra_loi_chuan } : undefined} /></div>}
        </div>)}
    </KhungShell>
  );
}
