import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { FormKichBanDisc } from "@/components/FormKichBanDisc";
import { NutSinhDisc } from "@/components/NutSinhDisc";
import { nguCanhTrang } from "@/services/trang";
import { danhSachSanPham } from "@/services/kich-ban";
import { layBoKichBan, tongQuanDisc, luuKichBanDisc, doiTrangThaiDisc } from "@/services/disc";
import { cheDoAI } from "@/services/ai-gateway";
import { DISC, NHOM_DISC, laNhomDisc, type NhomDisc, type KichBanDisc } from "@/core/disc";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export default async function TrangDisc({ searchParams }: { searchParams: Promise<{ san_pham?: string; nhom?: string; loi?: string; ok?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { san_pham, nhom: nhomQ, loi, ok } = await searchParams;
  const [sp, tq] = await ws(async (q) => Promise.all([danhSachSanPham(q), tongQuanDisc(q)]));
  const spId = san_pham && sp.some((s) => s.id === san_pham) ? san_pham : sp[0]?.id ?? "";
  const nhom: NhomDisc = laNhomDisc(nhomQ) ? nhomQ : "D";
  const bo = spId ? await ws((q) => layBoKichBan(q, spId)) : { D: null, I: null, S: null, C: null };
  const quanLy = phien.vaiTro === "quan_ly";
  const ve = (n: string = nhom, them = "") => `/kich-ban/disc?san_pham=${spId}&nhom=${n}${them}`;
  async function luu(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const g = (k: string) => String(form.get(k) ?? "");
    const dong = (k: string) => g(k).split("\n").map((x) => x.trim()).filter(Boolean);
    const phanDoi = g("phan_doi").split(/\n\s*\n/).map((khoi) => { const [a, ...b] = khoi.split("\n"); return { cau_khach: (a ?? "").replace(/^khách:\s*/i, "").trim(), cau_tra_loi: b.join(" ").replace(/^sale:\s*/i, "").trim() }; }).filter((p) => p.cau_khach && p.cau_tra_loi);
    const noiDung: KichBanDisc = { mo_dau: g("mo_dau"), khai_thac: dong("khai_thac"), gia_tri: g("gia_tri"), phan_doi: phanDoi, chot: g("chot"), theo_doi: g("theo_doi"), tu_nen_dung: dong("tu_nen_dung"), tu_tranh: dong("tu_tranh") };
    const spX = g("san_pham_id"), nhomX = g("nhom");
    try { await ws((q) => luuKichBanDisc(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, sanPhamId: spX, nhom: nhomX, noiDung, duyet: g("hanh_dong") === "duyet" })); }
    catch (e) { redirect(`/kich-ban/disc?san_pham=${spX}&nhom=${nhomX}&loi=${encodeURIComponent((e as Error).message)}`); }
    revalidatePath("/kich-ban/disc"); redirect(`/kich-ban/disc?san_pham=${spX}&nhom=${nhomX}`);
  }
  async function boDuyet(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return; await ws((q) => doiTrangThaiDisc(q, { sanPhamId: String(form.get("san_pham_id")), nhom: String(form.get("nhom")), trangThai: "nhap" })); revalidatePath("/kich-ban/disc"); }
  const kb = bo[nhom]; const d = DISC[nhom];
  return (
    <KhungShell phien={phien} duongDan="/kich-ban" tieuDe="Kịch bản chốt sale theo DISC" moTa="Mỗi sản phẩm có 4 kịch bản cho 4 nhóm khách D · I · S · C. AI sinh từ DNA và hồ sơ sản phẩm, quản lý duyệt; role-play, copilot và phân tích dùng bản đã duyệt."
      hanhDong={<><ThongBaoAI cheDo={cheDoAI()} /><Link href="/kich-ban" className="nut">← Kịch bản chung</Link>{spId && kb && <Link href={`/kich-ban/disc/in?san_pham=${spId}`} className="nut" target="_blank">In 4 nhóm một trang</Link>}</>}>
      {loi && <div className="thong-bao thong-bao-do mb-3">{loi}</div>}
      {ok && <div className="thong-bao thong-bao-xanh mb-3">AI đã sinh {ok} kịch bản (trạng thái nháp). Đọc, sửa rồi bấm Duyệt.</div>}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form className="flex items-center gap-2"><input type="hidden" name="nhom" value={nhom} /><select name="san_pham" className="o-nhap w-72" defaultValue={spId}>{sp.map((s) => <option key={s.id} value={s.id}>{s.ten}</option>)}</select><button className="nut nut-nho">Chọn sản phẩm</button></form>
        {quanLy && spId && <NutSinhDisc sanPhamId={spId} nhom="tat_ca" />}
        <span className="text-xs" style={{ color: "var(--chu-mo)" }}>{tq.map((t) => `${t.ten}: ${t.so_duyet} duyệt / ${t.so_nhap} nháp`).join(" · ")}</span>
      </div>
      <div className="flex gap-1 mb-4 flex-wrap">{NHOM_DISC.map((n) => <Link key={n} href={ve(n)} className={`nut ${n === nhom ? "nut-chinh" : ""}`} style={n !== nhom ? { borderColor: DISC[n].mau } : undefined}>{DISC[n].ten}{bo[n] ? <span className={`nhan ${bo[n]!.trang_thai === "da_duyet" ? "nhan-xanh" : "nhan-vang"} ml-1`}>{bo[n]!.trang_thai === "da_duyet" ? "đã duyệt" : "nháp"}</span> : <span className="nhan nhan-xam ml-1">chưa có</span>}</Link>)}</div>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="the p-4 text-sm flex flex-col gap-3 h-fit" style={{ borderColor: d.mau }}>
          <div><div className="font-bold text-base" style={{ color: d.mau }}>{d.ten}</div><div className="mt-1" style={{ color: "var(--chu-mo)" }}>{d.mo_ta}</div></div>
          <Muc ten="Nhận ra qua điện thoại"><ul className="list-disc pl-4">{d.dau_hieu.map((x, i) => <li key={i}>{x}</li>)}</ul></Muc>
          <Muc ten="Họ muốn">{d.muon}</Muc><Muc ten="Họ sợ">{d.so}</Muc>
          <Muc ten="Nên"><ul className="list-disc pl-4">{d.nen.map((x, i) => <li key={i}>{x}</li>)}</ul></Muc>
          <Muc ten="Tránh"><ul className="list-disc pl-4">{d.tranh.map((x, i) => <li key={i}>{x}</li>)}</ul></Muc>
          <Muc ten="Bằng chứng ưu tiên">{d.bang_chung}</Muc><Muc ten="Kiểu chốt">{d.kieu_chot}</Muc>
        </aside>
        <div className="flex flex-col gap-3">
          {!spId ? <div className="the p-8 mo-ta text-center">Chưa có sản phẩm. Thêm ở trang Sản phẩm.</div> : !kb ? (
            <div className="the p-8 text-center"><div className="font-semibold text-lg">Chưa có kịch bản nhóm {nhom} cho sản phẩm này</div><div className="mo-ta mt-1">AI sẽ viết mở đầu, câu hỏi khai thác, trình bày giá trị, 3 phản đối điển hình, câu chốt, theo dõi và từ nên dùng/tránh, bám DNA và hồ sơ sản phẩm.</div>
              {quanLy && <div className="mt-4 flex justify-center"><NutSinhDisc sanPhamId={spId} nhom={nhom} /></div>}</div>
          ) : (
            <>
              <div className="the p-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--chu-mo)" }}>
                <span className={`nhan ${kb.trang_thai === "da_duyet" ? "nhan-xanh" : "nhan-vang"}`}>{kb.trang_thai === "da_duyet" ? "Đã duyệt — đang dùng cho AI" : "Nháp — chưa dùng cho AI"}</span>
                <span>Nguồn: {kb.che_do_ai === "seed" ? "mẫu" : kb.che_do_ai === "du_phong" ? "dự phòng theo luật" : kb.che_do_ai ? "Claude" : "nhập tay"}{kb.phien_ban_dna ? ` · DNA v${kb.phien_ban_dna}` : ""}</span>
                {quanLy && <span className="ml-auto flex gap-1 items-center"><NutSinhDisc sanPhamId={spId} nhom={nhom} nho />{kb.trang_thai === "da_duyet" && <form action={boDuyet}><input type="hidden" name="san_pham_id" value={spId} /><input type="hidden" name="nhom" value={nhom} /><button className="nut nut-nho">Bỏ duyệt</button></form>}</span>}
              </div>
              <FormKichBanDisc action={luu} sanPhamId={spId} nhom={nhom} kb={kb.noi_dung} chiXem={!quanLy} daDuyet={kb.trang_thai === "da_duyet"} />
            </>)}
        </div>
      </div>
    </KhungShell>
  );
}
function Muc({ ten, children }: { ten: string; children: React.ReactNode }) { return <div><div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--chu-nhat)" }}>{ten}</div><div className="text-[13px]">{children}</div></div>; }
