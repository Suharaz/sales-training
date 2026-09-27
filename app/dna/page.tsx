import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { FormDna } from "@/components/FormDna";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { nguCanhTrang } from "@/services/trang";
import { layDna, luuDna } from "@/services/dna";
import { cheDoAI } from "@/services/ai-gateway";
import { doDayDuDna, tomTatDna } from "@/core/dna";
export const dynamic = "force-dynamic";
export default async function TrangDna({ searchParams }: { searchParams: Promise<{ loi?: string; ok?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { loi, ok } = await searchParams;
  const dna = await ws((q) => layDna(q));
  const quanLy = phien.vaiTro === "quan_ly";
  const dd = doDayDuDna(dna);
  async function luu(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const g = (k: string) => String(form.get(k) ?? "");
    try {
      await ws((q) => luuDna(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, nguon: g("nguon") === "ai_trich" ? "ai_trich" : "thu_cong", noiDung: {
        ten_doanh_nghiep: g("ten_doanh_nghiep"), nganh: g("nganh"), mo_ta: g("mo_ta"), khach_hang_muc_tieu: g("khach_hang_muc_tieu"), noi_dau_khach: g("noi_dau_khach"),
        usp: g("usp").split("\n"), xung_ho: g("xung_ho"), phong_cach: g("phong_cach"), tu_cam: g("tu_cam").split("\n"), so_lieu_cho_phep: g("so_lieu_cho_phep").split("\n"),
        doi_thu: g("doi_thu"), chinh_sach: g("chinh_sach"), cau_chuyen: g("cau_chuyen") } }));
    } catch (e) { redirect(`/dna?loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/dna"); redirect("/dna?ok=1");
  }
  return (
    <KhungShell phien={phien} duongDan="/dna" tieuDe="DNA doanh nghiệp" moTa="Hồ sơ doanh nghiệp mà mọi tác vụ AI (đóng vai khách, chấm điểm, phân tích, gợi ý) bám theo: giọng, xưng hô, từ cấm, số liệu được phép, USP, chính sách."
      hanhDong={<ThongBaoAI cheDo={cheDoAI()} />}>
      {loi && <div className="thong-bao thong-bao-do mb-3">{loi}</div>}
      {ok && <div className="thong-bao thong-bao-xanh mb-3">Đã lưu DNA phiên bản {dna.phien_ban}. Từ giờ AI dùng hồ sơ này.</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <FormDna action={luu} dna={dna} chiXem={!quanLy} />
        <div className="flex flex-col gap-4">
          <div className="the p-4 text-sm">
            <div className="flex items-center justify-between mb-1"><div className="font-semibold">Độ đầy đủ</div><span className="tabular font-bold">{dd.diem}%</span></div>
            <div className="thanh"><i style={{ width: `${dd.diem}%`, background: dd.diem >= 80 ? "var(--xanh)" : dd.diem >= 50 ? "var(--vang)" : "var(--do)" }} /></div>
            {dd.thieu.length > 0 && <div className="text-xs mt-2" style={{ color: "var(--chu-mo)" }}>Còn thiếu: {dd.thieu.join(", ")}</div>}
            <div className="text-xs mt-2" style={{ color: "var(--chu-mo)" }}>{dna.id ? `Phiên bản ${dna.phien_ban} · nguồn ${dna.nguon_nap === "ai_trich" ? "AI trích" : "nhập tay"}` : "Chưa nạp DNA — AI đang viết trung tính, không nêu số liệu."}</div>
          </div>
          {dna.id && <div className="the p-4 text-sm"><div className="font-semibold mb-1">AI đang thấy gì</div><div className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "var(--chu-mo)" }}>{tomTatDna(dna)}</div></div>}
          <div className="the p-4 text-xs leading-relaxed" style={{ color: "var(--chu-mo)" }}>Quy tắc: mọi lời gọi AI tự nạp bản tóm tắt này; đầu ra có từ cấm sẽ bị đánh dấu trong nhật ký AI; số liệu ngoài danh sách không được nêu. Đổi DNA là tăng phiên bản, nội dung AI ghi phiên bản đã dùng.</div>
        </div>
      </div>
    </KhungShell>
  );
}
