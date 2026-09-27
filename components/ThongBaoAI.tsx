import { Icon } from "./Icon";
export function ThongBaoAI({ cheDo }: { cheDo: string | null | undefined }) {
  if (!cheDo || cheDo === "du_phong") return (
    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--vang-mo)", color: "var(--chu-vang)" }}>
      <Icon ten="canh_bao" size={14} /> Kết quả ở chế độ dự phòng (chấm theo luật, chưa có Claude). Bật AI ở Cài đặt để có nhận xét sâu.
    </div>
  );
  return <div className="flex items-center gap-2 text-xs" style={{ color: "var(--chu-mo)" }}><Icon ten="robot" size={14} /> Claude ({cheDo === "cli" ? "gói sub" : "API"})</div>;
}
