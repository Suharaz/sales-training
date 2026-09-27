"use client";
import Link from "next/link";
export default function LoiTrang({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="the p-8 text-center max-w-md">
        <div className="text-lg font-bold">Có lỗi xảy ra</div>
        <div className="mo-ta mt-1">{error.message || "Lỗi không xác định."}{error.digest && <span className="block text-[11px] mt-1">Mã: {error.digest}</span>}</div>
        <div className="flex gap-2 justify-center mt-4"><button type="button" className="nut nut-chinh" onClick={reset}>Thử lại</button><Link href="/" className="nut">Về tổng quan</Link></div>
      </div>
    </div>
  );
}
