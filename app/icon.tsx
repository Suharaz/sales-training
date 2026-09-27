import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 64, height: 64, borderRadius: 14, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
    </div>, size);
}
