import Link from "next/link";
import { notFound } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { chiTietKhoa, tienDoCuaToi } from "@/services/dao-tao";
import { ManHinhBaiHoc } from "@/components/ManHinhBaiHoc";
export const dynamic = "force-dynamic";
export default async function TrangBai({ params }: { params: Promise<{ khoaId: string; baiId: string }> }) {
  const { khoaId, baiId } = await params;
  const { phien, ws } = await nguCanhTrang();
  const [ct, td] = await ws(async (q) => Promise.all([chiTietKhoa(q, khoaId), tienDoCuaToi(q, phien.nguoiDungId, khoaId)]));
  if (!ct) notFound();
  const tatCa = ct.modules.flatMap((m) => m.bai);
  const idx = tatCa.findIndex((b) => b.id === baiId);
  if (idx < 0) notFound();
  const bai = tatCa[idx], truoc = tatCa[idx - 1], sau = tatCa[idx + 1];
  const mod = ct.modules.find((m) => m.id === bai.module_hoc_id)!;
  return (
    <KhungShell phien={phien} duongDan="/dao-tao" tieuDe={bai.ten} moTa={`${ct.khoa.ten} · ${mod.ten} · bài ${idx + 1}/${tatCa.length}`} hanhDong={<Link href={`/dao-tao/${khoaId}`} className="nut">← Mục lục</Link>}>
      <ManHinhBaiHoc khoaId={khoaId} bai={{ id: bai.id, ten: bai.ten, loai: bai.loai, noi_dung: bai.noi_dung, video_url: bai.video_url, thoi_luong_giay: bai.thoi_luong_giay, cau_hoi: bai.cau_hoi.map((c) => ({ hoi: c.hoi, luaChon: c.luaChon, giaiThich: c.giaiThich })) }}
        daXong={td.baiXong.has(bai.id)} diemQuizCu={td.diemQuiz[bai.id] ?? null} chongTuaAo={ct.khoa.chong_tua_ao}
        lienKet={{ truoc: truoc ? `/dao-tao/${khoaId}/bai/${truoc.id}` : null, sau: sau ? `/dao-tao/${khoaId}/bai/${sau.id}` : null, mucLuc: `/dao-tao/${khoaId}` }} />
    </KhungShell>
  );
}
