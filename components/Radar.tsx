// Radar 6 tiêu chí SVG tự dựng (mockup #62). Nhiều lớp: cá nhân / đội / top 20%.
import { KY_NANG, TEN_KY_NANG, type DiemKhung } from "@/core/khung-ky-nang";
export function Radar({ lop, size = 260 }: { lop: { ten: string; diem: DiemKhung; mau: string; dam?: boolean }[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 34;
  const goc = (i: number) => (Math.PI * 2 * i) / KY_NANG.length - Math.PI / 2;
  const diemToa = (i: number, v: number) => [cx + Math.cos(goc(i)) * r * (v / 100), cy + Math.sin(goc(i)) * r * (v / 100)];
  const vong = [25, 50, 75, 100];
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {vong.map((v) => <polygon key={v} points={KY_NANG.map((_, i) => diemToa(i, v).join(",")).join(" ")} fill="none" stroke="var(--vien)" strokeWidth={1} />)}
        {KY_NANG.map((_, i) => { const [x, y] = diemToa(i, 100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--vien)" strokeWidth={1} />; })}
        {lop.map((l, li) => (
          <g key={li}>
            <polygon points={KY_NANG.map((k, i) => diemToa(i, l.diem[k]).join(",")).join(" ")} fill={l.mau} fillOpacity={l.dam ? 0.28 : 0.08} stroke={l.mau} strokeWidth={l.dam ? 2.2 : 1.4} strokeDasharray={l.dam ? undefined : "4 3"} />
            {l.dam && KY_NANG.map((k, i) => { const [x, y] = diemToa(i, l.diem[k]); return <circle key={k} cx={x} cy={y} r={3.2} fill={l.mau} />; })}
          </g>
        ))}
        {KY_NANG.map((k, i) => { const [x, y] = diemToa(i, 122); const chinh = lop.find((l) => l.dam) ?? lop[0]; return (
          <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10.5} fill="var(--chu-mo)">
            <tspan x={x} dy={-6}>{TEN_KY_NANG[k]}</tspan>{chinh && <tspan x={x} dy={12} fontWeight={700} fill="var(--chu)">{chinh.diem[k]}</tspan>}
          </text>); })}
      </svg>
      <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--chu-mo)" }}>
        {lop.map((l, i) => <span key={i} className="flex items-center gap-1.5"><i className="inline-block w-3 h-[3px] rounded" style={{ background: l.mau }} />{l.ten}</span>)}
      </div>
    </div>
  );
}
