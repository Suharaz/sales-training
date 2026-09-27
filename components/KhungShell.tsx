// Vỏ ứng dụng: sidebar hợp nhất + header. Server component nhận phiên; phần đổi theme/đăng xuất là client nhỏ.
import Link from "next/link";
import type { Phien } from "@/services/xac-thuc";
import { Icon } from "./Icon";
import { NutTheme, NutDangXuat } from "./NutHeader";
import { TEN_VAI_TRO } from "@/core/phan-quyen";

export type MucMenu = { href: string; ten: string; icon: string; chiQuanLy?: boolean };
export const MENU: MucMenu[] = [
  { href: "/", ten: "Tổng quan", icon: "tong_quan" },
  { href: "/luyen-tap", ten: "Luyện tập role-play", icon: "luyen_tap" },
  { href: "/cuoc-goi", ten: "Phân tích cuộc gọi", icon: "cuoc_goi" },
  { href: "/huan-luyen", ten: "Huấn luyện AI", icon: "huan_luyen" },
  { href: "/dna", ten: "DNA doanh nghiệp", icon: "huan_luyen" },
  { href: "/san-pham", ten: "Sản phẩm", icon: "chung_chi" },
  { href: "/kich-ban", ten: "Kịch bản & Phản đối", icon: "kich_ban" },
  { href: "/kich-ban/disc", ten: "Kịch bản DISC", icon: "nhan_vien" },
  { href: "/dao-tao", ten: "Đào tạo", icon: "dao_tao" },
  { href: "/nhiem-vu", ten: "Nhiệm vụ", icon: "nhiem_vu" },
  { href: "/bang-xep-hang", ten: "Bảng xếp hạng", icon: "cup" },
  { href: "/bao-cao", ten: "Báo cáo", icon: "bxh", chiQuanLy: true },
  { href: "/nhan-vien", ten: "Nhân viên", icon: "nhan_vien", chiQuanLy: true },
  { href: "/cai-dat", ten: "Cài đặt", icon: "cai_dat" },
];

export function KhungShell({ phien, duongDan, tieuDe, moTa, hanhDong, children }: { phien: Phien; duongDan: string; tieuDe: string; moTa?: string; hanhDong?: React.ReactNode; children: React.ReactNode }) {
  const chon = (href: string) => (href === "/" ? duongDan === "/" : href === "/kich-ban" ? duongDan === "/kich-ban" : duongDan.startsWith(href));
  return (
    <div className="min-h-screen flex">
      <aside className="an-mobile w-[232px] shrink-0 border-r flex flex-col" style={{ background: "var(--nen-2)", borderColor: "var(--vien)" }}>
        <div className="px-4 py-4 flex items-center gap-2 border-b" style={{ borderColor: "var(--vien)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-cta)" }}><Icon ten="tia" size={18} className="text-white" /></div>
          <div><div className="font-extrabold leading-tight tracking-tight">TAKI</div><div className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--chu-mo)" }}>SALES TRAINING</div></div>
        </div>
        <nav className="p-3 flex flex-col gap-0.5 flex-1">
          {MENU.filter((m) => !m.chiQuanLy || phien.vaiTro === "quan_ly").map((m) => (
            <Link key={m.href} href={m.href} className={`muc-sidebar ${chon(m.href) ? "dang-chon" : ""}`}><Icon ten={m.icon} size={18} />{m.ten}</Link>
          ))}
        </nav>
        <div className="p-3 border-t text-xs" style={{ borderColor: "var(--vien)", color: "var(--chu-mo)" }}>
          <div className="font-semibold" style={{ color: "var(--chu)" }}>{phien.workspaceTen}</div>
          <div>Múi giờ {phien.muiGio}</div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b flex items-center gap-3 px-4 md:px-6" style={{ borderColor: "var(--vien)", background: "var(--nen-2)" }}>
          <Link href="/" className="md:hidden font-extrabold">TAKI</Link>
          <div className="flex-1 min-w-0 md:hidden text-sm truncate">{tieuDe}</div>
          <div className="hidden md:block flex-1" />
          <NutTheme />
          <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: "var(--vien)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--nhan-mo)", color: "var(--nhan-sang)" }}>{phien.ten.split(" ").slice(-1)[0]?.[0] ?? "?"}</div>
            <div className="an-mobile leading-tight"><div className="text-[13px] font-semibold">{phien.ten}</div><div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>{TEN_VAI_TRO[phien.vaiTro]}</div></div>
            <NutDangXuat />
          </div>
        </header>
        <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b" style={{ borderColor: "var(--vien)" }}>
          {MENU.filter((m) => !m.chiQuanLy || phien.vaiTro === "quan_ly").map((m) => (
            <Link key={m.href} href={m.href} className={`nut nut-nho ${chon(m.href) ? "nut-chinh" : ""}`}>{m.ten}</Link>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div><h1 className="tieu-de">{tieuDe}</h1>{moTa && <p className="mo-ta mt-0.5">{moTa}</p>}</div>
            {hanhDong && <div className="flex flex-wrap gap-2">{hanhDong}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
