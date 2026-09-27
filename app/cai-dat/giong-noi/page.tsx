import Link from "next/link";
import { KhungShell } from "@/components/KhungShell";
import { FormGiongNoi } from "@/components/FormGiongNoi";
import { nguCanhTrang } from "@/services/trang";
import { layCauHinhGiong, AZURE_VOICES, ELEVEN_MODELS } from "@/services/giong-noi";
export const dynamic = "force-dynamic";
export default async function TrangGiongNoi() {
  const { phien, ws } = await nguCanhTrang();
  const ch = await ws((q) => layCauHinhGiong(q));
  return (
    <KhungShell phien={phien} duongDan="/cai-dat" tieuDe="Giọng nói AI" moTa="Kết nối ElevenLabs hoặc Azure Speech để khách ảo nói bằng giọng tự nhiên và nhận dạng giọng nói chính xác hơn. Khóa được mã hóa, chỉ dùng trong workspace này."
      hanhDong={<Link href="/cai-dat" className="nut">← Cài đặt</Link>}>
      <FormGiongNoi cauHinh={ch} azureVoices={AZURE_VOICES} elevenModels={ELEVEN_MODELS} quanLy={phien.vaiTro === "quan_ly"} />
    </KhungShell>
  );
}
