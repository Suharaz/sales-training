import Link from "next/link";
import { notFound } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { ThanhTienDo } from "@/components/NhanDiem";
import { Icon } from "@/components/Icon";
import { nguCanhTrang } from "@/services/trang";
import { chiTietKhoa, tienDoCuaToi } from "@/services/dao-tao";
export const dynamic = "force-dynamic";
export default async function TrangKhoa({ params }: { params: Promise<{ khoaId: string }> }) {
  const { khoaId } = await params;
  const { phien, ws } = await nguCanhTrang();
  const [ct, td] = await ws(async (q) => Promise.all([chiTietKhoa(q, khoaId), tienDoCuaToi(q, phien.nguoiDungId, khoaId)]));
  if (!ct) notFound();
  const tatCa = ct.modules.flatMap((m) => m.bai);
  const baiTiep = tatCa.find((b) => !td.baiXong.has(b.id));
  return (
    <KhungShell phien={phien} duongDan="/dao-tao" tieuDe={ct.khoa.ten} moTa={ct.khoa.mo_ta} hanhDong={<><Link href="/dao-tao" className="nut">← Khóa học</Link>{baiTiep && <Link href={`/dao-tao/${khoaId}/bai/${baiTiep.id}`} className="nut nut-chinh">{td.phanTram ? "Tiếp tục học" : "Bắt đầu học"}</Link>}</>}>
      <div className="the p-4 mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]"><div className="flex justify-between text-sm mb-1"><span>Tiến độ</span><span className="tabular font-semibold">{td.phanTram}%</span></div><ThanhTienDo phanTram={td.phanTram} /></div>
        <div className="text-xs" style={{ color: "var(--chu-mo)" }}>{td.baiXong.size}/{tatCa.length} bài · ngưỡng {ct.khoa.nguong_hoan_thanh}%{ct.khoa.chong_tua_ao ? " · chống tua ảo" : ""}</div>
        {td.chungChiMa && <Link href={`/chung-chi/${td.chungChiMa}`} className="nut nut-nho"><Icon ten="chung_chi" size={14} />Chứng chỉ {td.chungChiMa}</Link>}
      </div>
      <div className="flex flex-col gap-3">{ct.modules.map((m, mi) => { const xong = m.bai.filter((b) => td.baiXong.has(b.id)).length; return (
        <div key={m.id} className="the p-4"><div className="flex items-center justify-between mb-2"><div className="font-semibold">Module {mi + 1}: {m.ten}</div><span className={`nhan ${xong === m.bai.length && m.bai.length ? "nhan-xanh" : "nhan-xam"}`}>{xong}/{m.bai.length}</span></div>
          <div className="flex flex-col">{m.bai.map((b, bi) => { const daXong = td.baiXong.has(b.id); return (
            <Link key={b.id} href={`/dao-tao/${khoaId}/bai/${b.id}`} className="flex items-center gap-3 py-2 border-b last:border-0 text-sm hover:bg-[var(--the-2)] rounded px-2 -mx-2" style={{ borderColor: "var(--vien)" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: daXong ? "var(--xanh-mo)" : "var(--nut-nen)", color: daXong ? "var(--chu-xanh)" : "var(--chu-mo)" }}>{daXong ? <Icon ten="check" size={12} /> : bi + 1}</span>
              <span className="flex-1">{b.ten}</span>
              <span className="nhan nhan-xam">{b.loai === "quiz" ? `Quiz · ${b.cau_hoi.length} câu` : b.loai === "video" ? "Video" : `${Math.round(b.thoi_luong_giay / 60)} phút`}</span>
              {b.loai === "quiz" && td.diemQuiz[b.id] != null && <span className={`nhan ${td.diemQuiz[b.id] >= 70 ? "nhan-xanh" : "nhan-do"}`}>{td.diemQuiz[b.id]}%</span>}
            </Link>); })}</div></div>); })}</div>
    </KhungShell>
  );
}
