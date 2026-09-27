"use client";
// CUỘC GỌI TRỰC TIẾP với AI Copilot (mockup #63): trình duyệt nghe cuộc gọi (loa ngoài), chuyển thành transcript theo người nói;
// Lớp 0 tức thì (client): bắt phản đối bằng từ khóa → câu trả lời chuẩn, cảnh báo tuân thủ bằng luật.
// Lớp 1 (AI nhanh, vài giây): sau mỗi câu khách nói xong → gợi ý câu nên nói, câu hỏi nên hỏi, tín hiệu chốt. Có thể đọc gợi ý vào tai nghe.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { doanLoaiPhanDoi, TEN_LOAI_PHAN_DOI, type LoaiPhanDoi } from "@/core/phan-doi";
import type { GoiYCopilot } from "@/core/ai-kieu";
import { docTuDong, dungDoc, batNghe, cauHinhGiong, type BoNghe, type CauHinhGiongClient } from "@/core/giong-noi";
import { DISC, doanDisc } from "@/core/disc";
type Dong = { vai: "sale" | "khach"; text: string; luc: number };
type PD = { loai: LoaiPhanDoi; noi_dung: string; cau_tra_loi_chuan: string };
type KB = { ten: string; mo_dau: string; khai_thac: string; gia_tri: string; chot: string } | null;
const CAM = [/cam kết 100/i, /chắc chắn (?:thành công|có lãi|x\d)/i, /đảm bảo (?:kết quả|lợi nhuận|doanh thu)/i, /không thể thất bại/i, /bên kia (?:lừa|dở|tệ)/i, /rẻ nhất thị trường/i];

