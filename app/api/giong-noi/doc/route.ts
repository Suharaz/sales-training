// POST {text, tts?, giong?} → audio/mpeg (ElevenLabs hoặc Azure theo cấu hình workspace). 204 nếu dùng giọng trình duyệt.
import { NextResponse } from "next/server";
import { layPhien } from "@/services/xac-thuc";
import { voiWorkspace } from "@/services/workspace-guard";
import { docThanhAudio } from "@/services/giong-noi";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req: Request) {
  const phien = await layPhien(); if (!phien) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { text?: string; tts?: "elevenlabs" | "azure"; giong?: string };
  if (!b.text?.trim()) return NextResponse.json({ loi: "Thiếu văn bản" }, { status: 400 });
  try {
    const r = await voiWorkspace(phien.workspaceId, (q) => docThanhAudio(q, b.text!, { tts: b.tts, giong: b.giong }));
    if (!r) return new NextResponse(null, { status: 204 });
    return new NextResponse(new Uint8Array(r.audio), { headers: { "content-type": r.kieu, "cache-control": "no-store" } });
  } catch (e) { return NextResponse.json({ loi: (e as Error).message }, { status: 502 }); }
}
