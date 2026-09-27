// Giọng nói đám mây theo workspace: cấu hình (khóa mã hóa), kiểm tra kết nối, TTS (ElevenLabs / Azure), token STT Azure.
import "server-only";
import type { Truy } from "@/db/ket-noi";
import { cheKhoa, giaiMa, maHoa } from "@/core/ma-hoa";
import { ghiKiemToan } from "./nhat-ky";

export type CauHinhGiong = { tts: "trinh_duyet" | "elevenlabs" | "azure"; stt: "trinh_duyet" | "azure"; elevenlabs_voice_id: string | null; elevenlabs_model: string; azure_region: string | null; azure_voice: string; toc_do: number; co_elevenlabs: boolean; co_azure: boolean; elevenlabs_key_che: string; azure_key_che: string };
type Hang = { tts: CauHinhGiong["tts"]; stt: CauHinhGiong["stt"]; elevenlabs_key_mh: string | null; elevenlabs_voice_id: string | null; elevenlabs_model: string; azure_key_mh: string | null; azure_region: string | null; azure_voice: string; toc_do: string };
export const AZURE_VOICES = [{ id: "vi-VN-HoaiMyNeural", ten: "HoaiMy (nữ, tự nhiên)" }, { id: "vi-VN-NamMinhNeural", ten: "NamMinh (nam, tự nhiên)" }];
export const ELEVEN_MODELS = [{ id: "eleven_flash_v2_5", ten: "Flash v2.5 — nhanh nhất (~75ms), hỗ trợ tiếng Việt" }, { id: "eleven_turbo_v2_5", ten: "Turbo v2.5 — cân bằng" }, { id: "eleven_multilingual_v2", ten: "Multilingual v2 — chất lượng cao nhất, chậm hơn" }];

