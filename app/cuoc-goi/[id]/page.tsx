import { notFound } from "next/navigation";
import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { Radar } from "@/components/Radar";
import { VongDiem } from "@/components/NhanDiem";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { TheKpi } from "@/components/TheKpi";
import { nguCanhTrang, dinhDangNgay } from "@/services/trang";
import { layCuocGoi, TEN_KET_QUA, danhSachNhiemVu } from "@/services/cuoc-goi";
import { thuVienDoanMau } from "@/services/huan-luyen";
import { KY_NANG, TEN_KY_NANG, nhanXetDiem } from "@/core/khung-ky-nang";
import { TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
import { xemDuocDiem } from "@/core/phan-quyen";
import { DISC } from "@/core/disc";
export const dynamic = "force-dynamic";
export default async function TrangChiTietCuocGoi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { phien, ws } = await nguCanhTrang();
  const [c, nv, dm] = await ws(async (q) => Promise.all([layCuocGoi(q, id), danhSachNhiemVu(q, {}), thuVienDoanMau(q, {})]));
  if (!c || !xemDuocDiem(phien.vaiTro, c.nguoi_dung_id, phien.nguoiDungId)) notFound();
  const pt = c.phan_tich;
  const nvCua = nv.filter((n) => n.cuoc_goi_id === c.id);
  const dmCua = dm.filter((d) => d.cuoc_goi_id === c.id);
  return (
    <KhungShell phien={phien} duongDan="/cuoc-goi" tieuDe={`Phân tích cuộc gọi — ${c.ten_khach || "khách"}`} moTa={`${c.ten_sale} · ${dinhDangNgay(c.goi_luc, phien.muiGio)} · ${c.thoi_luong_giay ? Math.floor(c.thoi_luong_giay / 60) + " phút" : "?"} · Kết quả: ${TEN_KET_QUA[c.ket_qua]}`}
      hanhDong={<Link href="/cuoc-goi" className="nut">← Danh sách</Link>}>
      {!pt ? <div className="the p-8 text-center mo-ta">Chưa có kết quả phân tích{c.loi ? `: ${c.loi}` : "."}</div> : (
        <>
          <div className="luoi-kpi mb-4">
            <div className="the p-4 flex items-center gap-3"><VongDiem diem={c.diem_tong ?? 0} size={64} /><div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Tổng điểm AI</div><div className="font-bold">{nhanXetDiem(c.diem_tong ?? 0)}</div><ThongBaoAI cheDo={c.che_do_ai} /></div></div>
            <TheKpi ten="Nói / Nghe" giaTri={`${pt.ty_le_sale_noi}% / ${100 - pt.ty_le_sale_noi}%`} phu={pt.ty_le_sale_noi > 60 ? "Sale nói hơi nhiều" : pt.ty_le_sale_noi < 30 ? "Sale nói hơi ít" : "Cân bằng tốt"} icon="luyen_tap" mau="var(--tim)" />
            <TheKpi ten="Số câu hỏi của sale" giaTri={pt.so_cau_hoi_sale} phu={pt.so_cau_hoi_sale >= 5 ? "Tốt" : "Nên hỏi nhiều hơn"} icon="tim_kiem" mau="var(--nhan)" />
            <TheKpi ten="Xử lý phản đối" giaTri={`${pt.phan_doi_phat_hien.length}`} phu="phản đối phát hiện" icon="kich_ban" mau="var(--cam)" />
            <TheKpi ten="Cảm xúc khách" giaTri={pt.cam_xuc_khach > 0.2 ? "Tích cực" : pt.cam_xuc_khach < -0.2 ? "Tiêu cực" : "Trung tính"} phu={pt.cam_xuc_khach.toFixed(2)} icon="ngoi_sao" mau={pt.cam_xuc_khach > 0.2 ? "var(--xanh)" : pt.cam_xuc_khach < -0.2 ? "var(--do)" : "var(--vang)"} />
            <TheKpi ten="Rủi ro tuân thủ" giaTri={pt.rui_ro_tuan_thu.length} phu={pt.rui_ro_tuan_thu.length ? "câu cần sửa" : "Không phát hiện"} icon="canh_bao" mau={pt.rui_ro_tuan_thu.length ? "var(--do)" : "var(--ngoc)"} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              <div className="the p-5"><div className="font-semibold mb-3">Transcript ({c.luot.length} lượt)</div>
                <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">{c.luot.map((l, i) => (
                  <div key={i} className="flex gap-3 text-sm"><span className="tabular text-xs w-6 shrink-0 pt-0.5" style={{ color: "var(--chu-nhat)" }}>{i + 1}</span><span className="w-20 shrink-0 text-xs font-semibold pt-0.5" style={{ color: l.vai === "sale" ? "var(--nhan-sang)" : "var(--chu-mo)" }}>{l.vai === "sale" ? "Sale" : "Khách"}</span><span className="flex-1">{l.noi_dung}</span></div>))}</div></div>
              {pt.phan_doi_phat_hien.length > 0 && <div className="the p-5"><div className="font-semibold mb-3">Phản đối và cách xử lý</div>
                <div className="flex flex-col gap-3">{pt.phan_doi_phat_hien.map((p, i) => (
                  <div key={i} className="the-2 p-3 text-sm"><div className="flex items-center gap-2 mb-1"><span className="nhan nhan-vang">{TEN_LOAI_PHAN_DOI[p.loai]}</span><span className="font-medium">“{p.noi_dung}”</span></div>
                    <div className="text-xs" style={{ color: "var(--chu-mo)" }}>Sale đã trả lời:</div><div className="mb-2">{p.sale_tra_loi || "(không thấy câu trả lời)"}</div>
                    <div className="text-xs" style={{ color: "var(--chu-xanh)" }}>Câu trả lời tốt hơn:</div><div>{p.de_xuat_cau_tra_loi}</div></div>))}</div></div>}
              {pt.rui_ro_tuan_thu.length > 0 && <div className="the p-5" style={{ borderColor: "var(--do)" }}><div className="font-semibold mb-2" style={{ color: "var(--chu-do)" }}>Cảnh báo tuân thủ</div><ul className="text-sm list-disc pl-4">{pt.rui_ro_tuan_thu.map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
            </div>
            <div className="flex flex-col gap-4">
              <div className="the p-4"><div className="font-semibold mb-2">Tóm tắt AI</div>
                <div className="flex flex-col gap-2 text-sm">
                  <TomTat ten="Nhu cầu" muc={pt.tom_tat.nhu_cau} />
                  <TomTat ten="Phản đối" muc={pt.tom_tat.phan_doi} />
                  <TomTat ten="Cam kết" muc={pt.tom_tat.cam_ket.map((k) => `${k.ben === "sale" ? "Sale" : "Khách"}: ${k.noi_dung}${k.han ? ` (hạn ${k.han})` : ""}`)} />
                  <div><div className="text-xs font-semibold" style={{ color: "var(--chu-mo)" }}>Bước tiếp theo</div><div>{pt.tom_tat.buoc_tiep}</div></div>
                </div></div>
              {pt.disc && <div className="the p-4" style={{ borderColor: DISC[pt.disc.nhom].mau }}><div className="flex items-center justify-between"><div className="font-semibold">Khách thuộc nhóm {DISC[pt.disc.nhom].ten}</div><span className="nhan nhan-xam tabular">{pt.disc.tin_cay}% tin cậy</span></div>
                <div className="text-sm mt-1" style={{ color: "var(--chu-mo)" }}>{pt.disc.ly_do}</div>
                {pt.disc.goi_y_lan_sau && <div className="text-sm mt-2"><b>Lần sau nên:</b> {pt.disc.goi_y_lan_sau}</div>}
                <Link href={`/kich-ban/disc?san_pham=${c.san_pham_id ?? ""}&nhom=${pt.disc.nhom}`} className="nut nut-nho mt-2">Xem kịch bản nhóm {pt.disc.nhom}</Link>
                <Link href={`/luyen-tap/moi?disc=${pt.disc.nhom}`} className="nut nut-nho nut-chinh mt-2 ml-1">Luyện với khách nhóm {pt.disc.nhom}</Link></div>}
              <div className="the p-4"><div className="font-semibold mb-2">Scorecard kỹ năng</div>
                <Radar lop={[{ ten: "Cuộc gọi", diem: pt.diem, mau: "#14b8a6", dam: true }]} size={220} />
                <table className="bang mt-2"><tbody>{KY_NANG.map((k) => { const vd = pt.vi_du_theo_ky_nang.find((v) => v.ky_nang === k); return <tr key={k}><td className="text-xs font-medium">{TEN_KY_NANG[k]}</td><td className="tabular text-right font-semibold" style={{ color: pt.diem[k] >= 80 ? "var(--xanh)" : pt.diem[k] >= 65 ? "var(--vang)" : "var(--do)" }}>{pt.diem[k]}</td><td className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{vd?.vi_du}</td></tr>; })}</tbody></table></div>
              {nvCua.length > 0 && <div className="the p-4"><div className="font-semibold mb-2">Nhiệm vụ từ cam kết</div><div className="flex flex-col gap-1.5 text-sm">{nvCua.map((n) => <div key={n.id} className="flex justify-between gap-2"><span>{n.noi_dung}</span><span className={`nhan ${n.trang_thai === "xong" ? "nhan-xanh" : n.trang_thai === "huy" ? "nhan-xam" : "nhan-vang"}`}>{n.trang_thai === "mo" ? "Mở" : n.trang_thai === "xong" ? "Xong" : "Hủy"}</span></div>)}</div><Link href="/nhiem-vu" className="text-xs mt-2 inline-block" style={{ color: "var(--nhan-sang)" }}>Quản lý nhiệm vụ →</Link></div>}
              {dmCua.length > 0 && <div className="the p-4"><div className="font-semibold mb-2">Đoạn mẫu đề xuất</div><div className="flex flex-col gap-2 text-sm">{dmCua.map((d) => <div key={d.id} className="the-2 p-2"><div className="flex items-center gap-1 mb-1"><span className="nhan nhan-tim">{TEN_LOAI_PHAN_DOI[d.loai_phan_doi as keyof typeof TEN_LOAI_PHAN_DOI] ?? d.loai_phan_doi}</span><span className={`nhan ${d.trang_thai === "da_duyet" ? "nhan-xanh" : d.trang_thai === "tu_choi" ? "nhan-xam" : "nhan-vang"}`}>{d.trang_thai === "da_duyet" ? "Đã duyệt" : d.trang_thai === "tu_choi" ? "Từ chối" : "Chờ duyệt"}</span></div>“{d.noi_dung}”</div>)}</div></div>}
            </div>
          </div>
        </>)}
    </KhungShell>
  );
}
function TomTat({ ten, muc }: { ten: string; muc: string[] }) {
  return <div><div className="text-xs font-semibold" style={{ color: "var(--chu-mo)" }}>{ten}</div>{muc.length ? <ul className="list-disc pl-4">{muc.map((m, i) => <li key={i}>{m}</li>)}</ul> : <div style={{ color: "var(--chu-nhat)" }}>—</div>}</div>;
}
