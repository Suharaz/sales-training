import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { NhanDiem } from "@/components/NhanDiem";
import { TheKpi } from "@/components/TheKpi";
import { Icon } from "@/components/Icon";
import { nguCanhTrang, dinhDangNgay } from "@/services/trang";
import { danhSachCuocGoi, TEN_KET_QUA } from "@/services/cuoc-goi";
import { DISC } from "@/core/disc";
export const dynamic = "force-dynamic";
export default async function TrangCuocGoi({ searchParams }: { searchParams: Promise<{ ket_qua?: string; sale?: string; q?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { ket_qua, sale, q: tim } = await searchParams;
  const tatCa = await ws((q) => danhSachCuocGoi(q, phien.vaiTro === "quan_ly" ? {} : { nguoiDungId: phien.nguoiDungId }));
  const saleDs = Array.from(new Map(tatCa.map((c) => [c.nguoi_dung_id, c.ten_sale])).entries());
  const ds = tatCa.filter((c) => (!ket_qua || c.ket_qua === ket_qua) && (!sale || c.nguoi_dung_id === sale) && (!tim || `${c.ten_khach} ${c.ten_sale} ${c.transcript}`.toLowerCase().includes(tim.toLowerCase())));
  const xong = ds.filter((c) => c.trang_thai === "xong");
  const tb = xong.length ? Math.round(xong.reduce((s, c) => s + (c.diem_tong ?? 0), 0) / xong.length) : null;
  const thang = ds.filter((c) => c.ket_qua === "thang").length;
  const mau = { thang: "nhan-xanh", thua: "nhan-do", hen: "nhan-vang", khac: "nhan-xam" } as const;
  return (
    <KhungShell phien={phien} duongDan="/cuoc-goi" tieuDe="Phân tích cuộc gọi" moTa="Nạp transcript cuộc gọi thật, AI tóm tắt 4 phần, chấm khung kỹ năng, trích phản đối và cam kết."
      hanhDong={<><Link href="/cuoc-goi/ghi-am" className="nut"><Icon ten="cuoc_goi" size={16} />Ghi âm trực tiếp</Link><Link href="/cuoc-goi/moi" className="nut nut-chinh"><Icon ten="tai_len" size={16} />Nạp transcript</Link></>}>
      <div className="luoi-kpi mb-5">
        <TheKpi ten="Cuộc gọi đã phân tích" giaTri={xong.length} icon="cuoc_goi" mau="var(--ngoc)" />
        <TheKpi ten="Điểm TB" giaTri={tb ?? "—"} icon="ngoi_sao" mau="var(--nhan)" />
        <TheKpi ten="Tỷ lệ thắng" giaTri={ds.length ? `${Math.round((thang / ds.length) * 100)}%` : "—"} phu={`${thang}/${ds.length}`} icon="cup" mau="var(--xanh)" />
        <TheKpi ten="Cảnh báo tuân thủ" giaTri={xong.filter((c) => (c.phan_tich?.rui_ro_tuan_thu.length ?? 0) > 0).length} phu="cuộc gọi có câu rủi ro" icon="canh_bao" mau="var(--do)" />
      </div>
      <form className="the p-3 mb-4 flex flex-wrap gap-2 items-center text-sm">
        <input name="q" className="o-nhap w-56" placeholder="Tìm khách, nội dung…" defaultValue={tim ?? ""} />
        <select name="ket_qua" className="o-nhap w-40" defaultValue={ket_qua ?? ""}><option value="">Mọi kết quả</option>{Object.entries(TEN_KET_QUA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        {phien.vaiTro === "quan_ly" && <select name="sale" className="o-nhap w-48" defaultValue={sale ?? ""}><option value="">Mọi nhân viên</option>{saleDs.map(([id, ten]) => <option key={id} value={id}>{ten}</option>)}</select>}
        <button className="nut nut-nho">Lọc</button>{(ket_qua || sale || tim) && <Link href="/cuoc-goi" className="nut nut-nho">Xóa lọc</Link>}
        <span className="text-xs ml-auto" style={{ color: "var(--chu-mo)" }}>{ds.length}/{tatCa.length} cuộc gọi</span>
      </form>
      {ds.length === 0 ? <div className="the p-10 text-center"><div className="text-lg font-semibold">Chưa có cuộc gọi</div><div className="mo-ta mt-1">Dán transcript (mỗi dòng «Tên: nội dung») để AI phân tích.</div><Link href="/cuoc-goi/moi" className="nut nut-chinh mt-4">Nạp cuộc gọi đầu tiên</Link></div> : (
        <div className="the overflow-x-auto"><table className="bang">
          <thead><tr>{phien.vaiTro === "quan_ly" && <th>Sale</th>}<th>Khách</th><th>Sản phẩm</th><th>Lúc gọi</th><th>Thời lượng</th><th>Kết quả</th><th>Điểm AI</th><th>DISC</th><th>Phản đối</th><th></th></tr></thead>
          <tbody>{ds.map((c) => (
            <tr key={c.id}>{phien.vaiTro === "quan_ly" && <td>{c.ten_sale}</td>}<td className="font-medium">{c.ten_khach || "—"}</td><td>{c.ten_san_pham ?? "—"}</td>
              <td className="text-xs" style={{ color: "var(--chu-mo)" }}>{dinhDangNgay(c.goi_luc, phien.muiGio)}</td>
              <td className="tabular">{c.thoi_luong_giay ? `${Math.floor(c.thoi_luong_giay / 60)}:${String(c.thoi_luong_giay % 60).padStart(2, "0")}` : "—"}</td>
              <td><span className={`nhan ${mau[c.ket_qua]}`}>{TEN_KET_QUA[c.ket_qua]}</span></td>
              <td>{c.trang_thai === "xong" ? <NhanDiem diem={c.diem_tong} nhoGon /> : <span className="nhan nhan-xam">{c.trang_thai === "cho" ? "Đang chờ" : "Lỗi"}</span>}</td>
              <td>{c.disc ? <span className="nhan" style={{ background: DISC[c.disc].mau + "22", color: DISC[c.disc].mau }} title={`${c.disc_tin_cay ?? ""}%`}>{c.disc}</span> : "—"}</td>
              <td className="tabular">{c.phan_tich?.phan_doi_phat_hien.length ?? "—"}</td>
              <td><Link href={`/cuoc-goi/${c.id}`} className="nut nut-nho">Xem</Link></td></tr>))}</tbody>
        </table></div>)}
    </KhungShell>
  );
}
