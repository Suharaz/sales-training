import { nhanXetDiem } from "@/core/khung-ky-nang";
export function mauDiem(d: number): string { return d >= 80 ? "var(--xanh)" : d >= 65 ? "var(--vang)" : "var(--do)"; }
export function NhanDiem({ diem, nhoGon }: { diem: number | null | undefined; nhoGon?: boolean }) {
  if (diem == null) return <span className="nhan nhan-xam">Chưa có</span>;
  const lop = diem >= 80 ? "nhan-xanh" : diem >= 65 ? "nhan-vang" : "nhan-do";
  return <span className={`nhan ${lop} tabular`}>{diem}{!nhoGon && <span className="font-normal opacity-80">· {nhanXetDiem(diem)}</span>}</span>;
}
export function VongDiem({ diem, size = 64 }: { diem: number; size?: number }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--vien)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={mauDiem(diem)} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(c * diem) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size / 3.4} fontWeight={700} fill="var(--chu)">{diem}</text>
    </svg>
  );
}
export function ThanhTienDo({ phanTram, mau }: { phanTram: number; mau?: string }) {
  return <div className="thanh"><i style={{ width: `${Math.min(100, Math.max(0, phanTram))}%`, background: mau }} /></div>;
}
export function Sparkline({ diem, w = 90, h = 26 }: { diem: number[]; w?: number; h?: number }) {
  if (diem.length < 2) return <span className="text-xs" style={{ color: "var(--chu-nhat)" }}>—</span>;
  const pts = diem.map((d, i) => `${(i / (diem.length - 1)) * w},${h - (d / 100) * h}`).join(" ");
  const tang = diem[diem.length - 1] >= diem[0];
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={tang ? "var(--xanh)" : "var(--do)"} strokeWidth={1.8} strokeLinejoin="round" /></svg>;
}
