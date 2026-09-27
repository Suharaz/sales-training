import { notFound } from "next/navigation";
import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { layPhien } from "@/services/luyen-tap";
import { danhSachKichBan, khoPhanDoi } from "@/services/kich-ban";
import { ManHinhLuyenTap } from "@/components/ManHinhLuyenTap";
import { KetQuaLuyenTapView } from "@/components/KetQuaLuyenTap";
import { TEN_DO_KHO } from "@/core/ai-kieu";
import { TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
export const dynamic = "force-dynamic";
export default async function TrangPhien({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ goi?: string }> }) {
  const { id } = await params; const { goi } = await searchParams;
  const { phien, ws } = await nguCanhTrang();
  const [p, kb, kho] = await ws(async (q) => Promise.all([layPhien(q, id), danhSachKichBan(q), khoPhanDoi(q, { trangThai: "da_duyet" })]));
  if (!p) notFound();
  if (p.nguoi_dung_id !== phien.nguoiDungId && phien.vaiTro !== "quan_ly") notFound();
  const kichBan = kb.find((k) => k.san_pham_id === p.san_pham_id) ?? kb[0] ?? null;
  const cuaToi = p.nguoi_dung_id === phien.nguoiDungId;
  return (
    <KhungShell phien={phien} duongDan="/luyen-tap" tieuDe={`${goi === "1" ? "Gọi điện với AI — " : "Cuộc gọi — "}${p.persona.ten}`} moTa={`${p.persona.chuc_danh} · ${p.persona.cong_ty} · ${TEN_DO_KHO[p.do_kho].split(" — ")[0]}${p.ten_san_pham ? ` · ${p.ten_san_pham}` : ""}`}
      hanhDong={<>{p.disc && p.trang_thai !== "dang" && <span className="nut nut-nho" style={{ pointerEvents: "none" }}>Khách nhóm {p.disc}</span>}<Link href="/luyen-tap" className="nut">← Danh sách</Link></>}>
      {p.trang_thai === "xong" && p.ket_qua ? (
        <KetQuaLuyenTapView phien={p} />
      ) : p.trang_thai === "huy" ? <div className="the p-8 text-center mo-ta">Phiên đã hủy.</div> : (
        <ManHinhLuyenTap phienId={p.id} persona={p.persona} lichSuBanDau={p.lich_su} cuaToi={cuaToi} goiDien={goi === "1" && cuaToi}
          kichBan={kichBan ? { ten: kichBan.ten, mo_dau: kichBan.mo_dau, khai_thac: kichBan.khai_thac, gia_tri: kichBan.gia_tri, chot: kichBan.chot } : null}
          khoPhanDoi={kho.map((k) => ({ loai: k.loai, ten: TEN_LOAI_PHAN_DOI[k.loai], noi_dung: k.noi_dung, cau_tra_loi_chuan: k.cau_tra_loi_chuan }))} />
      )}
    </KhungShell>
  );
}
