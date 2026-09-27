"use client";
// Nút submit biết trạng thái chờ của server action: hiện vòng xoay + chữ đang làm gì, khóa nút để không bấm đôi.
import { useFormStatus } from "react-dom";
export function NutCho({ children, dangLam, className = "nut nut-chinh", name, value }: { children: React.ReactNode; dangLam: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="xoay"><path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" /></svg>{dangLam}</> : children}
    </button>
  );
}
