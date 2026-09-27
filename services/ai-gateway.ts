// AI GATEWAY — cửa ngõ duy nhất cho mọi lời gọi Claude (quy ước 3 CLAUDE.md).
// Chế độ: cli (Claude Code gói sub, máy local) · api (ANTHROPIC_API_KEY) · du_phong (không AI, chấm theo luật).
// Mọi lời gọi: ép JSON theo lược đồ zod (api: tool_use; cli: prompt + bóc JSON + 1 vòng tự sửa), ghi log_sinh_ai 100%.
import "server-only";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { bocJson } from "@/core/boc-json";
import { voiWorkspace } from "./workspace-guard";
import { timTuCam } from "@/core/dna";

export type CheDoAI = "cli" | "api" | "du_phong";
export type TacVu = "sinh_persona" | "khach_tra_loi" | "cham_luyen_tap" | "phan_tich_cuoc_goi" | "goi_huan_luyen" | "goi_y_tra_loi" | "trich_dna" | "copilot" | "sinh_kich_ban_disc";

const g = globalThis as unknown as { __stCliOk?: boolean | null };

export function cheDoAI(): CheDoAI {
  const ep = (process.env.AI_MODE || "").toLowerCase();
  if (ep === "api" && process.env.ANTHROPIC_API_KEY) return "api";
  if (ep === "cli" && !process.env.VERCEL && g.__stCliOk !== false) return "cli";
  if (!ep && process.env.ANTHROPIC_API_KEY) return "api";
  return "du_phong";
}
export function modelMacDinh(): string { return process.env.AI_MODEL || "claude-sonnet-5"; }
/** Tác vụ cần độ trễ thấp (copilot trong cuộc gọi) dùng model nhanh. */
export function modelNhanh(): string { return process.env.AI_MODEL_NHANH || modelMacDinh(); }
function chonModel(tacVu: TacVu): string { return tacVu === "copilot" ? modelNhanh() : modelMacDinh(); }

/** Kiểm CLI có chạy được không (trang cài đặt + tự hạ xuống dự phòng khi CLI hỏng). */
export async function kiemTraCli(): Promise<{ ok: boolean; thongTin: string }> {
  try {
    const r = await chayCli(["--version"], 15_000);
    g.__stCliOk = true;
    return { ok: true, thongTin: r.trim() };
  } catch (e) {
    g.__stCliOk = false;
    return { ok: false, thongTin: (e as Error).message };
  }
}

function chayCli(args: string[], timeout: number): Promise<string> {
  const opts = { timeout, maxBuffer: 32 * 1024 * 1024, env: process.env };
  const chay = (bin: string) => new Promise<string>((resolve, reject) => {
    const tien = execFile(bin, args, opts, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(new Error(String(stderr || err.message).slice(0, 500)), { code: (err as NodeJS.ErrnoException).code }));
      resolve(String(stdout));
    });
    tien.stdin?.end();
  });
  return chay("claude").catch((e) => { if (e?.code === "ENOENT") return chay(`${homedir()}/.local/bin/claude`); throw e; });
}

// Đo 27/09: system prompt ngắn + bỏ tools/MCP của Claude Code → Sonnet 5 trả JSON sạch ~8s thay vì 20–70s (Haiku qua CLI in dài dòng, chậm hơn).
async function goiCli(heThong: string, prompt: string, model: string, timeout: number): Promise<{ text: string; tokensVao?: number; tokensRa?: number }> {
  const ra = await chayCli(["-p", prompt, "--output-format", "json", "--model", model, "--system-prompt", heThong, "--tools", "", "--strict-mcp-config", "--mcp-config", JSON.stringify({ mcpServers: {} })], timeout);
  let j: { is_error?: boolean; subtype?: string; result?: unknown; usage?: { input_tokens?: number; output_tokens?: number } } | null = null;
  try { j = JSON.parse(ra); } catch { return { text: ra }; }
  if (j?.is_error || (j?.subtype && j.subtype !== "success")) throw new Error(String(j?.result || "CLI trả lỗi"));
  return { text: String(j?.result ?? ""), tokensVao: j?.usage?.input_tokens, tokensRa: j?.usage?.output_tokens };
}

