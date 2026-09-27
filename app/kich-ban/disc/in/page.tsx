// Bản in 4 nhóm một trang (sale cầm khi gọi). Không có sidebar.
import { nguCanhTrang } from "@/services/trang";
import { danhSachSanPham } from "@/services/kich-ban";
import { layBoKichBan } from "@/services/disc";
import { layDna } from "@/services/dna";
import { DISC, NHOM_DISC } from "@/core/disc";
export const dynamic = "force-dynamic";
export default async function TrangIn({ searchParams }: { searchParams: Promise<{ san_pham?: string }> }) {
  const { ws, phien } = await nguCanhTrang();
  const { san_pham } = await searchParams;
  const [sp, dna] = await ws(async (q) => Promise.all([danhSachSanPham(q), layDna(q)]));
  const s = sp.find((x) => x.id === san_pham) ?? sp[0];
  if (!s) return <div className="p-8">Chưa có sản phẩm.</div>;
  const bo = await ws((q) => layBoKichBan(q, s.id));
  return (
    <div className="p-6 max-w-[1100px] mx-auto text-[12.5px]" style={{ background: "#fff", color: "#0f172a" }}>
      <div className="flex justify-between items-end border-b pb-2 mb-4"><div><div className="text-lg font-extrabold">Kịch bản chốt sale theo DISC — {s.ten}</div><div style={{ color: "#526071" }}>{dna.ten_doanh_nghiep || phien.workspaceTen} · xưng hô {dna.xung_ho} · giá {Number(s.gia).toLocaleString("vi-VN")}đ</div></div><div className="khong-in"><a href="javascript:window.print()" className="nut nut-nho">In / PDF</a></div></div>
      <div className="grid grid-cols-2 gap-4">{NHOM_DISC.map((n) => { const k = bo[n]?.noi_dung; const d = DISC[n]; return (
        <div key={n} className="border rounded-lg p-3" style={{ borderColor: d.mau, breakInside: "avoid" }}>
          <div className="font-bold text-base" style={{ color: d.mau }}>{d.ten}</div>
          <div className="text-[11px] mb-2" style={{ color: "#526071" }}>Nhận ra: {d.dau_hieu[0]}. Muốn: {d.muon}</div>
          {!k ? <div style={{ color: "#94a3b8" }}>Chưa có kịch bản.</div> : <>
            <P t="Mở đầu">{k.mo_dau}</P>
            <P t="Khai thác"><ol className="list-decimal pl-4">{k.khai_thac.map((x, i) => <li key={i}>{x}</li>)}</ol></P>
            <P t="Giá trị">{k.gia_tri}</P>
            <P t="Phản đối">{k.phan_doi.map((p, i) => <div key={i} className="mb-1"><b>«{p.cau_khach}»</b> → {p.cau_tra_loi}</div>)}</P>
            <P t="Chốt">{k.chot}</P>
            <P t="Sau gọi">{k.theo_doi}</P>
            <div className="text-[11px]"><b>Nên:</b> {k.tu_nen_dung.join(", ")} · <b>Tránh:</b> {k.tu_tranh.join(", ")}</div>
          </>}
        </div>); })}</div>
    </div>
  );
}
function P({ t, children }: { t: string; children: React.ReactNode }) { return <div className="mb-1.5"><span className="font-semibold">{t}: </span><span>{children}</span></div>; }
