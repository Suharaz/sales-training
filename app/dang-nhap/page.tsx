import { redirect } from "next/navigation";
import { dangNhap, layPhien } from "@/services/xac-thuc";
import { Icon } from "@/components/Icon";
import { NutCho } from "@/components/NutCho";

export default async function TrangDangNhap({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  if (await layPhien()) redirect("/");
  const { loi } = await searchParams;
  async function xuLy(form: FormData) {
    "use server";
    const kq = await dangNhap(String(form.get("email") ?? ""), String(form.get("mat_khau") ?? ""));
    if (!kq.ok) redirect(`/dang-nhap?loi=${encodeURIComponent(kq.loi)}`);
    redirect("/");
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,.18), transparent), radial-gradient(900px 500px at 100% 100%, rgba(139,92,246,.16), transparent)" }}>
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-cta)" }}><Icon ten="tia" size={22} className="text-white" /></div>
          <div><div className="text-xl font-extrabold tracking-tight">TAKI Sales Training</div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Huấn luyện đội sale bằng AI</div></div>
        </div>
        <form action={xuLy} className="the p-6 flex flex-col gap-4" style={{ boxShadow: "var(--bong)" }}>
          <div><div className="text-lg font-bold">Đăng nhập</div><div className="mo-ta">Dùng tài khoản do quản lý cấp.</div></div>
          {loi && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Email</span><input name="email" type="email" required autoComplete="username" className="o-nhap" placeholder="ten@congty.vn" /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Mật khẩu</span><input name="mat_khau" type="password" required autoComplete="current-password" className="o-nhap" /></label>
          <NutCho dangLam="Đang đăng nhập…" className="nut nut-chinh justify-center py-2.5">Vào hệ thống</NutCho>
          <div className="text-[11px] leading-relaxed p-3 rounded-lg" style={{ background: "var(--the-2)", color: "var(--chu-mo)" }}>
            <div className="font-semibold mb-1" style={{ color: "var(--chu)" }}>Tài khoản demo</div>
            Quản lý: <code>quanly@demo.vn</code> / <code>Demo@2026</code><br />Sale: <code>sale1@demo.vn</code> … <code>sale5@demo.vn</code> / <code>Sale@2026</code>
          </div>
        </form>
      </div>
    </div>
  );
}
