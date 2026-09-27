"use client";
import { useState } from "react";
import { Icon } from "./Icon";
export function NutChungChi({ ma, tieuDe }: { ma: string; tieuDe: string }) {
  const [daChep, setDaChep] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/chung-chi/${ma}` : `/chung-chi/${ma}`;
  const chep = async () => { try { await navigator.clipboard.writeText(url); setDaChep(true); setTimeout(() => setDaChep(false), 1500); } catch { /* bỏ qua */ } };
  return (
    <div className="flex flex-wrap gap-2 khong-in">
      <button type="button" className="nut nut-nho" onClick={() => window.print()}>In / lưu PDF</button>
      <button type="button" className="nut nut-nho" onClick={chep}><Icon ten="check" size={14} />{daChep ? "Đã chép link" : "Chép link xác thực"}</button>
      <a className="nut nut-nho" target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Chia sẻ Facebook</a>
      <a className="nut nut-nho" target="_blank" rel="noreferrer" href={`https://zalo.me/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(tieuDe)}`}>Chia sẻ Zalo</a>
    </div>
  );
}
