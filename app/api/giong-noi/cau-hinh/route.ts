// GET: cấu hình giọng (không có khóa) cho client biết dùng nhà cung cấp nào. POST (quản lý): lưu cấu hình.
import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { layCauHinhGiong, luuCauHinhGiong } from "@/services/giong-noi";
export const dynamic = "force-dynamic";
export async function GET() {
  const phien = await layPhien(); if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const ch = await voiWorkspace(phien.workspaceId, (q) => layCauHinhGiong(q));
  return NextResponse.json({ tts: ch.tts, stt: ch.stt, toc_do: ch.toc_do, co_elevenlabs: ch.co_elevenlabs, co_azure: ch.co_azure });
}
export async function POST(req: Request) {
  const phien = await layPhien(); if (!phien || phien.vaiTro !== "quan_ly") return NextResponse.json({ loi: "Chỉ quản lý" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string | number | undefined>;
  try {
    await voiWorkspace(phien.workspaceId, (q) => luuCauHinhGiong(q, { workspaceId: phien.workspaceId, nguoiDungId: phien.nguoiDungId, tts: String(b.tts ?? ""), stt: String(b.stt ?? ""), elevenlabsKey: b.elevenlabs_key as string | undefined, elevenlabsVoiceId: b.elevenlabs_voice_id as string | undefined, elevenlabsModel: b.elevenlabs_model as string | undefined, azureKey: b.azure_key as string | undefined, azureRegion: b.azure_region as string | undefined, azureVoice: b.azure_voice as string | undefined, tocDo: b.toc_do !== undefined ? Number(b.toc_do) : undefined }));
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 400 }); }
}
