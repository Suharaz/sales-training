// Mã hóa khóa API của người dùng (AES-256-GCM, khóa dẫn xuất từ PHIEN_SECRET). Định dạng: v1.<iv>.<tag>.<ct> base64url.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { biMatPhien } from "./moi-truong";
const khoa = () => createHash("sha256").update("giong-noi:" + biMatPhien()).digest();
export function maHoa(ro: string): string {
  const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", khoa(), iv);
  const ct = Buffer.concat([c.update(ro, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${ct.toString("base64url")}`;
}
export function giaiMa(mh: string | null | undefined): string | null {
  if (!mh) return null;
  try {
    const [v, iv, tag, ct] = mh.split(".");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", khoa(), Buffer.from(iv, "base64url")); d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch { return null; }
}
/** Che khóa khi hiển thị: 4 ký tự cuối. */
export function cheKhoa(k: string | null): string { return k ? `••••••••${k.slice(-4)}` : ""; }
