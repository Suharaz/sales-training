// Trang xác thực chứng chỉ CÔNG KHAI (F-129): chỉ hiện tên và khóa, không lộ dữ liệu khác.
import type { Metadata } from "next";
import { truyNenTang } from "@/services/workspace-guard";
import { laMaChungChi } from "@/core/chung-chi";
import { Icon } from "@/components/Icon";
import { NutChungChi } from "@/components/NutChungChi";
export const dynamic = "force-dynamic";
type CC = { ma: string; ten_nguoi: string; ten_khoa: string; cap_luc: string; thu_hoi_luc: string | null; ws_ten: string };
async function tra(ma: string): Promise<CC | null> {
  if (!laMaChungChi(ma)) return null;
  return (await truyNenTang<CC>("select * from tra_chung_chi($1)", [ma.toUpperCase()]))[0] ?? null;
}
export async function generateMetadata({ params }: { params: Promise<{ ma: string }> }): Promise<Metadata> {
  const { ma } = await params; const cc = await tra(ma);
  return cc ? { title: `Chứng chỉ ${cc.ten_khoa} — ${cc.ten_nguoi}`, description: `Xác thực chứng chỉ ${cc.ma} do ${cc.ws_ten} cấp.`, openGraph: { title: `${cc.ten_nguoi} đã hoàn thành ${cc.ten_khoa}`, description: `Chứng chỉ ${cc.ma} · ${cc.ws_ten}` } } : { title: "Không tìm thấy chứng chỉ" };
}
export default async function TrangChungChi({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params; const cc = await tra(ma);
  const ngay = cc ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(cc.cap_luc)) : "";
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "radial-gradient(900px 500px at 50% -10%, rgba(245,158,11,.14), transparent)" }}>
      <div className="w-full max-w-[640px]">
        {!cc ? <div className="the p-8 text-center"><div className="text-lg font-bold">Không tìm thấy chứng chỉ</div><div className="mo-ta mt-1">Mã «{ma}» không tồn tại hoặc sai định dạng (TST-NĂM-XXXX-XXXX).</div></div> : (
          <div className="the p-8 md:p-10 relative overflow-hidden" style={{ borderColor: "var(--vang)", boxShadow: "var(--bong)" }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "var(--vang-mo)" }} />
            <div className="flex items-center gap-2 mb-6"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-cta)" }}><Icon ten="tia" size={18} className="text-white" /></div><div className="font-extrabold tracking-tight">{cc.ws_ten}</div></div>
            <div className="text-xs uppercase tracking-[.2em]" style={{ color: "var(--chu-mo)" }}>Chứng nhận hoàn thành</div>
            <div className="text-3xl font-extrabold mt-2">{cc.ten_nguoi}</div>
            <div className="mt-1 text-sm" style={{ color: "var(--chu-mo)" }}>đã hoàn thành khóa</div>
            <div className="text-xl font-bold mt-1" style={{ color: "var(--chu-vang)" }}>{cc.ten_khoa}</div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm"><div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Ngày cấp</div><div className="font-semibold">{ngay}</div></div><div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Mã xác thực</div><div className="font-semibold tabular">{cc.ma}</div></div></div>
            <div className="mt-6 flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={cc.thu_hoi_luc ? { background: "var(--do-mo)", color: "var(--chu-do)" } : { background: "var(--xanh-mo)", color: "var(--chu-xanh)" }}><Icon ten={cc.thu_hoi_luc ? "x" : "check"} size={14} />{cc.thu_hoi_luc ? "Chứng chỉ này đã bị thu hồi." : "Chứng chỉ hợp lệ, được xác thực bởi hệ thống TAKI Sales Training."}</div>
            <div className="mt-4"><NutChungChi ma={cc.ma} tieuDe={`${cc.ten_nguoi} đã hoàn thành ${cc.ten_khoa}`} /></div>
          </div>)}
      </div>
    </div>
  );
}