let khach: Anthropic | null = null;
async function goiApi(heThong: string, prompt: string, model: string, timeout: number, schema: ZodType<unknown>): Promise<{ text: string; tokensVao?: number; tokensRa?: number }> {
  khach ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "", maxRetries: 2 });
  const res = await khach.withOptions({ timeout }).messages.create({
    model, max_tokens: 6000, system: heThong, messages: [{ role: "user", content: prompt }],
    tools: [{ name: "tra_ket_qua", description: "Trả kết quả đúng cấu trúc yêu cầu.", input_schema: zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none" }) as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: "tra_ket_qua" },
  });
  const tool = res.content.find((c) => c.type === "tool_use");
  const text = tool && tool.type === "tool_use" ? JSON.stringify(tool.input) : res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  return { text, tokensVao: res.usage?.input_tokens, tokensRa: res.usage?.output_tokens };
}

const HE_THONG = "Bạn là AI huấn luyện bán hàng, làm việc cho doanh nghiệp Việt Nam mô tả trong NGỮ CẢNH DNA. Toàn bộ nội dung bằng tiếng Việt có dấu, xưng hô theo DNA. Tuyệt đối không dùng từ cấm, không nêu số liệu ngoài danh sách được phép, không hứa kết quả.";
const QUY_TAC_JSON = "QUY TẮC ĐỊNH DẠNG: chỉ in DUY NHẤT một JSON hợp lệ theo cấu trúc yêu cầu, không chữ nào trước/sau, không bọc trong khối mã. Trong giá trị chuỗi không dùng dấu ngoặc kép (dùng « »), không xuống dòng.";

export type YeuCauAI<T> = {
  workspaceId: string; tacVu: TacVu; prompt: string; schema: ZodType<T>;
  /** Mô tả cấu trúc JSON cho chế độ cli (chế độ api dùng tool_use nên không cần). */
  cauTrucJson: string;
  /** Hàm dự phòng theo luật khi không có AI hoặc AI lỗi. */
  duPhong: () => T;
  timeoutMs?: number;
  /** Không nạp DNA (chính tác vụ trích DNA). */
  boQuaDna?: boolean;
};
export type KetQuaAI<T> = { duLieu: T; cheDo: CheDoAI; model: string | null; thoiGianMs: number; loi?: string; dnaThieu: boolean; phienBanDna: number | null; tuCamViPham: string[] };

async function napDna(workspaceId: string): Promise<{ tomTat: string; tuCam: string[]; phienBan: number } | null> {
  try { const { nguCanhDna } = await import("./dna"); return await voiWorkspace(workspaceId, (q) => nguCanhDna(q)); } catch { return null; }
}

async function ghiLog(o: { workspaceId: string; tacVu: TacVu; cheDo: CheDoAI; model: string | null; tokensVao?: number; tokensRa?: number; thoiGianMs: number; ok: boolean; loi?: string; phienBanDna?: number | null }) {
  try {
    await voiWorkspace(o.workspaceId, (q) => q.query(
      "insert into log_sinh_ai(workspace_id, tac_vu, che_do, model, tokens_vao, tokens_ra, thoi_gian_ms, ok, loi, phien_ban_dna) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [o.workspaceId, o.tacVu, o.cheDo, o.model, o.tokensVao ?? null, o.tokensRa ?? null, o.thoiGianMs, o.ok, o.loi?.slice(0, 1000) ?? null, o.phienBanDna ?? null],
    ));
  } catch (e) { console.error("log_sinh_ai:", (e as Error).message); }
}

/**
 * Gọi AI, ép lược đồ; thất bại (định dạng sai sau 1 vòng sửa, hạ tầng lỗi) → dùng dự phòng và ghi lý do.
 * Không bao giờ ném lỗi ra ngoài: luồng nghiệp vụ luôn có kết quả.
 */
export async function goiAI<T>(y: YeuCauAI<T>): Promise<KetQuaAI<T>> {
  const cheDo = cheDoAI();
  const batDau = Date.now();
  const dna = y.boQuaDna ? null : await napDna(y.workspaceId);
  const dnaThieu = !y.boQuaDna && !dna;
  const phienBanDna = dna?.phienBan ?? null;
  if (cheDo === "du_phong") {
    const duLieu = y.duPhong();
    await ghiLog({ workspaceId: y.workspaceId, tacVu: y.tacVu, cheDo, model: null, thoiGianMs: Date.now() - batDau, ok: true, phienBanDna });
    return { duLieu, cheDo, model: null, thoiGianMs: Date.now() - batDau, dnaThieu, phienBanDna, tuCamViPham: [] };
  }
  const model = chonModel(y.tacVu);
  const timeout = y.timeoutMs ?? 120_000;
  const khoiDna = y.boQuaDna ? "" : dna
    ? `NGỮ CẢNH DNA DOANH NGHIỆP (phiên bản ${dna.phienBan}) — bám sát tuyệt đối:\n${dna.tomTat}`
    : "NGỮ CẢNH DNA: workspace chưa nạp DNA — viết trung tính, không nêu số liệu thành tích, không cam kết kết quả, xưng hô em – anh/chị.";
  const heThongDay = `${HE_THONG}\n\n${khoiDna}`.trim();
  const promptDay = `${y.prompt}\n\nCẤU TRÚC JSON PHẢI TRẢ:\n${y.cauTrucJson}\n\n${QUY_TAC_JSON}`;
  let loiCuoi = "";
  let tokensVao: number | undefined, tokensRa: number | undefined;
  for (let lan = 1; lan <= 2; lan++) {
    try {
      const ra = cheDo === "api"
        ? await goiApi(heThongDay, `${y.prompt}\n\n${lan > 1 ? `LẦN TRƯỚC LỖI: ${loiCuoi}. Sửa lại cho đúng lược đồ.` : ""}`, model, timeout, y.schema)
        : await goiCli(heThongDay, lan > 1 ? `${promptDay}\n\nLẦN TRƯỚC LỖI: ${loiCuoi}. In lại JSON đúng.` : promptDay, model, timeout);
      tokensVao = ra.tokensVao; tokensRa = ra.tokensRa;
      const parsed = y.schema.safeParse(bocJson(ra.text));
      if (!parsed.success) { loiCuoi = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "); continue; }
      // Guardrail từ cấm: chỉ cảnh báo (ghi log + trả về), không chặn — nội dung AI vẫn ở trạng thái nháp/được duyệt ở tầng nghiệp vụ.
      const tuCamViPham = dna?.tuCam.length && y.tacVu !== "cham_luyen_tap" && y.tacVu !== "phan_tich_cuoc_goi" ? timTuCam(JSON.stringify(parsed.data), dna.tuCam) : [];
      const thoiGianMs = Date.now() - batDau;
      await ghiLog({ workspaceId: y.workspaceId, tacVu: y.tacVu, cheDo, model, tokensVao, tokensRa, thoiGianMs, ok: true, loi: tuCamViPham.length ? `từ cấm: ${tuCamViPham.join(", ")}` : undefined, phienBanDna });
      return { duLieu: parsed.data, cheDo, model, thoiGianMs, dnaThieu, phienBanDna, tuCamViPham };
    } catch (e) {
      loiCuoi = (e as Error).message;
      // Lỗi hạ tầng (CLI không chạy, hết hạn phiên, mạng) — không thử lại, rơi xuống dự phòng.
      if (/ENOENT|OAuth|expired|timed out|ETIMEDOUT|authentication|401|403/i.test(loiCuoi)) break;
    }
  }
  const thoiGianMs = Date.now() - batDau;
  await ghiLog({ workspaceId: y.workspaceId, tacVu: y.tacVu, cheDo, model, tokensVao, tokensRa, thoiGianMs, ok: false, loi: loiCuoi, phienBanDna });
  return { duLieu: y.duPhong(), cheDo: "du_phong", model: null, thoiGianMs, loi: loiCuoi, dnaThieu, phienBanDna, tuCamViPham: [] };
}
