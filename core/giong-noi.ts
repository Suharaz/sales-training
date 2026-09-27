// Giọng đọc tiếng Việt trong trình duyệt: chọn giọng tự nhiên nhất có sẵn (Edge: HoaiMy/NamMinh Natural; Chrome: Google Tiếng Việt; macOS: Linh),
// cho phép người dùng chọn và nhớ lựa chọn. Chạy ở client.
export type GiongNoi = { name: string; lang: string; diem: number };
const UU_TIEN = [/natural/i, /online/i, /neural/i, /google/i, /hoaimy|namminh/i, /linh/i, /premium|enhanced/i];
export function xepHangGiong(v: { name: string; lang: string; localService?: boolean }): number {
  if (!/^vi(-|_)?/i.test(v.lang)) return -1;
  let d = 1;
  UU_TIEN.forEach((r, i) => { if (r.test(v.name)) d += (UU_TIEN.length - i) * 3; });
  if (v.localService === false) d += 2; // giọng đám mây thường tự nhiên hơn
  return d;
}
export function danhSachGiongViet(): GiongNoi[] {
  if (typeof speechSynthesis === "undefined") return [];
  return speechSynthesis.getVoices().map((v) => ({ name: v.name, lang: v.lang, diem: xepHangGiong(v) })).filter((v) => v.diem > 0).sort((a, b) => b.diem - a.diem);
}
export function giongDaChon(): string | null { try { return localStorage.getItem("st_giong"); } catch { return null; } }
export function luuGiong(name: string) { try { localStorage.setItem("st_giong", name); } catch { /* bỏ qua */ } }
export function tocDoDaChon(): number { try { return Number(localStorage.getItem("st_toc_do") || 1) || 1; } catch { return 1; } }
export function luuTocDo(n: number) { try { localStorage.setItem("st_toc_do", String(n)); } catch { /* bỏ qua */ } }
/** Đọc văn bản: tách câu để ngắt tự nhiên, dừng đoạn đang đọc trước đó. */
export function docVanBan(text: string, o?: { giong?: string | null; tocDo?: number; onXong?: () => void }) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const giongs = speechSynthesis.getVoices();
  const ten = o?.giong ?? giongDaChon();
  const v = giongs.find((g) => g.name === ten) ?? giongs.filter((g) => /^vi/i.test(g.lang)).sort((a, b) => xepHangGiong(b) - xepHangGiong(a))[0];
  const cau = text.replace(/«|»/g, "").split(/(?<=[.!?…])\s+/).filter(Boolean);
  cau.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c); u.lang = "vi-VN"; u.rate = o?.tocDo ?? tocDoDaChon(); u.pitch = 1;
    if (v) u.voice = v;
    if (i === cau.length - 1 && o?.onXong) u.onend = o.onXong;
    speechSynthesis.speak(u);
  });
}
export function dungDoc() { try { speechSynthesis?.cancel(); } catch { /* bỏ qua */ } }