async function hang(q: Truy): Promise<Hang | null> {
  return (await q.query<Hang>("select tts, stt, elevenlabs_key_mh, elevenlabs_voice_id, elevenlabs_model, azure_key_mh, azure_region, azure_voice, toc_do::text from tich_hop_giong_noi limit 1")).rows[0] ?? null;
}
export async function layCauHinhGiong(q: Truy): Promise<CauHinhGiong> {
  const h = await hang(q);
  if (!h) return { tts: "trinh_duyet", stt: "trinh_duyet", elevenlabs_voice_id: null, elevenlabs_model: "eleven_flash_v2_5", azure_region: null, azure_voice: "vi-VN-HoaiMyNeural", toc_do: 1, co_elevenlabs: false, co_azure: false, elevenlabs_key_che: "", azure_key_che: "" };
  const ek = giaiMa(h.elevenlabs_key_mh), ak = giaiMa(h.azure_key_mh);
  return { tts: h.tts, stt: h.stt, elevenlabs_voice_id: h.elevenlabs_voice_id, elevenlabs_model: h.elevenlabs_model, azure_region: h.azure_region, azure_voice: h.azure_voice, toc_do: Number(h.toc_do), co_elevenlabs: !!ek, co_azure: !!(ak && h.azure_region), elevenlabs_key_che: cheKhoa(ek), azure_key_che: cheKhoa(ak) };
}
/** Lưu cấu hình; khóa để trống = giữ khóa cũ; «xoa» = xóa. */
export async function luuCauHinhGiong(q: Truy, o: { workspaceId: string; nguoiDungId: string; tts: string; stt: string; elevenlabsKey?: string; elevenlabsVoiceId?: string; elevenlabsModel?: string; azureKey?: string; azureRegion?: string; azureVoice?: string; tocDo?: number }) {
  const cu = await hang(q);
  const tts = ["trinh_duyet", "elevenlabs", "azure"].includes(o.tts) ? o.tts : "trinh_duyet";
  const stt = ["trinh_duyet", "azure"].includes(o.stt) ? o.stt : "trinh_duyet";
  const ek = o.elevenlabsKey === "xoa" ? null : o.elevenlabsKey?.trim() ? maHoa(o.elevenlabsKey.trim()) : cu?.elevenlabs_key_mh ?? null;
  const ak = o.azureKey === "xoa" ? null : o.azureKey?.trim() ? maHoa(o.azureKey.trim()) : cu?.azure_key_mh ?? null;
  const region = (o.azureRegion ?? cu?.azure_region ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "") || null;
  const model = ELEVEN_MODELS.some((m) => m.id === o.elevenlabsModel) ? o.elevenlabsModel! : cu?.elevenlabs_model ?? "eleven_flash_v2_5";
  const voice = AZURE_VOICES.some((v) => v.id === o.azureVoice) ? o.azureVoice! : cu?.azure_voice ?? "vi-VN-HoaiMyNeural";
  const tocDo = Math.min(1.5, Math.max(0.7, Number(o.tocDo ?? cu?.toc_do ?? 1) || 1));
  if (tts === "elevenlabs" && !ek) throw new Error("Chọn ElevenLabs thì cần nhập API key ElevenLabs");
  if ((tts === "azure" || stt === "azure") && !(ak && region)) throw new Error("Chọn Azure thì cần nhập key và region của Azure Speech");
  await q.query(`insert into tich_hop_giong_noi(workspace_id, tts, stt, elevenlabs_key_mh, elevenlabs_voice_id, elevenlabs_model, azure_key_mh, azure_region, azure_voice, toc_do) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (workspace_id) do update set tts = excluded.tts, stt = excluded.stt, elevenlabs_key_mh = excluded.elevenlabs_key_mh, elevenlabs_voice_id = excluded.elevenlabs_voice_id, elevenlabs_model = excluded.elevenlabs_model, azure_key_mh = excluded.azure_key_mh, azure_region = excluded.azure_region, azure_voice = excluded.azure_voice, toc_do = excluded.toc_do, cap_nhat_luc = now()`,
    [o.workspaceId, tts, stt, ek, (o.elevenlabsVoiceId ?? cu?.elevenlabs_voice_id ?? "").trim().slice(0, 100) || null, model, ak, region, voice, tocDo]);
  await ghiKiemToan(q, { workspaceId: o.workspaceId, nguoiDungId: o.nguoiDungId, hanhDong: "cap_nhat_giong_noi", chiTiet: { tts, stt, doi_key_eleven: !!o.elevenlabsKey, doi_key_azure: !!o.azureKey } });
}
async function khoaEleven(q: Truy): Promise<string | null> { const h = await hang(q); return giaiMa(h?.elevenlabs_key_mh); }
async function khoaAzure(q: Truy): Promise<{ key: string; region: string } | null> { const h = await hang(q); const k = giaiMa(h?.azure_key_mh); return k && h?.azure_region ? { key: k, region: h.azure_region } : null; }

