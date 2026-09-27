import { Icon } from "./Icon";
export function TheKpi({ ten, giaTri, phu, icon = "tia", mau = "var(--nhan)" }: { ten: string; giaTri: React.ReactNode; phu?: React.ReactNode; icon?: string; mau?: string }) {
  return (
    <div className="the p-4 flex gap-3 items-start">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, " + mau + " 18%, transparent)", color: mau }}><Icon ten={icon} size={18} /></div>
      <div className="min-w-0">
        <div className="text-xs font-medium" style={{ color: "var(--chu-mo)" }}>{ten}</div>
        <div className="text-2xl font-bold tabular leading-tight mt-0.5">{giaTri}</div>
        {phu && <div className="text-[11px] mt-0.5" style={{ color: "var(--chu-mo)" }}>{phu}</div>}
      </div>
    </div>
  );
}
