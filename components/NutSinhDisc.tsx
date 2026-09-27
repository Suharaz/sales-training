"use client";
// Sinh kịch bản DISC có tiến độ: gọi API từng nhóm, hiện «Đang sinh nhóm D (1/4)…», xong thì tải lại trang.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NHOM_DISC, TEN_DISC, type NhomDisc } from "@/core/disc";
export function NutSinhDisc({ sanPhamId, nhom, nho }: { sanPhamId: string; nhom: NhomDisc | "tat_ca"; nho?: boolean }) {
  const router = useRouter();
  const [tb, setTb] = useState(""); const [dang, setDang] = useState(false); const [loi, setLoi] = useState("");
  async function chay() {
    const ds: NhomDisc[] = nhom === "tat_ca" ? [...NHOM_DISC] : [nhom];
    setDang(true); setLoi("");
    try {
      for (let i = 0; i < ds.length; i++) {
        setTb(`AI đang viết kịch bản nhóm ${TEN_DISC[ds[i]]} (${i + 1}/${ds.length}) — khoảng 30 giây…`);
        const r = await fetch("/api/disc", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ san_pham_id: sanPhamId, nhom: ds[i] }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.loi || "Lỗi sinh");
      }
      setTb("Xong. Đang tải lại…"); router.push(`/kich-ban/disc?san_pham=${sanPhamId}&nhom=${ds[0]}&ok=${ds.length}`); router.refresh();
    } catch (e) { setLoi((e as Error).message); setDang(false); setTb(""); }
  }
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <button type="button" className={`nut ${nho ? "nut-nho" : "nut-chinh"}`} onClick={chay} disabled={dang} aria-busy={dang}>
        {dang ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="xoay"><path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" /></svg>{nhom === "tat_ca" ? "Đang sinh…" : "Đang sinh…"}</> : nhom === "tat_ca" ? "AI sinh trọn bộ 4 nhóm" : `AI sinh ${nho ? "lại " : ""}kịch bản nhóm ${nhom}`}
      </button>
      {tb && <span className="text-xs" style={{ color: "var(--chu-mo)" }}>{tb}</span>}{loi && <span className="text-xs" style={{ color: "var(--chu-do)" }}>{loi}</span>}
    </span>
  );
}