/** Kiểm tra kết nối ElevenLabs bằng khóa truyền vào (chưa lưu) hoặc khóa đã lưu; trả danh sách giọng. */
export async function kiemTraEleven(q: Truy, keyMoi?: string): Promise<{ ok: boolean; thongTin: string; giong: { id: string; ten: string; mo_ta: string }[] }> {
  const key = keyMoi?.trim() || (await khoaEleven(q));
  if (!key) return { ok: false, thongTin: "Chưa có API key", giong: [] };
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return { ok: false, thongTin: `ElevenLabs trả ${r.status}: ${(await r.text()).slice(0, 120)}`, giong: [] };
    const j = (await r.json()) as { voices?: { voice_id: string; name: string; labels?: Record<string, string>; category?: string }[] };
    const giong = (j.voices ?? []).map((v) => ({ id: v.voice_id, ten: v.name, mo_ta: [v.category, v.labels?.gender, v.labels?.accent, v.labels?.description].filter(Boolean).join(" · ") }));
    let han = "";
    try { const s = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": key } }); if (s.ok) { const sj = (await s.json()) as { character_count?: number; character_limit?: number; tier?: string }; han = ` · gói ${sj.tier ?? "?"}: đã dùng ${sj.character_count ?? 0}/${sj.character_limit ?? 0} ký tự`; } } catch { /* bỏ qua */ }
    return { ok: true, thongTin: `Kết nối được, ${giong.length} giọng${han}`, giong };
  } catch (e) { return { ok: false, thongTin: (e as Error).message, giong: [] }; }
}
export async function kiemTraAzure(q: Truy, keyMoi?: string, regionMoi?: string): Promise<{ ok: boolean; thongTin: string }> {
  const daLuu = await khoaAzure(q);
  const key = keyMoi?.trim() || daLuu?.key, region = (regionMoi?.trim().toLowerCase() || daLuu?.region || "").replace(/[^a-z0-9]/g, "");
  if (!key || !region) return { ok: false, thongTin: "Cần cả key và region (vd: southeastasia)" };
  try {
    const r = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Length": "0" }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return { ok: false, thongTin: `Azure trả ${r.status}: ${r.status === 401 ? "key sai hoặc không đúng region" : (await r.text()).slice(0, 120)}` };
    return { ok: true, thongTin: `Kết nối được region ${region}` };
  } catch (e) { return { ok: false, thongTin: (e as Error).message + " (kiểm tra region)" }; }
}
/** Token ngắn hạn (10 phút) cho STT Azure chạy trực tiếp trong trình duyệt — không lộ key. */
export async function tokenAzure(q: Truy): Promise<{ token: string; region: string } | null> {
  const a = await khoaAzure(q); if (!a) return null;
  const r = await fetch(`https://${a.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": a.key, "Content-Length": "0" } });
  if (!r.ok) return null;
  return { token: await r.text(), region: a.region };
}
/** Đọc văn bản → audio (mp3). Trả null nếu workspace dùng giọng trình duyệt. */
export async function docThanhAudio(q: Truy, text: string, ghiDe?: { tts?: "elevenlabs" | "azure"; giong?: string }): Promise<{ audio: Buffer; kieu: string } | null> {
  const ch = await layCauHinhGiong(q);
  const tts = ghiDe?.tts ?? ch.tts;
  const vb = text.replace(/[«»]/g, "").trim().slice(0, 1500);
  if (!vb) return null;
  if (tts === "elevenlabs") {
    const key = await khoaEleven(q); if (!key) throw new Error("Chưa có khóa ElevenLabs");
    const voice = ghiDe?.giong || ch.elevenlabs_voice_id || "21m00Tcm4TlvDq8ikWAM";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_22050_32`, { method: "POST", headers: { "xi-api-key": key, "content-type": "application/json" }, body: JSON.stringify({ text: vb, model_id: ch.elevenlabs_model, language_code: ch.elevenlabs_model.includes("flash") || ch.elevenlabs_model.includes("turbo") ? "vi" : undefined, voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3, speed: ch.toc_do } }), signal: AbortSignal.timeout(30_000) });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return { audio: Buffer.from(await r.arrayBuffer()), kieu: "audio/mpeg" };
  }
  if (tts === "azure") {
    const a = await khoaAzure(q); if (!a) throw new Error("Chưa có khóa Azure");
    const voice = ghiDe?.giong || ch.azure_voice;
    const rate = `${Math.round((ch.toc_do - 1) * 100)}%`;
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN"><voice name="${voice}"><prosody rate="${rate}">${vb.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</prosody></voice></speak>`;
    const r = await fetch(`https://${a.region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": a.key, "content-type": "application/ssml+xml", "x-microsoft-outputformat": "audio-24khz-48kbitrate-mono-mp3", "user-agent": "sales-training" }, body: ssml, signal: AbortSignal.timeout(30_000) });
    if (!r.ok) throw new Error(`Azure TTS ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return { audio: Buffer.from(await r.arrayBuffer()), kieu: "audio/mpeg" };
  }
  return null;
}
