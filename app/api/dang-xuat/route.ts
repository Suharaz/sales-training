import { NextResponse } from "next/server";
import { dangXuat } from "@/services/xac-thuc";
export async function POST() { await dangXuat(); return NextResponse.json({ ok: true }); }
