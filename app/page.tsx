import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { TheKpi } from "@/components/TheKpi";
import { Radar } from "@/components/Radar";
import { NhanDiem, Sparkline } from "@/components/NhanDiem";
import { Icon } from "@/components/Icon";
import { nguCanhTrang, tuKhiNao } from "@/services/trang";
import { insightDoi, maTranDoi, hoSoKyNang, goiHuanLuyenMoiNhat } from "@/services/huan-luyen";
import { bangXepHang, diemCuaToi } from "@/services/diem";
import { danhSachPhien } from "@/services/luyen-tap";
import { danhSachNhiemVu } from "@/services/cuoc-goi";
import { khoPhanDoi } from "@/services/kich-ban";
import { thuVienDoanMau } from "@/services/huan-luyen";
import { danhSachKhoa, hocVienRuiRo } from "@/services/dao-tao";
import { layWorkspace } from "@/services/workspace";
import { TEN_KY_NANG, xepTheoDiem } from "@/core/khung-ky-nang";
import { hangKeTiep } from "@/core/gamification";
import { NutLon } from "@/components/NutLon";
import { layDna } from "@/services/dna";
import { dnaDaNap } from "@/core/dna";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function TrangTongQuan({ searchParams }: { searchParams: Promise<{ chao?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { chao } = await searchParams;
  if (phien.vaiTro === "quan_ly") {
    const [wsCd0, dna0] = await ws(async (q) => Promise.all([layWorkspace(q, phien.workspaceId), layDna(q)]));
    if (!wsCd0.khoi_dong_xong && !dnaDaNap(dna0)) redirect("/bat-dau");
    return <TongQuanQuanLy chao={!!chao} dnaDaCo={dnaDaNap(dna0)} />;
  }
  const dnaSale = await ws((q) => layDna(q));
  const [hs, diem, phienGan, nv, goi, khoa] = await ws(async (q) => Promise.all([
    hoSoKyNang(q, phien.nguoiDungId), diemCuaToi(q, phien.nguoiDungId, phien.muiGio), danhSachPhien(q, { nguoiDungId: phien.nguoiDungId, gioiHan: 5 }),
    danhSachNhiemVu(q, { nguoiDungId: phien.nguoiDungId }), goiHuanLuyenMoiNhat(q, phien.nguoiDungId), danhSachKhoa(q, phien.nguoiDungId),
  ]));
  const ke = hangKeTiep(diem.diem);
  const yeu = hs?.radar ? xepTheoDiem(hs.radar).slice(0, 2) : [];
  const nvMo = nv.filter((n) => n.trang_thai === "mo");
  return (
    <KhungShell phien={phien} duongDan="/" tieuDe={`Chào ${phien.ten.split(" ").slice(-1)[0]}, luyện hôm nay chứ?`} moTa="Tiến bộ của bạn trong 90 ngày qua"
      hanhDong={<Link href="/goi-dien" className="nut nut-chinh"><Icon ten="cuoc_goi" size={16} />Gọi điện với AI</Link>}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-5">
        <NutLon href="/goi-dien" ten="Gọi điện với AI" mo_ta="Khách ảo nhấc máy, bạn nói bằng giọng" icon="cuoc_goi" mau="var(--nhan)" noiBat />
        <NutLon href="/luyen-tap/moi" ten="Role-play" mo_ta="Luyện bằng chat, chọn phản đối" icon="luyen_tap" mau="var(--tim)" />
        <NutLon href="/kich-ban/disc" ten="Kịch bản DISC" mo_ta="Xem cách chốt cho 4 nhóm khách" icon="nhan_vien" mau="var(--cam)" />
        <NutLon href="/huan-luyen/toi" ten="Huấn luyện của tôi" mo_ta="Radar kỹ năng và gói luyện tập" icon="huan_luyen" mau="var(--ngoc)" />
      </div>
      {!dnaDaNap(dnaSale) && <div className="thong-bao thong-bao-vang mb-4">Doanh nghiệp chưa nạp DNA nên AI đang đóng vai khách theo kiểu trung tính. Nhờ quản lý vào «DNA doanh nghiệp» để khách ảo và gợi ý sát thực tế hơn.</div>}
      <div className="luoi-kpi mb-5">
        <TheKpi ten="Điểm kỹ năng TB" giaTri={hs?.diemTb ?? "—"} phu={hs?.diemTuan != null && hs.diemTuanTruoc != null ? `${hs.diemTuan - hs.diemTuanTruoc >= 0 ? "▲" : "▼"} ${Math.abs(hs.diemTuan - hs.diemTuanTruoc)} so với tuần trước` : "Chưa đủ dữ liệu so sánh"} icon="ngoi_sao" mau="var(--nhan)" />
        <TheKpi ten="Phiên role-play" giaTri={hs?.soPhien ?? 0} phu="đã hoàn thành" icon="luyen_tap" mau="var(--tim)" />
        <TheKpi ten="Cuộc gọi đã phân tích" giaTri={hs?.soCuocGoi ?? 0} phu={hs?.tyLeThang != null ? `Tỷ lệ thắng ${hs.tyLeThang}%` : "Chưa có cuộc gọi"} icon="cuoc_goi" mau="var(--ngoc)" />
        <TheKpi ten="Điểm gamification" giaTri={diem.diem.toLocaleString("vi-VN")} phu={`Hạng ${diem.hang}${ke ? ` · còn ${ke.conThieu.toLocaleString("vi-VN")} tới ${ke.ten}` : ""}`} icon="cup" mau="var(--vang)" />
        <TheKpi ten="Chuỗi ngày luyện" giaTri={`${diem.chuoi} 🔥`} phu={diem.chuoi ? "Giữ chuỗi bằng một hoạt động mỗi ngày" : "Luyện hôm nay để bắt đầu chuỗi"} icon="lua" mau="var(--cam)" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="the p-4 lg:col-span-1">
          <div className="font-semibold mb-2">Radar kỹ năng của bạn</div>
          {hs?.radar ? <Radar lop={[{ ten: "Bạn", diem: hs.radar, mau: "#3b82f6", dam: true }]} size={250} /> : <div className="mo-ta py-10 text-center">Hoàn thành một phiên role-play hoặc nạp một cuộc gọi để có radar.</div>}
          {yeu.length > 0 && <div className="mt-2 text-xs" style={{ color: "var(--chu-mo)" }}>Ưu tiên luyện: <b style={{ color: "var(--chu)" }}>{yeu.map((k) => TEN_KY_NANG[k]).join(", ")}</b></div>}
        </div>
        <div className="the p-4 lg:col-span-2 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2"><div className="font-semibold">Kế hoạch luyện tập cá nhân</div><Link href="/huan-luyen/toi" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Xem chi tiết →</Link></div>
            {goi ? (
              <div className="grid gap-2 md:grid-cols-2">
                {goi.noi_dung.bai_tap.slice(0, 4).map((b, i) => (
                  <Link key={i} href={`/luyen-tap/moi?phan_doi=${b.loai_phan_doi}`} className="the-2 p-3 hover:border-[var(--nhan)] transition-colors">
                    <div className="text-sm font-semibold">{b.ten}</div><div className="text-xs mt-1" style={{ color: "var(--chu-mo)" }}>{b.muc_tieu}</div>
                  </Link>
                ))}
              </div>
            ) : <div className="mo-ta">Chưa có gói huấn luyện. <Link href="/huan-luyen/toi" style={{ color: "var(--nhan-sang)" }}>Nhờ AI sinh gói cho bạn →</Link></div>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="font-semibold mb-2">Phiên gần đây</div>
              {phienGan.length === 0 ? <div className="mo-ta">Chưa có phiên nào.</div> : (
                <div className="flex flex-col gap-1.5">{phienGan.map((p) => (
                  <Link key={p.id} href={`/luyen-tap/${p.id}`} className="flex items-center justify-between text-sm py-1.5 border-b" style={{ borderColor: "var(--vien)" }}>
                    <span className="truncate">{p.persona.ten} · <span style={{ color: "var(--chu-mo)" }}>{p.persona.cong_ty}</span></span>
                    {p.trang_thai === "xong" ? <NhanDiem diem={p.diem_tong} nhoGon /> : <span className="nhan nhan-nhan">Đang luyện</span>}
                  </Link>))}</div>)}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><div className="font-semibold">Nhiệm vụ từ cam kết</div><Link href="/nhiem-vu" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Tất cả →</Link></div>
              {nvMo.length === 0 ? <div className="mo-ta">Không có nhiệm vụ mở.</div> : (
                <div className="flex flex-col gap-1.5">{nvMo.slice(0, 5).map((n) => (
                  <div key={n.id} className="text-sm py-1.5 border-b flex justify-between gap-2" style={{ borderColor: "var(--vien)" }}>
                    <span className="truncate">{n.noi_dung}</span><span className={`nhan ${n.han && new Date(n.han) < new Date() ? "nhan-do" : "nhan-xam"}`}>{n.han ? tuKhiNao(n.han).replace("trước", "trước hạn") : "—"}</span>
                  </div>))}</div>)}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Khóa học của bạn</div>
            <div className="grid gap-2 md:grid-cols-2">{khoa.map((k) => (
              <Link key={k.id} href={`/dao-tao/${k.id}`} className="the-2 p-3">
                <div className="text-sm font-semibold">{k.ten}</div>
                <div className="flex items-center gap-2 mt-2"><div className="thanh flex-1"><i style={{ width: `${k.phan_tram ?? 0}%` }} /></div><span className="text-xs tabular">{k.phan_tram ?? 0}%</span></div>
              </Link>))}</div>
          </div>
        </div>
      </div>
    </KhungShell>
  );
}

async function TongQuanQuanLy({ chao, dnaDaCo }: { chao: boolean; dnaDaCo: boolean }) {
  const { phien, ws } = await nguCanhTrang();
  const [ins, mt, bxh, pdCho, dmCho, nv, wsCd] = await ws(async (q) => Promise.all([insightDoi(q), maTranDoi(q), bangXepHang(q, { nguoiXemId: phien.nguoiDungId, gioiHan: 5 }), khoPhanDoi(q, { trangThai: "nhap" }), thuVienDoanMau(q, { trangThai: "nhap" }), danhSachNhiemVu(q, {}), layWorkspace(q, phien.workspaceId)]));
  const rotHoc = await ws((q) => hocVienRuiRo(q, wsCd.nguong_rot_hoc_ngay));
  const quaHan = nv.filter((n) => n.trang_thai === "mo" && n.han && new Date(n.han) < new Date()).length;
  return (
    <KhungShell phien={phien} duongDan="/" tieuDe="Tổng quan Coaching" moTa="Sức khỏe kỹ năng của đội sale trong 90 ngày qua"
      hanhDong={<><Link href="/cuoc-goi/moi" className="nut"><Icon ten="tai_len" size={16} />Nạp cuộc gọi</Link><Link href="/huan-luyen" className="nut nut-chinh"><Icon ten="huan_luyen" size={16} />Ma trận kỹ năng</Link></>}>
      {chao && <div className="thong-bao thong-bao-xanh mb-4">Khởi động xong. AI đã nắm DNA và sản phẩm của doanh nghiệp — thử «Gọi điện với AI» hoặc tạo kịch bản DISC ngay.</div>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-5">
        <NutLon href="/goi-dien" ten="Gọi điện với AI" mo_ta="Thử khách ảo nói chuyện bằng giọng" icon="cuoc_goi" mau="var(--nhan)" noiBat />
        <NutLon href="/luyen-tap/moi" ten="Role-play" mo_ta="Luyện bằng chat với khách ảo" icon="luyen_tap" mau="var(--tim)" />
        <NutLon href={dnaDaCo ? "/san-pham" : "/bat-dau"} ten="Nạp DNA · Sản phẩm" mo_ta={dnaDaCo ? "DNA đã có — cập nhật sản phẩm" : "Cho AI biết bạn bán gì, cho ai"} icon="huan_luyen" mau="var(--xanh)" />
        <NutLon href="/kich-ban/disc" ten="Tạo kịch bản DISC" mo_ta="AI viết kịch bản chốt cho 4 nhóm khách" icon="nhan_vien" mau="var(--cam)" />
      </div>
      <div className="luoi-kpi mb-5">
        <TheKpi ten="Điểm chất lượng TB" giaTri={ins.diemTb ?? "—"} phu="role-play + cuộc gọi" icon="ngoi_sao" mau="var(--nhan)" />
        <TheKpi ten="Tỷ lệ thắng" giaTri={ins.tyLeThang != null ? `${ins.tyLeThang}%` : "—"} phu={`${ins.soCuocGoi} cuộc gọi đã phân tích`} icon="cup" mau="var(--xanh)" />
        <TheKpi ten="Phiên role-play" giaTri={ins.soPhien} phu="toàn đội" icon="luyen_tap" mau="var(--tim)" />
        <TheKpi ten="Chờ duyệt" giaTri={pdCho.length + dmCho.length} phu={`${pdCho.length} phản đối · ${dmCho.length} đoạn mẫu`} icon="kich_ban" mau="var(--vang)" />
        <TheKpi ten="Nhiệm vụ quá hạn" giaTri={quaHan} phu="cam kết với khách" icon="canh_bao" mau={quaHan ? "var(--do)" : "var(--ngoc)"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="the p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold">Bảng xếp hạng kỹ năng</div><Link href="/huan-luyen" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Ma trận đầy đủ →</Link></div>
          <div className="overflow-x-auto"><table className="bang">
            <thead><tr><th>#</th><th>Nhân viên</th><th>Phiên</th><th>Cuộc gọi</th><th>Thắng</th><th>Điểm TB</th><th>Xu hướng</th></tr></thead>
            <tbody>{mt.hoSo.map((h, i) => (
              <tr key={h.nguoiDungId}><td className="tabular">{i + 1}</td>
                <td><Link href={`/huan-luyen/${h.nguoiDungId}`} className="font-medium hover:underline">{h.ten}</Link><div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{h.chucDanh}</div></td>
                <td className="tabular">{h.soPhien}</td><td className="tabular">{h.soCuocGoi}</td><td className="tabular">{h.tyLeThang != null ? `${h.tyLeThang}%` : "—"}</td>
                <td><NhanDiem diem={h.diemTb} nhoGon /></td><td><Sparkline diem={h.xuHuong} /></td></tr>))}</tbody>
          </table></div>
        </div>
        <div className="the p-4">
          <div className="font-semibold mb-2">Radar đội vs Top 20%</div>
          {mt.radarDoi ? <Radar lop={[{ ten: "Đội", diem: mt.radarDoi, mau: "#3b82f6", dam: true }, ...(mt.top20 ? [{ ten: "Top 20%", diem: mt.top20, mau: "#8b5cf6" }] : [])]} size={240} /> : <div className="mo-ta py-8 text-center">Chưa có dữ liệu chấm.</div>}
        </div>
        <div className="the p-4">
          <div className="font-semibold mb-2">Insight đội nhóm</div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="the-2 p-3"><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Phản đối thua phổ biến</div>
              {ins.phanDoiThua.length ? ins.phanDoiThua.map((p) => <div key={p.loai} className="flex justify-between"><span className="font-semibold">“{p.ten}”</span><span className="tabular" style={{ color: "var(--chu-mo)" }}>{p.so} cuộc gọi thua</span></div>) : <div className="mo-ta">Chưa có cuộc gọi thua được phân tích.</div>}</div>
            <div className="the-2 p-3"><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Tiêu chí yếu nhất toàn đội</div>{ins.tieuChiYeu ? <div className="font-semibold">{ins.tieuChiYeu.ten} · <span className="tabular" style={{ color: "var(--do)" }}>{ins.tieuChiYeu.diem}/100</span></div> : <div className="mo-ta">—</div>}
              {ins.tieuChiYeu && <Link href="/dao-tao" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Đề xuất: giao module đào tạo tương ứng →</Link>}</div>
          </div>
        </div>
        <div className="the p-4">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold">Hàng chờ duyệt</div><Link href="/kich-ban?tab=phan-doi" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Duyệt →</Link></div>
          {pdCho.length === 0 && dmCho.length === 0 ? <div className="mo-ta">Không có gì chờ duyệt.</div> : (
            <div className="flex flex-col gap-1.5 text-sm">
              {pdCho.slice(0, 4).map((p) => <div key={p.id} className="py-1.5 border-b truncate" style={{ borderColor: "var(--vien)" }}><span className="nhan nhan-vang mr-1">Phản đối</span>{p.noi_dung}</div>)}
              {dmCho.slice(0, 3).map((d) => <div key={d.id} className="py-1.5 border-b truncate" style={{ borderColor: "var(--vien)" }}><span className="nhan nhan-tim mr-1">Đoạn mẫu</span>{d.noi_dung}</div>)}
            </div>)}
        </div>
        <div className="the p-4">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold">Cảnh báo rớt học (≥ {wsCd.nguong_rot_hoc_ngay} ngày)</div><Link href="/dao-tao" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Học viên →</Link></div>
          {rotHoc.length === 0 ? <div className="mo-ta">Không ai bỏ học quá ngưỡng.</div> : <div className="flex flex-col gap-1.5 text-sm">{rotHoc.slice(0, 5).map((r, i) => <div key={i} className="py-1.5 border-b" style={{ borderColor: "var(--vien)" }}><div className="flex justify-between"><Link href={`/huan-luyen/${r.nguoi_dung_id}`} className="font-medium hover:underline">{r.ten}</Link><span className="nhan nhan-do">{r.ngay_khong_hoc > 900 ? "chưa học" : `${r.ngay_khong_hoc} ngày`}</span></div><div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{r.khoa} · {r.phan_tram}% · bài kế: {r.bai_tiep ?? "—"}</div></div>)}</div>}
        </div>
        <div className="the p-4">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold">Gamification tuần này</div><Link href="/bang-xep-hang" className="text-xs" style={{ color: "var(--nhan-sang)" }}>Bảng đầy đủ →</Link></div>
          <div className="flex flex-col gap-1.5 text-sm">{bxh.map((b, i) => <div key={b.nguoiDungId} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "var(--vien)" }}><span>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`} {b.ten}</span><span className="tabular" style={{ color: "var(--chu-mo)" }}>{b.diem.toLocaleString("vi-VN")} · {b.chuoi}🔥</span></div>)}</div>
        </div>
      </div>
    </KhungShell>
  );
}
