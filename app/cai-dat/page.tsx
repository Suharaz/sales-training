import { redirect } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { nguCanhTrang } from "@/services/trang";
import { cheDoAI, kiemTraCli, modelMacDinh } from "@/services/ai-gateway";
import { doiMatKhauCuaToi } from "@/services/nhan-vien";
import { TEN_VAI_TRO } from "@/core/phan-quyen";
import { layWorkspace, capNhatWorkspace, nhatKyKiemToan, MUI_GIO_HOP_LE } from "@/services/workspace";
import { dinhDangNgay } from "@/services/trang";
export const dynamic = "force-dynamic";
export default async function TrangCaiDat({ searchParams }: { searchParams: Promise<{ loi?: string; ok?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const { loi, ok } = await searchParams;
  const cheDo = cheDoAI();
  const cli = cheDo === "cli" || (!process.env.VERCEL && (process.env.AI_MODE || "").toLowerCase() === "cli") ? await kiemTraCli() : null;
  const [wsCd, kiemToan] = await ws(async (q) => Promise.all([layWorkspace(q, phien.workspaceId), phien.vaiTro === "quan_ly" ? nhatKyKiemToan(q, 60) : Promise.resolve([])]));
  async function luuWs(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    try { await ws((q) => capNhatWorkspace(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, ten: String(form.get("ten") ?? ""), muiGio: String(form.get("mui_gio") ?? ""), nguongRotHoc: Number(form.get("nguong_rot_hoc") ?? 7) })); }
    catch (e) { redirect(`/cai-dat?loi=${encodeURIComponent((e as Error).message)}`); }
    redirect("/cai-dat?ok=1");
  }
  const log = phien.vaiTro === "quan_ly" ? await ws(async (q) => (await q.query<{ tac_vu: string; che_do: string; model: string | null; ok: boolean; thoi_gian_ms: number; loi: string | null; luc: string }>("select tac_vu, che_do, model, ok, thoi_gian_ms, loi, luc::text from log_sinh_ai order by luc desc limit 12")).rows) : [];
  async function doiMk(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang();
    try { await ws((q) => doiMatKhauCuaToi(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, cu: String(form.get("cu")), moi: String(form.get("moi")) })); }
    catch (e) { redirect(`/cai-dat?loi=${encodeURIComponent((e as Error).message)}`); }
    redirect("/cai-dat?ok=1");
  }
  return (
    <KhungShell phien={phien} duongDan="/cai-dat" tieuDe="Cài đặt" moTa="Tài khoản, trạng thái AI và nhật ký gọi AI.">
      <div className="grid gap-4 lg:grid-cols-2">
        {phien.vaiTro === "quan_ly" && <form action={luuWs} className="the p-5 text-sm flex flex-col gap-2 lg:col-span-2"><div className="font-semibold">Workspace</div>
          <div className="grid gap-2 md:grid-cols-3">
            <label className="flex flex-col gap-1">Tên<input name="ten" className="o-nhap" defaultValue={wsCd.ten} required /></label>
            <label className="flex flex-col gap-1">Múi giờ<select name="mui_gio" className="o-nhap" defaultValue={wsCd.mui_gio}>{MUI_GIO_HOP_LE.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
            <label className="flex flex-col gap-1">Ngưỡng rớt học (ngày không học)<input name="nguong_rot_hoc" type="number" min={1} max={60} className="o-nhap" defaultValue={wsCd.nguong_rot_hoc_ngay} /></label>
          </div><div><button className="nut nut-chinh">Lưu workspace</button> <span className="text-xs" style={{ color: "var(--chu-mo)" }}>Đổi múi giờ hiệu lực ở lần đăng nhập sau.</span></div></form>}
        <div className="the p-5 text-sm flex flex-col gap-3"><div className="font-semibold">Tài khoản</div>
          <div className="grid grid-cols-[120px_1fr] gap-y-1"><span style={{ color: "var(--chu-mo)" }}>Tên</span><span>{phien.ten}</span><span style={{ color: "var(--chu-mo)" }}>Email</span><span>{phien.email}</span><span style={{ color: "var(--chu-mo)" }}>Vai trò</span><span>{TEN_VAI_TRO[phien.vaiTro]}</span><span style={{ color: "var(--chu-mo)" }}>Workspace</span><span>{phien.workspaceTen}</span></div>
          <form action={doiMk} className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--vien)" }}><div className="font-semibold">Đổi mật khẩu</div>
            {loi && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}{ok && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--xanh-mo)", color: "var(--chu-xanh)" }}>Đã đổi mật khẩu.</div>}
            <input name="cu" type="password" className="o-nhap" placeholder="Mật khẩu hiện tại" required autoComplete="current-password" /><input name="moi" type="password" className="o-nhap" placeholder="Mật khẩu mới" required autoComplete="new-password" /><button className="nut self-start">Đổi mật khẩu</button></form></div>
        <div className="the p-5 text-sm flex flex-col gap-3"><div className="font-semibold">Não AI (Claude)</div>
          <div className="flex items-center gap-2"><span className={`nhan ${cheDo === "du_phong" ? "nhan-vang" : "nhan-xanh"}`}>{cheDo === "cli" ? "Claude CLI (gói sub)" : cheDo === "api" ? "Claude API" : "Dự phòng theo luật"}</span><span style={{ color: "var(--chu-mo)" }}>model {modelMacDinh()}</span></div>
          {cli && <div className="text-xs" style={{ color: cli.ok ? "var(--chu-xanh)" : "var(--chu-do)" }}>{cli.ok ? `CLI sẵn sàng: ${cli.thongTin}` : `CLI lỗi: ${cli.thongTin}`}</div>}
          <div className="text-xs leading-relaxed" style={{ color: "var(--chu-mo)" }}>Mọi lời gọi AI đi qua AI Gateway: ép JSON theo lược đồ, tự sửa một vòng, thất bại thì rơi xuống chấm theo luật. Cấu hình qua biến môi trường <code>AI_MODE</code> (cli|api) và <code>ANTHROPIC_API_KEY</code>. Trên Vercel chỉ dùng được chế độ api.</div>
          {phien.vaiTro === "quan_ly" && <div className="pt-2 border-t" style={{ borderColor: "var(--vien)" }}><div className="font-semibold mb-1">Nhật ký gọi AI gần đây</div>
            {log.length === 0 ? <div className="mo-ta">Chưa có.</div> : <table className="bang text-xs"><tbody>{log.map((l, i) => <tr key={i}><td>{l.tac_vu}</td><td><span className={`nhan ${l.ok ? "nhan-xanh" : "nhan-do"}`}>{l.che_do}</span></td><td className="tabular">{(l.thoi_gian_ms / 1000).toFixed(1)}s</td><td style={{ color: "var(--chu-mo)" }}>{l.loi ? l.loi.slice(0, 60) : l.model ?? ""}</td></tr>)}</tbody></table>}</div>}
        </div>
        {phien.vaiTro === "quan_ly" && <div className="the p-5 text-sm lg:col-span-2"><div className="font-semibold mb-2">Nhật ký kiểm toán (60 gần nhất)</div>
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto"><table className="bang text-xs"><thead><tr><th>Lúc</th><th>Người</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
            <tbody>{kiemToan.map((k, i) => <tr key={i}><td className="whitespace-nowrap">{dinhDangNgay(k.luc, phien.muiGio)}</td><td>{k.ten ?? "hệ thống"}</td><td><span className="nhan nhan-xam">{k.hanh_dong}</span></td><td className="tabular" style={{ color: "var(--chu-mo)" }}>{k.doi_tuong?.slice(0, 8) ?? ""}</td><td style={{ color: "var(--chu-mo)" }}>{Object.keys(k.chi_tiet).length ? JSON.stringify(k.chi_tiet).slice(0, 80) : ""}</td></tr>)}</tbody></table></div></div>}
      </div>
    </KhungShell>
  );
}
