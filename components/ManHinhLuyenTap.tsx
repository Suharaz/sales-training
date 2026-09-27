"use client";
// Màn hình gọi role-play (bám mockup #63): trái = hồ sơ khách, giữa = hội thoại, phải = copilot (kịch bản + kho phản đối).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LuotHoiThoai, LuotKhach, Persona } from "@/core/ai-kieu";
import { Icon } from "./Icon";
import { doanLoaiPhanDoi } from "@/core/phan-doi";
import { danhSachGiongViet, docVanBan, docTuDong, dungDoc, giongDaChon, luuGiong, luuTocDo, tocDoDaChon, cauHinhGiong, batNghe as batNgheHopNhat, type GiongNoi, type BoNghe, type CauHinhGiongClient } from "@/core/giong-noi";

type KichBan = { ten: string; mo_dau: string; khai_thac: string; gia_tri: string; chot: string };
type PD = { loai: string; ten: string; noi_dung: string; cau_tra_loi_chuan: string };
export function ManHinhLuyenTap({ phienId, persona, lichSuBanDau, cuaToi, kichBan, khoPhanDoi }: { phienId: string; persona: Persona; lichSuBanDau: LuotHoiThoai[]; cuaToi: boolean; kichBan: KichBan | null; khoPhanDoi: PD[] }) {
  const router = useRouter();
  const [lichSu, setLichSu] = useState<LuotHoiThoai[]>(lichSuBanDau);
  const [tin, setTin] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [dangCham, setDangCham] = useState(false);
  const [loi, setLoi] = useState("");
  const [khachCuoi, setKhachCuoi] = useState<LuotKhach | null>(null);
  const [tab, setTab] = useState<"kich_ban" | "phan_doi">("kich_ban");
  const [giay, setGiay] = useState(0);
  const [giongNoi, setGiongNoi] = useState(false);
  const [dangNghe, setDangNghe] = useState(false);
  const [hoTroNghe, setHoTroNghe] = useState(false);
  const [cheDoGoi, setCheDoGoi] = useState(false);           // «Gọi bằng giọng»: tự nghe → tự gửi → khách nói → nghe tiếp
  const [trangThaiGoi, setTrangThaiGoi] = useState<"nghe" | "nghi" | "khach_noi" | "tat">("tat");
  const [chGiong, setChGiong] = useState<CauHinhGiongClient | null>(null);
  const boNghe = useRef<BoNghe | null>(null);
  const henGui = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tinRef = useRef(""); 
  const nhanDang = useRef<{ stop(): void } | null>(null);
  useEffect(() => { const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }; setHoTroNghe(!!(w.SpeechRecognition || w.webkitSpeechRecognition)); try { setGiongNoi(localStorage.getItem("st_giong_noi") === "1"); } catch { /* bỏ qua */ } cauHinhGiong().then(setChGiong); }, []);
  const [giongs, setGiongs] = useState<GiongNoi[]>([]);
  const [giong, setGiong] = useState<string | null>(null);
  const [tocDo, setTocDo] = useState(1);
  const [moCaiDat, setMoCaiDat] = useState(false);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const nap = () => { const ds = danhSachGiongViet(); setGiongs(ds); setGiong((g) => g ?? giongDaChon() ?? ds[0]?.name ?? null); };
    nap(); speechSynthesis.addEventListener?.("voiceschanged", nap); setTocDo(tocDoDaChon());
    return () => speechSynthesis.removeEventListener?.("voiceschanged", nap);
  }, []);
  function docKhach(text: string, saoXong?: () => void) {
    if (!giongNoi && !cheDoGoi) { saoXong?.(); return; }
    setTrangThaiGoi("khach_noi");
    docTuDong(text, { giong, tocDo, onXong: () => { setTrangThaiGoi((t) => (t === "khach_noi" ? "nghe" : t)); saoXong?.(); } });
  }
  // ---- Chế độ gọi bằng giọng ----
  async function batCheDoGoi() {
    setLoi("");
    try {
      const { bo, nha } = await batNgheHopNhat({
        onTam: (t) => { tinRef.current = t; setTin(t); },
        onXong: (t) => { tinRef.current = (tinRef.current && !t.startsWith(tinRef.current) ? tinRef.current + " " : "") ; setTin(t); if (henGui.current) clearTimeout(henGui.current); henGui.current = setTimeout(() => guiGiong(t), 900); },
        onBatDauNoi: () => { dungDoc(); setTrangThaiGoi("nghe"); },
        onLoi: (m) => setLoi(m),
      });
      boNghe.current = bo; setCheDoGoi(true); setGiongNoi(true); setTrangThaiGoi("nghe");
      setLoi(nha === "trinh_duyet" && chGiong?.stt === "azure" ? "Azure STT không khả dụng, đang dùng trình duyệt." : "");
    } catch (e) { setLoi((e as Error).message); }
  }
  function tatCheDoGoi() { boNghe.current?.dung(); boNghe.current = null; if (henGui.current) clearTimeout(henGui.current); setCheDoGoi(false); setTrangThaiGoi("tat"); dungDoc(); }
  async function guiGiong(t: string) {
    const text = t.trim(); if (!text || dangGui) return;
    setTrangThaiGoi("nghi"); setTin(""); tinRef.current = "";
    setDangGui(true); setLoi("");
    setLichSu((ls) => [...ls, { vai: "sale", noi_dung: text, luc: new Date().toISOString() }]);
    try {
      const r = await fetch(`/api/luyen-tap/${phienId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hanh_dong: "luot", tin_nhan: text }) });
      const j = (await r.json()) as { khach?: LuotKhach; lichSu?: LuotHoiThoai[]; loi?: string };
      if (!r.ok || !j.khach) throw new Error(j.loi || "Lỗi gửi");
      setLichSu(j.lichSu!); setKhachCuoi(j.khach); docKhach(j.khach.noi_dung);
    } catch (e) { setLoi((e as Error).message); setLichSu((ls) => ls.slice(0, -1)); setTrangThaiGoi("nghe"); }
    finally { setDangGui(false); }
  }
  useEffect(() => () => { boNghe.current?.dung(); dungDoc(); }, []);
  function batNghe() {
    const w = window as unknown as { SpeechRecognition?: new () => { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }; webkitSpeechRecognition?: never };
    const C = w.SpeechRecognition || (w as { webkitSpeechRecognition?: typeof w.SpeechRecognition }).webkitSpeechRecognition; if (!C) return;
    if (dangNghe) { nhanDang.current?.stop(); setDangNghe(false); return; }
    dungDoc();
    const r = new C(); r.lang = "vi-VN"; r.interimResults = true; r.continuous = true;
    let goc = tin;
    r.onresult = (e) => { let cuoi = "", tam = ""; for (let i = 0; i < e.results.length; i++) { const k = e.results[i]; if (k.isFinal) cuoi += k[0].transcript + " "; else tam += k[0].transcript; } setTin((goc ? goc + " " : "") + cuoi + tam); };
    r.onend = () => setDangNghe(false); r.onerror = () => setDangNghe(false);
    nhanDang.current = r; setDangNghe(true); r.start();
  }
  const cuoiRef = useRef<HTMLDivElement>(null);
  const oRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = setInterval(() => setGiay((g) => g + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { cuoiRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lichSu, dangGui]);
  const soLuotSale = lichSu.filter((l) => l.vai === "sale").length;
  const phanDoiHienTai = khachCuoi?.phan_doi_dang_neu ?? (lichSu.length ? (() => { const k = [...lichSu].reverse().find((l) => l.vai === "khach"); const d = k ? doanLoaiPhanDoi(k.noi_dung) : "khac"; return d === "khac" ? null : d; })() : null);
  const goiY = phanDoiHienTai ? khoPhanDoi.filter((p) => p.loai === phanDoiHienTai) : [];

  async function gui() {
    const t = tin.trim(); if (!t || dangGui) return;
    if (dangNghe) { nhanDang.current?.stop(); setDangNghe(false); }
    setDangGui(true); setLoi(""); setTin("");
    setLichSu((ls) => [...ls, { vai: "sale", noi_dung: t, luc: new Date().toISOString() }]);
    try {
      const r = await fetch(`/api/luyen-tap/${phienId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hanh_dong: "luot", tin_nhan: t }) });
      const j = (await r.json()) as { khach?: LuotKhach; lichSu?: LuotHoiThoai[]; loi?: string };
      if (!r.ok || !j.khach) throw new Error(j.loi || "Lỗi gửi");
      setLichSu(j.lichSu!); setKhachCuoi(j.khach); docKhach(j.khach.noi_dung);
    } catch (e) { setLoi((e as Error).message); setLichSu((ls) => ls.slice(0, -1)); setTin(t); }
    finally { setDangGui(false); setTimeout(() => oRef.current?.focus(), 50); }
  }
  async function ketThuc() {
    if (dangCham) return;
    if (soLuotSale < 2) { setLoi("Cần ít nhất 2 lượt nói của bạn để AI chấm."); return; }
    setDangCham(true); setLoi("");
    try {
      const r = await fetch(`/api/luyen-tap/${phienId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hanh_dong: "ket_thuc" }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.loi || "Lỗi chấm");
      router.refresh();
    } catch (e) { setLoi((e as Error).message); setDangCham(false); }
  }
  async function huy() {
    if (!confirm("Hủy phiên này? Sẽ không được chấm điểm.")) return;
    await fetch(`/api/luyen-tap/${phienId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hanh_dong: "huy" }) });
    router.push("/luyen-tap"); router.refresh();
  }
  const mm = String(Math.floor(giay / 60)).padStart(2, "0"), ss = String(giay % 60).padStart(2, "0");
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_300px]">
      <aside className="the p-4 flex flex-col gap-3 text-sm order-2 lg:order-1">
        <div className="font-semibold flex items-center gap-2"><Icon ten="nhan_vien" size={16} />Hồ sơ khách 360°</div>
        <div><div className="text-base font-bold">{persona.ten}</div><div style={{ color: "var(--chu-mo)" }}>{persona.chuc_danh} · {persona.cong_ty}</div></div>
        <Muc ten="Bối cảnh">{persona.boi_canh}</Muc>
        <Muc ten="Mục tiêu">{persona.muc_tieu}</Muc>
        <Muc ten="Nỗi đau">{persona.noi_dau}</Muc>
        <Muc ten="Ngân sách">{persona.ngan_sach}</Muc>
        <Muc ten="Tính cách">{persona.tinh_cach}</Muc>
        <div className="text-[11px] p-2 rounded-lg" style={{ background: "var(--the-2)", color: "var(--chu-mo)" }}>Phản đối khách sẽ nêu được ẩn đi — hãy khai thác để phát hiện.</div>
      </aside>
      <section className="the flex flex-col order-1 lg:order-2" style={{ minHeight: 560 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--vien)" }}>
          <div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full" style={{ background: dangGui || trangThaiGoi === "nghi" ? "var(--vang)" : trangThaiGoi === "khach_noi" ? "var(--tim)" : "var(--xanh)", boxShadow: "0 0 0 4px " + (dangGui ? "var(--vang-mo)" : trangThaiGoi === "khach_noi" ? "var(--tim-mo)" : "var(--xanh-mo)") }} /><span className="font-semibold tabular">{mm}:{ss}</span><span className="text-xs" style={{ color: "var(--chu-mo)" }}>{dangGui || trangThaiGoi === "nghi" ? "Khách đang suy nghĩ…" : trangThaiGoi === "khach_noi" ? "Khách đang nói (nói chen để ngắt)" : cheDoGoi ? "🎙 Đang nghe bạn — nói xong ngừng 1 giây là gửi" : "Đang gọi"}</span>{chGiong && chGiong.tts !== "trinh_duyet" && <span className="nhan nhan-ngoc">{chGiong.tts === "elevenlabs" ? "ElevenLabs" : "Azure"} giọng</span>}</div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--chu-mo)" }}>{khachCuoi && <span className={`nhan ${khachCuoi.cam_xuc === "tich_cuc" ? "nhan-xanh" : khachCuoi.cam_xuc === "tieu_cuc" ? "nhan-do" : "nhan-xam"}`}>Sẵn sàng chốt {khachCuoi.san_sang_chot}%</span>}<span>{soLuotSale} lượt</span>
            <button type="button" className={`nut nut-nho ${giongNoi ? "nut-chinh" : ""}`} title="Khách nói thành tiếng" onClick={() => { const m = !giongNoi; setGiongNoi(m); try { localStorage.setItem("st_giong_noi", m ? "1" : "0"); } catch { /* bỏ qua */ } if (!m) dungDoc(); }}>🔊 {giongNoi ? "Loa bật" : "Loa tắt"}</button>
            <button type="button" className="nut nut-nho" title="Chọn giọng đọc" onClick={() => setMoCaiDat((x) => !x)}>Giọng</button>
            {cuaToi && !khachCuoi?.ket_thuc && (cheDoGoi ? <button type="button" className="nut nut-nho nut-nguy" onClick={tatCheDoGoi}>⏹ Tắt gọi bằng giọng</button> : <button type="button" className="nut nut-nho nut-chinh" onClick={batCheDoGoi} title="Nói vào mic, khách trả lời bằng giọng, không cần gõ">📞 Gọi bằng giọng</button>)}</div>
        </div>
        {moCaiDat && (
          <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2 text-xs" style={{ borderColor: "var(--vien)", background: "var(--the-2)" }}>
            <span className="font-semibold">Giọng khách:</span>
            <select className="o-nhap w-64 py-1" value={giong ?? ""} onChange={(e) => { setGiong(e.target.value); luuGiong(e.target.value); }}>{giongs.length === 0 && <option value="">(Trình duyệt chưa có giọng tiếng Việt)</option>}{giongs.map((g) => <option key={g.name} value={g.name}>{g.name}{g.diem >= 10 ? " ★ tự nhiên" : ""}</option>)}</select>
            <label className="flex items-center gap-1">Tốc độ <input type="range" min={0.8} max={1.3} step={0.05} value={tocDo} onChange={(e) => { const v = Number(e.target.value); setTocDo(v); luuTocDo(v); }} /> {tocDo.toFixed(2)}</label>
            <button type="button" className="nut nut-nho" onClick={() => docVanBan(`Chào bạn, mình là ${persona.ten}. Mình đang tìm giải pháp cho ${persona.cong_ty}, bạn tư vấn giúp mình nhé.`, { giong, tocDo })}>Nghe thử</button>
            <span style={{ color: "var(--chu-nhat)" }}>{chGiong && chGiong.tts !== "trinh_duyet" ? `Workspace đang dùng giọng ${chGiong.tts === "elevenlabs" ? "ElevenLabs" : "Azure"} (đám mây); lựa chọn ở đây chỉ dùng khi đám mây lỗi.` : <>Giọng trình duyệt là giọng máy. Muốn giọng thật tự nhiên: quản lý vào <a href="/cai-dat/giong-noi" style={{ color: "var(--nhan-sang)" }}>Cài đặt → Giọng nói AI</a> kết nối ElevenLabs hoặc Azure.</>}</span>
          </div>)}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 520 }}>
          {lichSu.length === 0 && <div className="text-center text-sm py-8" style={{ color: "var(--chu-mo)" }}>Khách vừa nghe máy. Hãy mở lời trước — giới thiệu ngắn và đặt một câu hỏi mở.</div>}
          {lichSu.map((l, i) => <div key={i} className={`bong-chat ${l.vai === "sale" ? "bong-sale" : "bong-khach"}`}><div className="text-[10px] opacity-70 mb-0.5">{l.vai === "sale" ? "Bạn" : persona.ten}</div>{l.noi_dung}</div>)}
          {dangGui && <div className="bong-chat bong-khach cham-nhay"><span /><span /><span /></div>}
          {khachCuoi?.ket_thuc && <div className="text-center text-xs px-3 py-2 rounded-lg" style={{ background: "var(--xanh-mo)", color: "var(--chu-xanh)" }}>Khách đã kết thúc cuộc gọi. Bấm «Kết thúc & chấm điểm».</div>}
          <div ref={cuoiRef} />
        </div>
        {loi && <div className="mx-4 mb-2 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
        {cuaToi ? (
          <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--vien)" }}>
            <textarea ref={oRef} className="o-nhap" rows={2} placeholder={cheDoGoi ? "Đang nghe micro… (vẫn có thể gõ)" : "Nói với khách… (Enter để gửi, Shift+Enter xuống dòng)"} value={tin} onChange={(e) => setTin(e.target.value)} disabled={dangGui || dangCham || !!khachCuoi?.ket_thuc}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gui(); } }} autoFocus />
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2"><button type="button" className="nut nut-nho" onClick={huy} disabled={dangCham}>Hủy phiên</button>{hoTroNghe && <button type="button" className={`nut nut-nho ${dangNghe ? "nut-nguy" : ""}`} onClick={batNghe} disabled={dangGui || dangCham || !!khachCuoi?.ket_thuc} title="Nói thay vì gõ (Chrome/Edge)">🎙 {dangNghe ? "Đang nghe… bấm để dừng" : "Nói"}</button>}</div>
              <div className="flex gap-2">
                <button type="button" className="nut" onClick={ketThuc} disabled={dangCham || dangGui}>{dangCham ? "AI đang chấm…" : "Kết thúc & chấm điểm"}</button>
                <button type="button" className="nut nut-chinh" onClick={gui} disabled={dangGui || dangCham || !tin.trim() || !!khachCuoi?.ket_thuc}><Icon ten="mui_ten" size={16} />Gửi</button>
              </div>
            </div>
          </div>
        ) : <div className="p-3 border-t text-xs text-center" style={{ borderColor: "var(--vien)", color: "var(--chu-mo)" }}>Bạn đang xem phiên của người khác.</div>}
      </section>
      <aside className="the p-4 flex flex-col gap-3 text-sm order-3">
        <div className="font-semibold flex items-center gap-2"><Icon ten="robot" size={16} />Copilot <span className="nhan nhan-tim">BETA</span></div>
        {goiY.length > 0 && (
          <div className="the-2 p-3" style={{ borderColor: "var(--vang)" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--chu-vang)" }}>Khách đang phản đối: {goiY[0].ten}</div>
            {goiY.slice(0, 1).map((g, i) => <div key={i}><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Câu trả lời chuẩn</div><div className="text-[13px] mt-1">{g.cau_tra_loi_chuan}</div><button type="button" className="nut nut-nho mt-2" onClick={() => setTin(g.cau_tra_loi_chuan)}>Dùng làm nháp</button></div>)}
          </div>)}
        <div className="flex gap-1">{(["kich_ban", "phan_doi"] as const).map((t) => <button key={t} type="button" className={`nut nut-nho ${tab === t ? "nut-chinh" : ""}`} onClick={() => setTab(t)}>{t === "kich_ban" ? "Kịch bản" : "Kho phản đối"}</button>)}</div>
        {tab === "kich_ban" ? (kichBan ? (
          <div className="flex flex-col gap-2 text-[13px]"><div className="text-xs font-semibold" style={{ color: "var(--chu-mo)" }}>{kichBan.ten}</div>
            {[["Mở đầu", kichBan.mo_dau], ["Khai thác", kichBan.khai_thac], ["Giá trị", kichBan.gia_tri], ["Chốt", kichBan.chot]].map(([t, n]) => <details key={t} className="the-2 p-2" open={t === "Mở đầu" && soLuotSale === 0}><summary className="cursor-pointer font-semibold text-xs">{t}</summary><div className="mt-1 whitespace-pre-wrap" style={{ color: "var(--chu-mo)" }}>{n}</div></details>)}
          </div>) : <div className="mo-ta">Chưa có kịch bản cho sản phẩm này.</div>) : (
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">{khoPhanDoi.map((p, i) => <details key={i} className="the-2 p-2 text-[13px]"><summary className="cursor-pointer"><span className="nhan nhan-xam mr-1">{p.ten}</span>{p.noi_dung}</summary><div className="mt-1" style={{ color: "var(--chu-mo)" }}>{p.cau_tra_loi_chuan}</div></details>)}</div>)}
      </aside>
    </div>
  );
}
function Muc({ ten, children }: { ten: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--chu-nhat)" }}>{ten}</div><div className="text-[13px]">{children}</div></div>;
}
