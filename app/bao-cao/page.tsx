import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { Radar } from "@/components/Radar";
import { TheKpi } from "@/components/TheKpi";
import { NhanDiem } from "@/components/NhanDiem";
import { nguCanhTrang } from "@/services/trang";
import { yeuCauQuanLy } from "@/services/xac-thuc";
import { baoCaoDoi } from "@/services/bao-cao";
import { KY_NANG, TEN_KY_NANG } from "@/core/khung-ky-nang";
export const dynamic = "force-dynamic";
export default async function TrangBaoCao({ searchParams }: { searchParams: Promise<{ ngay?: string }> }) {
  await yeuCauQuanLy();
  const { phien, ws } = await nguCanhTrang();
  const { ngay: n } = await searchParams;
  const ngay = [7, 30, 90].includes(Number(n)) ? Number(n) : 30;
  const { dong, radarDoi } = await ws((q) => baoCaoDoi(q, ngay));
  const tong = dong.reduce((s, d) => ({ phien: s.phien + d.phien, goi: s.goi + d.cuoc_goi, thang: s.thang + d.thang, bai: s.bai + d.bai_xong, diem: s.diem + d.diem_gamification }), { phien: 0, goi: 0, thang: 0, bai: 0, diem: 0 });
  const coDiem = dong.filter((d) => d.diem_tb_phien != null || d.diem_tb_goi != null);
  const tb = coDiem.length ? Math.round(coDiem.reduce((s, d) => s + ((d.diem_tb_phien ?? d.diem_tb_goi ?? 0) + (d.diem_tb_goi ?? d.diem_tb_phien ?? 0)) / 2, 0) / coDiem.length) : null;
  return (
    <KhungShell phien={phien} duongDan="/bao-cao" tieuDe="Báo cáo đào tạo đội nhóm" moTa={`Kỳ ${ngay} ngày gần nhất · ${dong.length} nhân viên sale`}
      hanhDong={<><div className="flex gap-1">{[7, 30, 90].map((k) => <Link key={k} href={`/bao-cao?ngay=${k}`} className={`nut nut-nho ${ngay === k ? "nut-chinh" : ""}`}>{k} ngày</Link>)}</div><a href={`/api/bao-cao?ngay=${ngay}`} className="nut">Xuất CSV</a></>}>
      <div className="luoi-kpi mb-4">
        <TheKpi ten="Phiên role-play" giaTri={tong.phien} icon="luyen_tap" mau="var(--tim)" />
        <TheKpi ten="Cuộc gọi phân tích" giaTri={tong.goi} phu={tong.goi ? `Thắng ${Math.round((tong.thang / tong.goi) * 100)}%` : undefined} icon="cuoc_goi" mau="var(--ngoc)" />
        <TheKpi ten="Điểm chất lượng TB" giaTri={tb ?? "—"} icon="ngoi_sao" mau="var(--nhan)" />
        <TheKpi ten="Bài học hoàn thành" giaTri={tong.bai} icon="dao_tao" mau="var(--xanh)" />
        <TheKpi ten="Điểm gamification" giaTri={tong.diem.toLocaleString("vi-VN")} icon="cup" mau="var(--vang)" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="the overflow-x-auto"><table className="bang"><thead><tr><th>Nhân viên</th><th>Phiên</th><th>TB phiên</th><th>Cuộc gọi</th><th>Thắng</th><th>TB gọi</th><th>Bài xong</th><th>Quiz TB</th><th>Điểm</th>{KY_NANG.map((k) => <th key={k} className="text-center">{TEN_KY_NANG[k].split(" ")[0]}</th>)}</tr></thead>
          <tbody>{dong.map((d) => <tr key={d.nguoi_dung_id}><td><Link href={`/huan-luyen/${d.nguoi_dung_id}`} className="font-medium hover:underline">{d.ten}</Link></td><td className="tabular">{d.phien}</td><td><NhanDiem diem={d.diem_tb_phien} nhoGon /></td><td className="tabular">{d.cuoc_goi}</td><td className="tabular">{d.cuoc_goi ? `${Math.round((d.thang / d.cuoc_goi) * 100)}%` : "—"}</td><td><NhanDiem diem={d.diem_tb_goi} nhoGon /></td><td className="tabular">{d.bai_xong}</td><td className="tabular">{d.quiz_tb != null ? `${d.quiz_tb}%` : "—"}</td><td className="tabular">{d.diem_gamification.toLocaleString("vi-VN")}</td>
            {KY_NANG.map((k) => <td key={k} className="text-center tabular" style={{ color: d.radar ? (d.radar[k] >= 80 ? "var(--xanh)" : d.radar[k] >= 65 ? "var(--vang)" : "var(--do)") : "var(--chu-nhat)" }}>{d.radar?.[k] ?? "—"}</td>)}</tr>)}</tbody></table></div>
        <div className="the p-4"><div className="font-semibold mb-2">Radar đội trong kỳ</div>{radarDoi ? <Radar lop={[{ ten: "Đội", diem: radarDoi, mau: "#2563eb", dam: true }]} size={250} /> : <div className="mo-ta py-8 text-center">Chưa có bản chấm trong kỳ.</div>}</div>
      </div>
    </KhungShell>
  );
}
