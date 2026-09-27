import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { CuocGoiTrucTiep } from "@/components/CuocGoiTrucTiep";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { nguCanhTrang } from "@/services/trang";
import { danhSachSanPham, danhSachKichBan, khoPhanDoi } from "@/services/kich-ban";
import { cheDoAI } from "@/services/ai-gateway";
export const dynamic = "force-dynamic";
export default async function TrangGhiAm() {
  const { phien, ws } = await nguCanhTrang();
  const [sp, kb, kho] = await ws(async (q) => Promise.all([danhSachSanPham(q), danhSachKichBan(q), khoPhanDoi(q, { trangThai: "da_duyet" })]));
  const kichBan: Record<string, { ten: string; mo_dau: string; khai_thac: string; gia_tri: string; chot: string } | null> = {};
  for (const s of sp) { const k = kb.find((x) => x.san_pham_id === s.id) ?? kb[0]; kichBan[s.id] = k ? { ten: k.ten, mo_dau: k.mo_dau, khai_thac: k.khai_thac, gia_tri: k.gia_tri, chot: k.chot } : null; }
  return (
    <KhungShell phien={phien} duongDan="/cuoc-goi" tieuDe="Cuộc gọi trực tiếp với AI Copilot" moTa="Trình duyệt nghe cuộc gọi và chuyển thành lời thoại; AI gợi ý câu nên nói, câu hỏi nên hỏi, cách xử lý phản đối và cảnh báo tuân thủ ngay trong lúc gọi. Kết thúc là có phân tích đầy đủ."
      hanhDong={<><ThongBaoAI cheDo={cheDoAI()} /><Link href="/cuoc-goi/moi" className="nut">Dán transcript thay vì ghi</Link></>}>
      <CuocGoiTrucTiep sanPham={sp.filter((s) => s.trang_thai === "dang_ban").map((s) => ({ id: s.id, ten: s.ten }))} kichBan={kichBan} khoPhanDoi={kho.map((k) => ({ loai: k.loai, noi_dung: k.noi_dung, cau_tra_loi_chuan: k.cau_tra_loi_chuan }))} tenSale={phien.ten} cheDoAI={cheDoAI()} />
    </KhungShell>
  );
}
