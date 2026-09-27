// Khung xương khi trang đang tải (dùng trong loading.tsx của từng nhóm route).
export function KhungXuong({ kpi = 4, dong = 6 }: { kpi?: number; dong?: number }) {
  const o = { background: "var(--the-2)", borderRadius: 10 } as const;
  return (
    <div className="animate-pulse flex flex-col gap-4" aria-busy="true" aria-label="Đang tải">
      <div className="h-7 w-72" style={o} /><div className="h-4 w-96" style={{ ...o, opacity: .7 }} />
      <div className="luoi-kpi">{Array.from({ length: kpi }).map((_, i) => <div key={i} className="h-[92px]" style={o} />)}</div>
      <div className="the p-4 flex flex-col gap-3">{Array.from({ length: dong }).map((_, i) => <div key={i} className="h-5" style={{ ...o, width: `${90 - (i % 3) * 15}%` }} />)}</div>
    </div>
  );
}
export function TrangDangTai() {
  return <div className="min-h-screen flex"><aside className="an-mobile w-[232px] shrink-0 border-r" style={{ background: "var(--nen-2)", borderColor: "var(--vien)" }} /><div className="flex-1"><div className="h-14 border-b" style={{ borderColor: "var(--vien)", background: "var(--nen-2)" }} /><main className="p-4 md:p-6 max-w-[1400px] mx-auto"><KhungXuong /></main></div></div>;
}
