import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { ThanhTienDo } from "@/components/NhanDiem";
import { nguCanhTrang, tuKhiNao } from "@/services/trang";
import { danhSachKhoa, thongKeHocVien } from "@/services/dao-tao";
export const dynamic = "force-dynamic";
export default async function TrangDaoTao() {
  const { phien, ws } = await nguCanhTrang();
  const [khoa, tk] = await ws(async (q) => Promise.all([danhSachKhoa(q, phien.nguoiDungId), phien.vaiTro === "quan_ly" ? thongKeHocVien(q) : Promise.resolve([])]));
  return (
    <KhungShell phien={phien} duongDan="/dao-tao" tieuDe="Đào tạo" moTa="Khóa học kỹ năng bán hàng: học bài, làm quiz, nhận điểm và chứng chỉ khi hoàn thành."
      hanhDong={phien.vaiTro === "quan_ly" ? <Link href="/dao-tao/soan" className="nut nut-chinh">Soạn khóa học</Link> : undefined}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">{khoa.map((k) => (
        <Link key={k.id} href={`/dao-tao/${k.id}`} className="the p-5 hover:border-[var(--nhan)] transition-colors flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2"><div className="font-semibold text-base">{k.ten}</div>{k.hoan_thanh_luc ? <span className="nhan nhan-xanh">Hoàn thành</span> : k.phan_tram != null ? <span className="nhan nhan-nhan">Đang học</span> : <span className="nhan nhan-xam">Chưa bắt đầu</span>}</div>
          <div className="text-sm" style={{ color: "var(--chu-mo)" }}>{k.mo_ta}</div>
          <div className="text-xs" style={{ color: "var(--chu-nhat)" }}>{k.so_module} module · {k.so_bai} bài · cần ≥ {k.nguong_hoan_thanh}%</div>
          <div className="flex items-center gap-2"><div className="flex-1"><ThanhTienDo phanTram={k.phan_tram ?? 0} /></div><span className="text-xs tabular font-semibold">{k.phan_tram ?? 0}%</span></div>
        </Link>))}</div>
      {phien.vaiTro === "quan_ly" && (
        <div className="the overflow-x-auto"><div className="px-4 pt-4 font-semibold">Học viên & tiến độ</div>
          <table className="bang mt-2"><thead><tr><th>Nhân viên</th><th>Khóa</th><th>Tiến độ</th><th>Học gần nhất</th><th>Rủi ro</th><th>Chứng chỉ</th></tr></thead>
            <tbody>{tk.length === 0 ? <tr><td colSpan={6} className="text-center mo-ta py-6">Chưa ai ghi danh.</td></tr> : tk.map((t, i) => { const ngayKhongHoc = t.hoc_cuoi_luc ? (Date.now() - new Date(t.hoc_cuoi_luc).getTime()) / 86_400_000 : 99; const rui = t.hoan_thanh_luc ? "—" : ngayKhongHoc >= 7 ? "Cao" : ngayKhongHoc >= 3 ? "Trung bình" : "Thấp"; return (
              <tr key={i}><td><Link href={`/huan-luyen/${t.nguoi_dung_id}`} className="font-medium hover:underline">{t.ten}</Link></td><td>{t.khoa}</td><td className="w-48"><div className="flex items-center gap-2"><div className="flex-1"><ThanhTienDo phanTram={t.phan_tram} /></div><span className="tabular text-xs">{t.phan_tram}%</span></div></td>
                <td className="text-xs" style={{ color: "var(--chu-mo)" }}>{tuKhiNao(t.hoc_cuoi_luc)}</td><td><span className={`nhan ${rui === "Cao" ? "nhan-do" : rui === "Trung bình" ? "nhan-vang" : rui === "Thấp" ? "nhan-xanh" : "nhan-xam"}`}>{rui}</span></td>
                <td>{t.chung_chi ? <Link href={`/chung-chi/${t.chung_chi}`} className="text-xs" style={{ color: "var(--nhan-sang)" }}>{t.chung_chi}</Link> : "—"}</td></tr>); })}</tbody></table></div>)}
    </KhungShell>
  );
}
