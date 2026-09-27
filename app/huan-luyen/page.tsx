import Link from "next/link";
import { redirect } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { Radar } from "@/components/Radar";
import { NhanDiem, Sparkline } from "@/components/NhanDiem";
import { nguCanhTrang } from "@/services/trang";
import { maTranDoi, insightDoi, thuVienDoanMau, duyetDoanMau } from "@/services/huan-luyen";
import { KY_NANG, TEN_KY_NANG } from "@/core/khung-ky-nang";
import { TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";
export default async function TrangHuanLuyen() {
  const { phien, ws } = await nguCanhTrang();
  if (phien.vaiTro !== "quan_ly") redirect("/huan-luyen/toi");
  const [mt, ins, dmCho, dmDuyet] = await ws(async (q) => Promise.all([maTranDoi(q), insightDoi(q), thuVienDoanMau(q, { trangThai: "nhap" }), thuVienDoanMau(q, { trangThai: "da_duyet" })]));
  async function duyet(form: FormData) {
    "use server";
    const { ws } = await nguCanhTrang();
    await ws((q) => duyetDoanMau(q, { id: String(form.get("id")), trangThai: String(form.get("trang_thai")) === "tu_choi" ? "tu_choi" : "da_duyet" }));
    revalidatePath("/huan-luyen");
  }
  return (
    <KhungShell phien={phien} duongDan="/huan-luyen" tieuDe="Huấn luyện AI" moTa="Ma trận kỹ năng đội, thư viện đoạn mẫu và gói huấn luyện cá nhân sinh từ dữ liệu thật (F-116).">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px] mb-4">
        <div className="the p-4 overflow-x-auto"><div className="font-semibold mb-2">Ma trận kỹ năng</div>
          <table className="bang"><thead><tr><th>Nhân viên</th>{KY_NANG.map((k) => <th key={k} className="text-center">{TEN_KY_NANG[k].split(" ")[0]}</th>)}<th>TB</th><th>Xu hướng</th><th></th></tr></thead>
            <tbody>{mt.hoSo.map((h) => (
              <tr key={h.nguoiDungId}><td><div className="font-medium">{h.ten}</div><div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{h.soPhien} phiên · {h.soCuocGoi} cuộc gọi</div></td>
                {KY_NANG.map((k) => <td key={k} className="text-center tabular font-semibold" style={{ color: h.radar ? (h.radar[k] >= 80 ? "var(--xanh)" : h.radar[k] >= 65 ? "var(--vang)" : "var(--do)") : "var(--chu-nhat)" }}>{h.radar ? h.radar[k] : "—"}</td>)}
                <td><NhanDiem diem={h.diemTb} nhoGon /></td><td><Sparkline diem={h.xuHuong} /></td><td><Link href={`/huan-luyen/${h.nguoiDungId}`} className="nut nut-nho">Hồ sơ</Link></td></tr>))}</tbody></table></div>
        <div className="the p-4"><div className="font-semibold mb-2">Đội vs Top 20%</div>
          {mt.radarDoi ? <Radar lop={[{ ten: "Đội", diem: mt.radarDoi, mau: "#3b82f6", dam: true }, ...(mt.top20 ? [{ ten: "Top 20%", diem: mt.top20, mau: "#8b5cf6" }] : [])]} size={250} /> : <div className="mo-ta py-8 text-center">Chưa có dữ liệu.</div>}
          {ins.tieuChiYeu && <div className="text-xs mt-2" style={{ color: "var(--chu-mo)" }}>Yếu nhất: <b style={{ color: "var(--chu)" }}>{ins.tieuChiYeu.ten}</b> ({ins.tieuChiYeu.diem}) · Phản đối thua: {ins.phanDoiThua.map((p) => p.ten).join(", ") || "—"}</div>}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="the p-4"><div className="font-semibold mb-1">Đoạn mẫu chờ duyệt ({dmCho.length})</div><div className="mo-ta mb-3">AI trích từ cuộc gọi điểm cao. Duyệt mới đưa vào thư viện (khách đã được ẩn danh).</div>
          {dmCho.length === 0 ? <div className="mo-ta">Không có.</div> : <div className="flex flex-col gap-2">{dmCho.map((d) => (
            <div key={d.id} className="the-2 p-3 text-sm"><div className="flex items-center gap-2 mb-1"><span className="nhan nhan-tim">{TEN_LOAI_PHAN_DOI[d.loai_phan_doi as keyof typeof TEN_LOAI_PHAN_DOI] ?? d.loai_phan_doi}</span><span className="text-xs" style={{ color: "var(--chu-mo)" }}>{d.ten_sale}</span>{d.cuoc_goi_id && <Link href={`/cuoc-goi/${d.cuoc_goi_id}`} className="text-xs" style={{ color: "var(--nhan-sang)" }}>cuộc gọi →</Link>}</div>
              <div className="mb-2">“{d.noi_dung}”</div>
              <div className="flex gap-1"><form action={duyet}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="trang_thai" value="da_duyet" /><button className="nut nut-nho nut-chinh">Duyệt</button></form><form action={duyet}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="trang_thai" value="tu_choi" /><button className="nut nut-nho">Từ chối</button></form></div></div>))}</div>}</div>
        <div className="the p-4"><div className="font-semibold mb-1">Thư viện đoạn mẫu ({dmDuyet.length})</div><div className="mo-ta mb-3">Cách xử lý phản đối đã được chứng minh trong cuộc gọi thắng.</div>
          {dmDuyet.length === 0 ? <div className="mo-ta">Chưa có.</div> : <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">{dmDuyet.map((d) => <div key={d.id} className="the-2 p-3 text-sm"><span className="nhan nhan-xanh mr-2">{TEN_LOAI_PHAN_DOI[d.loai_phan_doi as keyof typeof TEN_LOAI_PHAN_DOI] ?? d.loai_phan_doi}</span>“{d.noi_dung}”<div className="text-[11px] mt-1" style={{ color: "var(--chu-mo)" }}>{d.ten_sale}</div></div>)}</div>}</div>
      </div>
    </KhungShell>
  );
}
