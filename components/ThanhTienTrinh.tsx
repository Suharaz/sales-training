"use client";
// Thanh tiến trình mảnh trên đầu trang khi chuyển trang (bắt click vào link nội bộ, tắt khi đường dẫn đổi).
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
export function ThanhTienTrinh() {
  const p = usePathname(); const sp = useSearchParams();
  const [dang, setDang] = useState(false);
  useEffect(() => { setDang(false); }, [p, sp]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a"); if (!a || e.metaKey || e.ctrlKey || a.target === "_blank") return;
      const href = a.getAttribute("href") || ""; if (!href.startsWith("/") || href === window.location.pathname + window.location.search) return;
      setDang(true);
    };
    const f = (e: SubmitEvent) => { const form = e.target as HTMLFormElement; if (form && form.method !== "dialog") setDang(true); };
    document.addEventListener("click", h, true); document.addEventListener("submit", f, true);
    return () => { document.removeEventListener("click", h, true); document.removeEventListener("submit", f, true); };
  }, []);
  return <div aria-hidden className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none" style={{ opacity: dang ? 1 : 0, transition: "opacity .2s" }}><div className="h-full" style={{ background: "var(--gradient-cta)", width: dang ? "85%" : "0%", transition: dang ? "width 6s cubic-bezier(.1,.7,.2,1)" : "none" }} /></div>;
}
