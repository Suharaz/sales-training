// Bóc JSON từ văn bản model trả (có thể kèm chữ thừa hoặc khối ```json).
export function bocJson(text: string): unknown {
  const t = text.trim();
  try { return JSON.parse(t); } catch { /* thử tiếp */ }
  const khoi = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (khoi) { try { return JSON.parse(khoi[1].trim()); } catch { /* thử tiếp */ } }
  const dau = t.search(/[{[]/);
  if (dau < 0) throw new Error("Không tìm thấy JSON trong kết quả");
  const mo = t[dau], dong = mo === "{" ? "}" : "]";
  const cuoi = t.lastIndexOf(dong);
  if (cuoi <= dau) throw new Error("JSON không đóng");
  return JSON.parse(t.slice(dau, cuoi + 1));
}
