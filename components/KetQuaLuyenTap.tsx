import Link from "next/link";
import type { PhienLuyenTap } from "@/services/luyen-tap";
import { Radar } from "./Radar";
import { VongDiem } from "./NhanDiem";
import { ThongBaoAI } from "./ThongBaoAI";
import { KY_NANG, TEN_KY_NANG, nhanXetDiem } from "@/core/khung-ky-nang";
import { TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
export function KetQuaLuyenTapView({ phien }: { phien: PhienLuyenTap }) {
  const kq = phien.ket_qua!;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="the p-5 flex flex-col items-center gap-3">
        <VongDiem diem={phien.diem_tong ?? 0} size={110} />
        <div className="font-bold text-lg">{nhanXetDiem(phien.diem_tong ?? 0)}</div>
        <Radar lop={[{ ten: "Phiên này", diem: kq.diem, mau: "#3b82f6", dam: true }]} size={240} />
        <ThongBaoAI cheDo={phien.che_do_ai} />
        <Link href={`/luyen-tap/moi${kq.phan_doi_da_gap.find((p) => !p.xu_ly_tot) ? `?phan_doi=${kq.phan_doi_da_gap.find((p) => !p.xu_ly_tot)!.loai}` : ""}`} className="nut nut-chinh w-full justify-center">Luyện lại</Link>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="the p-5"><div className="font-semibold mb-1">Nhận xét chung</div><p className="text-sm leading-relaxed">{kq.nhan_xet_chung}</p>
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            <div className="the-2 p-3"><div className="text-xs font-semibold mb-1" style={{ color: "var(--chu-xanh)" }}>Điểm mạnh</div><ul className="text-sm list-disc pl-4">{kq.diem_manh.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
            <div className="the-2 p-3"><div className="text-xs font-semibold mb-1" style={{ color: "var(--chu-vang)" }}>Cần cải thiện</div><ul className="text-sm list-disc pl-4">{kq.can_cai_thien.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
          </div></div>
        <div className="the p-5"><div className="font-semibold mb-2">Scorecard 6 tiêu chí</div>
          <table className="bang"><tbody>{KY_NANG.map((k) => <tr key={k}><td className="font-medium">{TEN_KY_NANG[k]}</td><td className="w-40"><div className="thanh"><i style={{ width: `${kq.diem[k]}%`, background: kq.diem[k] >= 80 ? "var(--xanh)" : kq.diem[k] >= 65 ? "var(--vang)" : "var(--do)" }} /></div></td><td className="tabular w-16 text-right font-semibold">{kq.diem[k]}</td><td className="text-xs" style={{ color: "var(--chu-mo)" }}>{nhanXetDiem(kq.diem[k])}</td></tr>)}</tbody></table></div>
        {kq.phan_doi_da_gap.length > 0 && <div className="the p-5"><div className="font-semibold mb-2">Phản đối đã gặp</div>
          <div className="flex flex-col gap-2">{kq.phan_doi_da_gap.map((p, i) => <div key={i} className="flex items-start gap-2 text-sm"><span className={`nhan ${p.xu_ly_tot ? "nhan-xanh" : "nhan-do"}`}>{p.xu_ly_tot ? "Xử lý tốt" : "Chưa tốt"}</span><span><b>{TEN_LOAI_PHAN_DOI[p.loai]}</b> — {p.ghi_chu}</span></div>)}</div></div>}
        {kq.goi_y_theo_luot.length > 0 && <div className="the p-5"><div className="font-semibold mb-2">Câu nói tốt hơn theo lượt</div>
          <div className="flex flex-col gap-3">{kq.goi_y_theo_luot.map((g, i) => { const l = phien.lich_su[g.luot - 1]; return (
            <div key={i} className="the-2 p-3 text-sm"><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Lượt {g.luot}{l ? ` · Bạn nói: “${l.noi_dung.slice(0, 120)}${l.noi_dung.length > 120 ? "…" : ""}”` : ""}</div>
              <div className="mt-1"><span className="font-semibold" style={{ color: "var(--chu-do)" }}>Vấn đề:</span> {g.van_de}</div><div className="mt-1"><span className="font-semibold" style={{ color: "var(--chu-xanh)" }}>Tốt hơn:</span> {g.cau_tot_hon}</div></div>); })}</div></div>}
        <details className="the p-5"><summary className="font-semibold cursor-pointer">Xem lại hội thoại ({phien.lich_su.length} lượt)</summary>
          <div className="flex flex-col gap-2 mt-3">{phien.lich_su.map((l, i) => <div key={i} className={`bong-chat ${l.vai === "sale" ? "bong-sale" : "bong-khach"}`}><div className="text-[10px] opacity-70">{i + 1}. {l.vai === "sale" ? phien.ten_sale : phien.persona.ten}</div>{l.noi_dung}</div>)}</div></details>
      </div>
    </div>
  );
}