export function CuocGoiTrucTiep({ sanPham, kichBan, khoPhanDoi, tenSale, cheDoAI }: { sanPham: { id: string; ten: string }[]; kichBan: Record<string, KB>; khoPhanDoi: PD[]; tenSale: string; cheDoAI: string }) {
  const router = useRouter();
  const [hoTro, setHoTro] = useState<boolean | null>(null);
  const [dang, setDang] = useState(false);
  const [vai, setVai] = useState<"sale" | "khach">("sale");
  const [dong, setDong] = useState<Dong[]>([]);
  const [tam, setTam] = useState("");
  const [giay, setGiay] = useState(0);
  const [loi, setLoi] = useState("");
  const [dangNap, setDangNap] = useState(false);
  const [tenKhach, setTenKhach] = useState("");
  const [spId, setSpId] = useState(sanPham[0]?.id ?? "");
  const [ketQua, setKetQua] = useState("hen");
  const [goiY, setGoiY] = useState<GoiYCopilot | null>(null);
  const [dangHoi, setDangHoi] = useState(false);
  const [cheDoGoiY, setCheDoGoiY] = useState("");
  const [tuDong, setTuDong] = useState(true);
  const [docGoiY, setDocGoiY] = useState(false);
  const [ghiChu, setGhiChu] = useState("");
  const [tab, setTab] = useState<"kich_ban" | "phan_doi">("kich_ban");
  const vaiRef = useRef(vai); vaiRef.current = vai;
  const dangRef = useRef(false);
  const dongRef = useRef<Dong[]>([]); dongRef.current = dong;
  const hoiRef = useRef<AbortController | null>(null);
  const henRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cuoiRef = useRef<HTMLDivElement>(null);
  const spRef = useRef(spId); spRef.current = spId;
  const docRef = useRef(docGoiY); docRef.current = docGoiY;

  useEffect(() => { const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }; cauHinhGiong().then((c) => setHoTro(c.stt === "azure" || !!(w.SpeechRecognition || w.webkitSpeechRecognition))); }, []);
  useEffect(() => { if (!dang) return; const t = setInterval(() => setGiay((g) => g + 1), 1000); return () => clearInterval(t); }, [dang]);
  useEffect(() => { cuoiRef.current?.scrollIntoView({ behavior: "smooth" }); }, [dong, tam]);
  // Phím cách: đổi người nói (khi không gõ ô nhập)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) { e.preventDefault(); setVai((v) => (v === "sale" ? "khach" : "sale")); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const hoiAI = useCallback(async (lyDo: string) => {
    const ds = dongRef.current; if (ds.length === 0) return;
    hoiRef.current?.abort(); const ac = new AbortController(); hoiRef.current = ac;
    setDangHoi(true);
    try {
      const r = await fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, signal: ac.signal, body: JSON.stringify({ luot: ds.map((d) => ({ vai: d.vai, noi_dung: d.text, luc: "" })), san_pham_id: spRef.current || null }) });
      const j = (await r.json()) as { goiY?: GoiYCopilot; cheDo?: string; loi?: string };
      if (!r.ok || !j.goiY) throw new Error(j.loi || "Lỗi copilot");
      setGoiY(j.goiY); setCheDoGoiY(`${j.cheDo === "du_phong" ? "luật" : j.cheDo === "cli" ? "Claude CLI" : "Claude API"} · ${lyDo}`);
      if (docRef.current && j.goiY.noi_tiep) docTuDong(j.goiY.noi_tiep, { tocDo: 1.15 });
    } catch (e) { if ((e as Error).name !== "AbortError") setLoi((e as Error).message); }
    finally { if (hoiRef.current === ac) setDangHoi(false); }
  }, []);
  // Tự hỏi AI 1,2 giây sau khi KHÁCH nói xong một câu (gộp nhiều câu liên tiếp)
  const henHoi = useCallback(() => { if (!tuDong) return; if (henRef.current) clearTimeout(henRef.current); henRef.current = setTimeout(() => hoiAI("khách vừa nói"), 1200); }, [hoiAI, tuDong]);

  const boNghe = useRef<BoNghe | null>(null);
  const [chGiong, setChGiong] = useState<CauHinhGiongClient | null>(null);
  const [nhaNghe, setNhaNghe] = useState<"azure" | "trinh_duyet" | null>(null);
  useEffect(() => { cauHinhGiong().then(setChGiong); }, []);
  async function batDau() {
    setLoi("");
    try {
      const { bo, nha } = await batNghe({
        onTam: (t) => setTam(t),
        onXong: (t) => {
          const v = vaiRef.current;
          setDong((d) => { const cuoi = d[d.length - 1]; return cuoi && cuoi.vai === v && Date.now() - cuoi.luc < 8000 ? [...d.slice(0, -1), { ...cuoi, text: `${cuoi.text} ${t}`, luc: Date.now() }] : [...d, { vai: v, text: t, luc: Date.now() }]; });
          setTam(""); if (v === "khach") setTimeout(henHoi, 0);
        },
        onLoi: (m) => setLoi(m),
      });
      boNghe.current = bo; setNhaNghe(nha); dangRef.current = true; setDang(true);
    } catch (e) { setLoi((e as Error).message); }
  }
  function dung() { dangRef.current = false; setDang(false); boNghe.current?.dung(); boNghe.current = null; setTam(""); }
  function doiVaiDong(i: number) { setDong((d) => d.map((x, k) => (k === i ? { ...x, vai: x.vai === "sale" ? "khach" : "sale" } : x))); }

  // Lớp 0: phản đối tức thì + cảnh báo tuân thủ tức thì (không chờ AI)
  const khachCuoi = [...dong].reverse().find((d) => d.vai === "khach");
  const loaiTucThi = khachCuoi ? doanLoaiPhanDoi(khachCuoi.text) : "khac";
  const chuanTucThi = loaiTucThi !== "khac" ? khoPhanDoi.find((p) => p.loai === loaiTucThi) : undefined;
  const saleCuoi = [...dong].reverse().find((d) => d.vai === "sale");
  const discTucThi = doanDisc(dong.filter((d) => d.vai === "khach").map((d) => d.text));
  const discHien = goiY?.disc_doan ?? (discTucThi ? { nhom: discTucThi.nhom, tin_cay: discTucThi.tinCay, chinh_cach_noi: DISC[discTucThi.nhom].nen[0] } : null);
  const camTucThi = saleCuoi ? CAM.filter((r) => r.test(saleCuoi.text)).length > 0 : false;
  const kb = kichBan[spId] ?? null;
  const transcript = dong.map((d) => `${d.vai === "sale" ? tenSale : "Khách"}: ${d.text}`).join("\n");
  async function nap() {
    if (dang) dung(); dungDoc();
    if (dong.filter((d) => d.vai === "sale").length === 0 || dong.filter((d) => d.vai === "khach").length === 0) { setLoi("Cần có cả lượt của bạn và lượt của khách. Bấm «Khách nói» (hoặc phím cách) khi đến lượt khách."); return; }
    setDangNap(true); setLoi("");
    try {
      const r = await fetch("/api/cuoc-goi", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transcript: transcript + (ghiChu.trim() ? `\n${tenSale} (ghi chú sau gọi): ${ghiChu.trim()}` : ""), ten_khach: tenKhach, san_pham_id: spId || null, ket_qua: ketQua, thoi_luong_giay: giay }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.loi || "Lỗi nạp");
      router.push(`/cuoc-goi/${j.id}`);
    } catch (e) { setLoi((e as Error).message); setDangNap(false); }
  }
  const mm = String(Math.floor(giay / 60)).padStart(2, "0"), ss = String(giay % 60).padStart(2, "0");
  if (hoTro === false) return <div className="the p-6 thong-bao thong-bao-vang">Trình duyệt này không hỗ trợ nhận dạng giọng nói. Dùng <b>Chrome</b> hoặc <b>Edge</b>, hoặc nhờ quản lý kết nối <a href="/cai-dat/giong-noi" style={{ color: "var(--nhan-sang)" }}>Azure Speech</a> để chạy trên mọi trình duyệt, hoặc dán transcript ở trang «Nạp transcript».</div>;
  return (
    <div className="grid gap-4 lg:grid-cols-[270px_1fr_340px]">
      {/* Trái: ngữ cảnh */}
      <aside className="the p-4 flex flex-col gap-3 text-sm order-2 lg:order-1">
        <div className="font-semibold">Ngữ cảnh cuộc gọi</div>
        <label className="flex flex-col gap-1 text-xs"><span className="font-medium">Khách / công ty</span><input className="o-nhap" value={tenKhach} onChange={(e) => setTenKhach(e.target.value)} placeholder="Cty ABC — anh A" /></label>
        <label className="flex flex-col gap-1 text-xs"><span className="font-medium">Sản phẩm đang bán</span><select className="o-nhap" value={spId} onChange={(e) => setSpId(e.target.value)}>{sanPham.map((s) => <option key={s.id} value={s.id}>{s.ten}</option>)}<option value="">(Chưa rõ)</option></select></label>
        <div className="flex gap-1">{(["kich_ban", "phan_doi"] as const).map((t) => <button key={t} type="button" className={`nut nut-nho ${tab === t ? "nut-chinh" : ""}`} onClick={() => setTab(t)}>{t === "kich_ban" ? "Kịch bản" : "Kho phản đối"}</button>)}</div>
        {tab === "kich_ban" ? (kb ? <div className="flex flex-col gap-1.5 text-[13px]">{[["Mở đầu", kb.mo_dau], ["Khai thác", kb.khai_thac], ["Giá trị", kb.gia_tri], ["Chốt", kb.chot]].map(([t, n]) => <details key={t} className="the-2 p-2" open={t === "Mở đầu" && dong.length === 0}><summary className="cursor-pointer font-semibold text-xs">{t}</summary><div className="mt-1 whitespace-pre-wrap" style={{ color: "var(--chu-mo)" }}>{n}</div></details>)}</div> : <div className="mo-ta">Chưa có kịch bản cho sản phẩm này.</div>)
          : <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">{khoPhanDoi.map((p, i) => <details key={i} className="the-2 p-2 text-[13px]"><summary className="cursor-pointer"><span className="nhan nhan-xam mr-1">{TEN_LOAI_PHAN_DOI[p.loai]}</span>{p.noi_dung}</summary><div className="mt-1" style={{ color: "var(--chu-mo)" }}>{p.cau_tra_loi_chuan}</div></details>)}</div>}
      </aside>
      {/* Giữa: transcript */}
      <section className="the flex flex-col order-1 lg:order-2" style={{ minHeight: 560 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--vien)" }}>
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{ background: dang ? "var(--do)" : "var(--chu-nhat)", boxShadow: dang ? "0 0 0 5px var(--do-mo)" : undefined }} /><span className="font-semibold tabular text-lg">{mm}:{ss}</span><span className="text-xs" style={{ color: "var(--chu-mo)" }}>{dang ? `AI đang lắng nghe… (${nhaNghe === "azure" ? "Azure STT" : "trình duyệt"})` : "Chưa ghi"}</span>{chGiong?.stt === "trinh_duyet" && <a href="/cai-dat/giong-noi" className="text-[11px]" style={{ color: "var(--nhan-sang)" }}>Nhận dạng chính xác hơn với Azure →</a>}</div>
          <div className="flex gap-2">{!dang ? <button type="button" className="nut nut-chinh" onClick={batDau} disabled={dangNap}><Icon ten="cuoc_goi" size={16} />{dong.length ? "Ghi tiếp" : "Bắt đầu cuộc gọi"}</button> : <button type="button" className="nut nut-nguy" onClick={dung}>Tạm dừng</button>}</div>
        </div>
        <div className="flex gap-2 p-3 border-b" style={{ borderColor: "var(--vien)" }}><button type="button" className={`nut flex-1 justify-center ${vai === "sale" ? "nut-chinh" : ""}`} onClick={() => setVai("sale")}>🎧 Tôi nói ({tenSale.split(" ").slice(-1)[0]})</button><button type="button" className={`nut flex-1 justify-center ${vai === "khach" ? "nut-chinh" : ""}`} onClick={() => setVai("khach")}>🗣 Khách nói</button><span className="text-[11px] self-center" style={{ color: "var(--chu-nhat)" }}>phím cách để đổi</span></div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ maxHeight: 460 }}>
          {dong.length === 0 && !tam && <div className="text-center text-sm py-10" style={{ color: "var(--chu-mo)" }}>Bật loa ngoài điện thoại cạnh máy tính rồi bấm «Bắt đầu cuộc gọi». Khi khách nói, bấm «Khách nói» hoặc phím cách. Bấm vào một câu để đổi người nói nếu nhận nhầm.</div>}
          {dong.map((d, i) => <button type="button" key={i} onClick={() => doiVaiDong(i)} title="Bấm để đổi người nói" className={`bong-chat text-left ${d.vai === "sale" ? "bong-sale" : "bong-khach"}`}><div className="text-[10px] opacity-70 mb-0.5">{d.vai === "sale" ? tenSale : "Khách"}</div>{d.text}</button>)}
          {tam && <div className={`bong-chat ${vai === "sale" ? "bong-sale" : "bong-khach"} opacity-60`}>{tam}</div>}
          <div ref={cuoiRef} />
        </div>
        {loi && <div className="mx-4 mb-2 thong-bao thong-bao-do">{loi}</div>}
        <div className="p-3 border-t grid gap-2 md:grid-cols-[1fr_auto_auto] items-end" style={{ borderColor: "var(--vien)" }}>
          <input className="o-nhap" placeholder="Ghi chú nhanh sau cuộc gọi (tùy chọn)" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          <select className="o-nhap w-36" value={ketQua} onChange={(e) => setKetQua(e.target.value)}><option value="thang">Thắng (chốt)</option><option value="hen">Hẹn lại</option><option value="thua">Thua</option><option value="khac">Khác</option></select>
          <button type="button" className="nut nut-chinh" onClick={nap} disabled={dangNap || dong.length === 0}>{dangNap ? "AI đang phân tích…" : "Kết thúc & phân tích"}</button>
        </div>
      </section>
      {/* Phải: AI Copilot */}
      <aside className="the p-4 flex flex-col gap-3 text-sm order-3">
        <div className="flex items-center justify-between"><div className="font-semibold flex items-center gap-2"><Icon ten="robot" size={16} />AI Copilot</div><span className={`text-[11px] ${dangHoi ? "cham-nhay" : ""}`} style={{ color: "var(--chu-mo)" }}>{dangHoi ? <><span /><span /><span /></> : cheDoGoiY || (cheDoAI === "du_phong" ? "chế độ luật" : "sẵn sàng")}</span></div>
        <div className="flex flex-wrap gap-1">
          <button type="button" className="nut nut-nho nut-chinh" onClick={() => hoiAI("hỏi tay")} disabled={dangHoi || dong.length === 0}>Hỏi AI ngay</button>
          <button type="button" className={`nut nut-nho ${tuDong ? "nut-chinh" : ""}`} onClick={() => setTuDong((x) => !x)} title="Tự gợi ý sau mỗi câu khách nói">Tự động {tuDong ? "bật" : "tắt"}</button>
          <button type="button" className={`nut nut-nho ${docGoiY ? "nut-chinh" : ""}`} onClick={() => { const m = !docGoiY; setDocGoiY(m); if (!m) dungDoc(); }} title="Đọc gợi ý vào tai nghe (đeo tai nghe để khách không nghe thấy)">🎧 Đọc gợi ý {docGoiY ? "bật" : "tắt"}</button>
        </div>
        {discHien && <div className="the-2 p-2 text-xs flex items-start gap-2" style={{ borderColor: DISC[discHien.nhom].mau }}><span className="nhan" style={{ background: DISC[discHien.nhom].mau + "22", color: DISC[discHien.nhom].mau }}>{discHien.nhom}</span><div><b>Khách có vẻ nhóm {DISC[discHien.nhom].ten.split(" — ")[1]}</b> ({discHien.tin_cay}%). {discHien.chinh_cach_noi}</div></div>}
        {camTucThi && <div className="thong-bao thong-bao-do"><b>Cảnh báo tuân thủ:</b> câu vừa nói có cụm hứa kết quả / nói xấu đối thủ. Sửa ngay: nêu quy trình và bằng chứng được phép thay vì cam kết.</div>}
        {chuanTucThi && (
          <div className="the-2 p-3" style={{ borderColor: "var(--vang)" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--chu-vang)" }}>Khách đang phản đối: {TEN_LOAI_PHAN_DOI[loaiTucThi as LoaiPhanDoi]} <span className="font-normal" style={{ color: "var(--chu-nhat)" }}>· tức thì</span></div>
            <div className="text-[13px]">{chuanTucThi.cau_tra_loi_chuan}</div>
            <button type="button" className="nut nut-nho mt-2" onClick={() => docTuDong(chuanTucThi.cau_tra_loi_chuan, { tocDo: 1.15 })}>🎧 Đọc vào tai nghe</button>
          </div>)}
        {goiY ? (
          <>
            <div className="the-2 p-3" style={{ borderColor: "var(--nhan)" }}><div className="text-xs font-semibold mb-1" style={{ color: "var(--chu-nhan)" }}>Nên nói ngay</div><div className="text-[14px] leading-relaxed">{goiY.noi_tiep}</div><button type="button" className="nut nut-nho mt-2" onClick={() => docTuDong(goiY.noi_tiep, { tocDo: 1.15 })}>🎧 Đọc</button></div>
            {goiY.phan_doi && <div className="the-2 p-3"><div className="text-xs font-semibold mb-1" style={{ color: "var(--chu-vang)" }}>Xử lý phản đối «{TEN_LOAI_PHAN_DOI[goiY.phan_doi.loai]}»</div><div className="text-[13px]">{goiY.phan_doi.cau_tra_loi}</div></div>}
            {goiY.cau_hoi_nen_hoi.length > 0 && <div className="the-2 p-3"><div className="text-xs font-semibold mb-1">Câu hỏi nên hỏi tiếp</div><ul className="list-disc pl-4 text-[13px] flex flex-col gap-1">{goiY.cau_hoi_nen_hoi.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
            {goiY.canh_bao.length > 0 && <div className="thong-bao thong-bao-vang"><ul className="list-disc pl-4">{goiY.canh_bao.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
            <div className="flex items-center justify-between text-xs"><span className={`nhan ${goiY.tin_hieu === "tich_cuc" ? "nhan-xanh" : goiY.tin_hieu === "tieu_cuc" ? "nhan-do" : "nhan-xam"}`}>Khách: {goiY.tin_hieu === "tich_cuc" ? "tích cực" : goiY.tin_hieu === "tieu_cuc" ? "tiêu cực" : "trung tính"}</span><span className="tabular" style={{ color: "var(--chu-mo)" }}>Sẵn sàng chốt {goiY.san_sang_chot}%</span></div>
            <div className="thanh"><i style={{ width: `${goiY.san_sang_chot}%`, background: goiY.san_sang_chot >= 70 ? "var(--xanh)" : goiY.san_sang_chot >= 40 ? "var(--vang)" : "var(--do)" }} /></div>
            <div className="text-[12px]" style={{ color: "var(--chu-mo)" }}><b>Bước tiếp:</b> {goiY.buoc_tiep}</div>
          </>
        ) : <div className="mo-ta">Gợi ý xuất hiện sau câu đầu tiên của khách. Trong lúc chờ, bên trái là kịch bản mở đầu.</div>}
        <div className="text-[11px] leading-relaxed pt-2 border-t" style={{ color: "var(--chu-nhat)", borderColor: "var(--vien)" }}>Âm thanh không được lưu, chỉ transcript. Thông báo với khách khi ghi âm theo quy trình doanh nghiệp.</div>
      </aside>
    </div>
  );
}
