import { redirect } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { danhSachSanPham } from "@/services/kich-ban";
import { taoPhien } from "@/services/luyen-tap";
import { DO_KHO, TEN_DO_KHO, type DoKho } from "@/core/ai-kieu";
import { LOAI_PHAN_DOI, TEN_LOAI_PHAN_DOI, laLoaiPhanDoi, type LoaiPhanDoi } from "@/core/phan-doi";
import { cheDoAI } from "@/services/ai-gateway";
import { ThongBaoAI } from "@/components/ThongBaoAI";
export const dynamic = "force-dynamic";
export default async function TrangPhienMoi({ searchParams }: { searchParams: Promise<{ phan_doi?: string; loi?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const sp = await ws((q) => danhSachSanPham(q));
  const { phan_doi, loi } = await searchParams;
  async function tao(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang();
    const doKho = String(form.get("do_kho") ?? "vua") as DoKho;
    const pd = form.getAll("phan_doi").map(String).filter(laLoaiPhanDoi) as LoaiPhanDoi[];
    const spId = String(form.get("san_pham_id") ?? "") || null;
    let id = "";
    try {
      const r = await ws((q) => taoPhien(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, sanPhamId: spId, doKho: (DO_KHO as readonly string[]).includes(doKho) ? doKho : "vua", phanDoiUuTien: pd }));
      id = r.id;
    } catch (e) { redirect(`/luyen-tap/moi?loi=${encodeURIComponent((e as Error).message)}`); }
    redirect(`/luyen-tap/${id}`);
  }
  return (
    <KhungShell phien={phien} duongDan="/luyen-tap" tieuDe="Tạo phiên role-play" moTa="AI sẽ dựng một khách hàng giả lập theo sản phẩm và độ khó bạn chọn.">
      <form action={tao} className="the p-5 max-w-[720px] flex flex-col gap-5">
        {loi && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
        <ThongBaoAI cheDo={cheDoAI()} />
        <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Sản phẩm đang bán</span>
          <select name="san_pham_id" className="o-nhap" defaultValue={sp[0]?.id ?? ""}>{sp.map((s) => <option key={s.id} value={s.id}>{s.ten} — {Number(s.gia).toLocaleString("vi-VN")}đ</option>)}<option value="">(Không chọn)</option></select></label>
        <div className="text-sm"><div className="font-medium mb-2">Độ khó</div>
          <div className="grid gap-2 md:grid-cols-3">{DO_KHO.map((d) => (
            <label key={d} className="the-2 p-3 flex items-start gap-2 cursor-pointer has-[:checked]:border-[var(--nhan)]"><input type="radio" name="do_kho" value={d} defaultChecked={d === "vua"} className="mt-1" /><span><b>{TEN_DO_KHO[d].split(" — ")[0]}</b><div className="text-xs" style={{ color: "var(--chu-mo)" }}>{TEN_DO_KHO[d].split(" — ")[1]}</div></span></label>))}</div></div>
        <div className="text-sm"><div className="font-medium mb-1">Phản đối muốn luyện (tùy chọn)</div><div className="mo-ta mb-2">Không chọn thì AI tự chọn theo độ khó.</div>
          <div className="flex flex-wrap gap-2">{LOAI_PHAN_DOI.filter((l) => l !== "khac").map((l) => (
            <label key={l} className="nut nut-nho cursor-pointer has-[:checked]:bg-[var(--nhan-mo)] has-[:checked]:border-[var(--nhan)]"><input type="checkbox" name="phan_doi" value={l} defaultChecked={phan_doi === l} className="hidden" />{TEN_LOAI_PHAN_DOI[l]}</label>))}</div></div>
        <div className="flex gap-2"><button type="submit" className="nut nut-chinh">Bắt đầu gọi</button></div>
      </form>
    </KhungShell>
  );
}
