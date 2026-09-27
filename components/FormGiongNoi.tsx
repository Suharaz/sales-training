"use client";
// Cài đặt giọng nói: chọn nhà cung cấp, nhập khóa, kiểm tra kết nối, chọn giọng, nghe thử, lưu. Kèm hướng dẫn lấy khóa.
import { useState } from "react";
import type { CauHinhGiong } from "@/services/giong-noi";
import { docVanBanMay, dungDoc, cauHinhGiong } from "@/core/giong-noi";
type Giong = { id: string; ten: string; mo_ta: string };
const MAU_THU = "Xin chào, mình là khách hàng ảo của bạn. Hôm nay mình muốn tìm hiểu về sản phẩm bên bạn, bạn tư vấn giúp mình nhé.";
export function FormGiongNoi({ cauHinh, azureVoices, elevenModels, quanLy }: { cauHinh: CauHinhGiong; azureVoices: { id: string; ten: string }[]; elevenModels: { id: string; ten: string }[]; quanLy: boolean }) {
  const [tts, setTts] = useState(cauHinh.tts); const [stt, setStt] = useState(cauHinh.stt);
  const [ek, setEk] = useState(""); const [evoice, setEvoice] = useState(cauHinh.elevenlabs_voice_id ?? ""); const [emodel, setEmodel] = useState(cauHinh.elevenlabs_model);
  const [ak, setAk] = useState(""); const [aregion, setAregion] = useState(cauHinh.azure_region ?? "southeastasia"); const [avoice, setAvoice] = useState(cauHinh.azure_voice);
  const [tocDo, setTocDo] = useState(cauHinh.toc_do);
  const [giongs, setGiongs] = useState<Giong[]>([]);
  const [tb, setTb] = useState<Record<string, string>>({}); const [dang, setDang] = useState<Record<string, boolean>>({});
  const [coE, setCoE] = useState(cauHinh.co_elevenlabs); const [coA, setCoA] = useState(cauHinh.co_azure);
  const bao = (k: string, v: string) => setTb((x) => ({ ...x, [k]: v })); const ban = (k: string, v: boolean) => setDang((x) => ({ ...x, [k]: v }));
  async function kiemTra(nha: "elevenlabs" | "azure") {
    ban(nha, true); bao(nha, "Đang kiểm tra…");
    try { const r = await fetch("/api/giong-noi/kiem-tra", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nha, key: nha === "elevenlabs" ? ek : ak, region: aregion }) }); const j = await r.json(); bao(nha, (j.ok ? "✅ " : "❌ ") + j.thongTin); if (nha === "elevenlabs" && j.ok) { setGiongs(j.giong); if (!evoice && j.giong[0]) setEvoice(j.giong[0].id); } }
    catch (e) { bao(nha, "❌ " + (e as Error).message); } finally { ban(nha, false); }
  }
  async function luu() {
    ban("luu", true); bao("luu", "");
    try { const r = await fetch("/api/giong-noi/cau-hinh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tts, stt, elevenlabs_key: ek || undefined, elevenlabs_voice_id: evoice, elevenlabs_model: emodel, azure_key: ak || undefined, azure_region: aregion, azure_voice: avoice, toc_do: tocDo }) }); const j = await r.json(); if (!r.ok) throw new Error(j.loi); bao("luu", "✅ Đã lưu. Role-play và copilot sẽ dùng cấu hình này."); if (ek) setCoE(true); if (ak) setCoA(true); setEk(""); setAk(""); await cauHinhGiong(true); }
    catch (e) { bao("luu", "❌ " + (e as Error).message); } finally { ban("luu", false); }
  }
  async function ngheThu(nha: "elevenlabs" | "azure") {
    ban("nghe" + nha, true); bao("nghe" + nha, "Đang tạo giọng…");
    try { const ok = await docVanBanMay(MAU_THU, { tts: nha, giong: nha === "elevenlabs" ? evoice || undefined : avoice, onBatDau: () => bao("nghe" + nha, "▶ Đang phát"), onXong: () => bao("nghe" + nha, "Xong") }); if (!ok) bao("nghe" + nha, "Chưa lưu khóa — lưu rồi nghe thử."); }
    catch (e) { bao("nghe" + nha, "❌ " + (e as Error).message + " (đã lưu khóa chưa?)"); } finally { ban("nghe" + nha, false); }
  }
  const ro = !quanLy;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <div className="the p-4 text-sm flex flex-col gap-3">
          <div className="font-semibold">1. Chọn cách dùng</div>
          <div className="grid gap-2 md:grid-cols-3">
            {([["trinh_duyet", "Giọng trình duyệt", "Miễn phí, giọng máy. Tốt nhất trên Edge."], ["elevenlabs", "ElevenLabs", "Tự nhiên nhất, có cảm xúc, nhân bản được giọng thật."], ["azure", "Azure Speech", "Giọng HoaiMy/NamMinh neural, rẻ, kèm nhận dạng giọng nói tốt."]] as const).map(([k, t, m]) => (
              <label key={k} className="the-2 p-3 flex gap-2 cursor-pointer has-[:checked]:border-[var(--nhan)]"><input type="radio" name="tts" value={k} checked={tts === k} onChange={() => setTts(k)} disabled={ro} className="mt-1" /><span><b>{t}</b><div className="text-xs" style={{ color: "var(--chu-mo)" }}>{m}</div></span></label>))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">Nhận dạng giọng nói (sale nói vào mic):<select className="o-nhap w-64" value={stt} onChange={(e) => setStt(e.target.value as typeof stt)} disabled={ro}><option value="trinh_duyet">Trình duyệt (Chrome/Edge)</option><option value="azure">Azure Speech (chính xác hơn, mọi trình duyệt)</option></select></label>
            <label className="flex items-center gap-2">Tốc độ nói <input type="range" min={0.7} max={1.5} step={0.05} value={tocDo} onChange={(e) => setTocDo(Number(e.target.value))} disabled={ro} /> {tocDo.toFixed(2)}</label>
          </div>
        </div>
        <div className="the p-4 text-sm flex flex-col gap-2" style={{ opacity: tts === "elevenlabs" ? 1 : 0.85 }}>
          <div className="flex items-center justify-between"><div className="font-semibold">2. ElevenLabs</div><span className={`nhan ${coE ? "nhan-xanh" : "nhan-xam"}`}>{coE ? `đã lưu khóa ${cauHinh.elevenlabs_key_che}` : "chưa có khóa"}</span></div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]"><input className="o-nhap font-mono" type="password" placeholder={coE ? "Nhập khóa mới nếu muốn đổi (để trống = giữ)" : "API key (bắt đầu bằng sk_…)"} value={ek} onChange={(e) => setEk(e.target.value)} disabled={ro} autoComplete="off" /><button type="button" className="nut" onClick={() => kiemTra("elevenlabs")} disabled={ro || dang.elevenlabs || (!ek && !coE)}>{dang.elevenlabs ? "Đang kiểm…" : "Kiểm tra kết nối"}</button></div>
          {tb.elevenlabs && <div className="text-xs" style={{ color: "var(--chu-mo)" }}>{tb.elevenlabs}</div>}
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1">Giọng (voice){giongs.length > 0 ? <select className="o-nhap" value={evoice} onChange={(e) => setEvoice(e.target.value)} disabled={ro}>{giongs.map((g) => <option key={g.id} value={g.id}>{g.ten} — {g.mo_ta}</option>)}</select> : <input className="o-nhap font-mono" placeholder="Voice ID (bấm Kiểm tra kết nối để chọn từ danh sách)" value={evoice} onChange={(e) => setEvoice(e.target.value)} disabled={ro} />}</label>
            <label className="flex flex-col gap-1">Model<select className="o-nhap" value={emodel} onChange={(e) => setEmodel(e.target.value)} disabled={ro}>{elevenModels.map((m) => <option key={m.id} value={m.id}>{m.ten}</option>)}</select></label>
          </div>
          <div className="flex items-center gap-2"><button type="button" className="nut nut-nho" onClick={() => ngheThu("elevenlabs")} disabled={!coE || dang.ngheelevenlabs}>🔊 Nghe thử ElevenLabs</button><button type="button" className="nut nut-nho" onClick={dungDoc}>Dừng</button><span className="text-xs" style={{ color: "var(--chu-mo)" }}>{tb.ngheelevenlabs}</span></div>
        </div>
        <div className="the p-4 text-sm flex flex-col gap-2" style={{ opacity: tts === "azure" || stt === "azure" ? 1 : 0.85 }}>
          <div className="flex items-center justify-between"><div className="font-semibold">3. Azure Speech</div><span className={`nhan ${coA ? "nhan-xanh" : "nhan-xam"}`}>{coA ? `đã lưu khóa ${cauHinh.azure_key_che} · ${cauHinh.azure_region}` : "chưa có khóa"}</span></div>
          <div className="grid gap-2 md:grid-cols-[1fr_180px_auto]"><input className="o-nhap font-mono" type="password" placeholder={coA ? "Khóa mới nếu muốn đổi (để trống = giữ)" : "Key 1 của tài nguyên Speech"} value={ak} onChange={(e) => setAk(e.target.value)} disabled={ro} autoComplete="off" /><input className="o-nhap" placeholder="Region, vd: southeastasia" value={aregion} onChange={(e) => setAregion(e.target.value)} disabled={ro} /><button type="button" className="nut" onClick={() => kiemTra("azure")} disabled={ro || dang.azure || (!ak && !coA)}>{dang.azure ? "Đang kiểm…" : "Kiểm tra kết nối"}</button></div>
          {tb.azure && <div className="text-xs" style={{ color: "var(--chu-mo)" }}>{tb.azure}</div>}
          <label className="flex flex-col gap-1 md:w-1/2">Giọng<select className="o-nhap" value={avoice} onChange={(e) => setAvoice(e.target.value)} disabled={ro}>{azureVoices.map((v) => <option key={v.id} value={v.id}>{v.ten}</option>)}</select></label>
          <div className="flex items-center gap-2"><button type="button" className="nut nut-nho" onClick={() => ngheThu("azure")} disabled={!coA || dang.ngheazure}>🔊 Nghe thử Azure</button><button type="button" className="nut nut-nho" onClick={dungDoc}>Dừng</button><span className="text-xs" style={{ color: "var(--chu-mo)" }}>{tb.ngheazure}</span></div>
        </div>
        {quanLy && <div className="flex items-center gap-3"><button type="button" className="nut nut-chinh" onClick={luu} disabled={dang.luu}>{dang.luu ? "Đang lưu…" : "Lưu cấu hình"}</button><span className="text-sm" style={{ color: "var(--chu-mo)" }}>{tb.luu}</span></div>}
      </div>
      <aside className="flex flex-col gap-4 text-sm">
        <div className="the p-4"><div className="font-semibold mb-2">Hướng dẫn lấy khóa ElevenLabs</div>
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>Vào <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ color: "var(--nhan-sang)" }}>elevenlabs.io</a>, đăng ký (gói Free có 10.000 ký tự/tháng để thử; gói Starter 5 USD/tháng đủ cho vài chục phiên luyện).</li>
            <li>Bấm ảnh đại diện góc dưới trái → <b>API Keys</b> → <b>Create API Key</b>, đặt tên «Sales Training», bật quyền Text to Speech và Voices, sao chép khóa <code>sk_…</code>.</li>
            <li>Dán vào ô trên, bấm <b>Kiểm tra kết nối</b>: danh sách giọng hiện ra để chọn. Muốn giọng Việt riêng: vào <b>Voices → Voice Library</b> tìm «Vietnamese» và bấm Add, hoặc <b>Instant Voice Cloning</b> để nhân bản giọng thật từ 1–2 phút ghi âm.</li>
            <li>Model <b>Flash v2.5</b> cho tiếng Việt nhanh và rẻ nhất; <b>Multilingual v2</b> hay nhất nhưng chậm hơn.</li>
          </ol></div>
        <div className="the p-4"><div className="font-semibold mb-2">Hướng dẫn lấy khóa Azure Speech</div>
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>Vào <a href="https://portal.azure.com" target="_blank" rel="noreferrer" style={{ color: "var(--nhan-sang)" }}>portal.azure.com</a> (tạo tài khoản Azure miễn phí nếu chưa có).</li>
            <li>Bấm <b>Create a resource</b> → tìm <b>Speech</b> (Azure AI services) → Create. Chọn Region <b>Southeast Asia</b> (gần Việt Nam), Pricing tier <b>Free F0</b> (0,5 triệu ký tự đọc và 5 giờ nhận dạng mỗi tháng) hoặc S0.</li>
            <li>Sau khi tạo xong, vào tài nguyên → <b>Keys and Endpoint</b>: sao chép <b>KEY 1</b> và <b>Location/Region</b> (ví dụ <code>southeastasia</code>).</li>
            <li>Dán vào ô trên, bấm <b>Kiểm tra kết nối</b>, chọn giọng HoaiMy hoặc NamMinh, bấm Nghe thử.</li>
            <li>Chọn Azure ở mục «Nhận dạng giọng nói» để sale nói vào mic chính xác hơn và chạy được trên Safari.</li>
          </ol></div>
        <div className="the p-4 text-xs" style={{ color: "var(--chu-mo)" }}>Khóa được mã hóa AES-256 trước khi lưu và không bao giờ gửi xuống trình duyệt; trình duyệt chỉ nhận âm thanh đã tạo hoặc token Azure sống 10 phút. Chi phí ước tính: một phiên luyện 10 phút tốn khoảng 1.500–3.000 ký tự.</div>
      </aside>
    </div>
  );
}
