import Link from "next/link";
import { Icon } from "./Icon";
export function NutLon({ href, ten, mo_ta, icon, mau, noiBat }: { href: string; ten: string; mo_ta: string; icon: string; mau: string; noiBat?: boolean }) {
  return (
    <Link href={href} className="the p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5" style={noiBat ? { background: "var(--gradient-cta)", color: "#fff", borderColor: "transparent" } : { borderLeft: `4px solid ${mau}` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: noiBat ? "rgba(255,255,255,.18)" : `color-mix(in srgb, ${mau} 15%, transparent)`, color: noiBat ? "#fff" : mau }}><Icon ten={icon} size={28} /></div>
      <div className="min-w-0"><div className="text-lg font-extrabold tracking-tight uppercase">{ten}</div><div className="text-[13px]" style={{ color: noiBat ? "rgba(255,255,255,.85)" : "var(--chu-mo)" }}>{mo_ta}</div></div>
      <Icon ten="mui_ten" size={20} className="ml-auto shrink-0 opacity-60" />
    </Link>
  );
}
