import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { NhanDiem } from "@/components/NhanDiem";
import { Icon } from "@/components/Icon";
import { nguCanhTrang, dinhDangNgay } from "@/services/trang";
import { danhSachPhien } from "@/services/luyen-tap";
import { TEN_DO_KHO } from "@/core/ai-kieu";
import { DISC } from "@/core/disc";
export const dynamic = "force-dynamic";
export default async function TrangLuyenTap() {
  const { phien, ws } = await nguCanhTrang();
  const ds = await ws((q) => danhSachPhien(q, phien.vaiTro === "quan_ly" ? {} : { nguoiDungId: phien.nguoiDungId }));
  return (
    <KhungShell phien={phien} duongDan="/luyen-tap" tieuDe="Luyện tập role-play" moTa="AI đóng vai khách hàng có phản đối thật; kết thúc để được chấm 6 tiêu chí."
      hanhDong={<Link href="/luyen-tap/moi" className="nut nut-chinh"><Icon ten="cong" size={16} />Phiên mới</Link>}>
      {ds.length === 0 ? (
        <div className="the p-10 text-center"><div className="text-lg font-semibold">Chưa có phiên nào</div><div className="mo-ta mt-1">Tạo phiên đầu tiên: chọn sản phẩm, độ khó và phản đối muốn luyện.</div><Link href="/luyen-tap/moi" className="nut nut-chinh mt-4">Bắt đầu</Link></div>
      ) : (
        <div className="the overflow-x-auto"><table className="bang">
          <thead><tr>{phien.vaiTro === "quan_ly" && <th>Sale</th>}<th>Khách (persona)</th><th>Sản phẩm</th><th>Độ khó</th><th>DISC</th><th>Lượt</th><th>Điểm</th><th>Lúc</th><th></th></tr></thead>
          <tbody>{ds.map((p) => (
            <tr key={p.id}>{phien.vaiTro === "quan_ly" && <td>{p.ten_sale}</td>}
              <td><div className="font-medium">{p.persona.ten}</div><div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{p.persona.chuc_danh} · {p.persona.cong_ty}</div></td>
              <td>{p.ten_san_pham ?? "—"}</td><td><span className="nhan nhan-xam">{TEN_DO_KHO[p.do_kho].split(" — ")[0]}</span></td><td>{p.disc ? <span className="nhan" style={{ background: DISC[p.disc].mau + "22", color: DISC[p.disc].mau }}>{p.disc}</span> : "—"}</td>
              <td className="tabular">{p.lich_su.filter((l) => l.vai === "sale").length}</td>
              <td>{p.trang_thai === "xong" ? <NhanDiem diem={p.diem_tong} nhoGon /> : p.trang_thai === "huy" ? <span className="nhan nhan-xam">Đã hủy</span> : <span className="nhan nhan-nhan">Đang luyện</span>}</td>
              <td className="text-xs" style={{ color: "var(--chu-mo)" }}>{dinhDangNgay(p.tao_luc, phien.muiGio)}</td>
              <td><Link href={`/luyen-tap/${p.id}`} className="nut nut-nho">{p.trang_thai === "dang" && p.nguoi_dung_id === phien.nguoiDungId ? "Tiếp tục" : "Xem"}</Link></td></tr>))}</tbody>
        </table></div>)}
    </KhungShell>
  );
}
