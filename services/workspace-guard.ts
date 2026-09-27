// Mọi truy vấn nghiệp vụ chạy trong transaction có set_config('app.workspace_id') → RLS FORCE lọc theo workspace.
import { pool, type Truy } from "@/db/ket-noi";
import type { QueryResultRow } from "pg";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class LoiWorkspace extends Error { constructor(m: string) { super(m); this.name = "LoiWorkspace"; } }
export function laUuid(s: unknown): s is string { return typeof s === "string" && UUID.test(s); }
export async function voiWorkspace<T>(workspaceId: string, fn: (q: Truy) => Promise<T>): Promise<T> {
  if (!laUuid(workspaceId)) throw new LoiWorkspace("workspace_id không hợp lệ");
  const c = await pool().connect();
  let hong = false;
  // Xếp hàng truy vấn trên cùng một client: Promise.all trong trang gọi song song, pg 9 sẽ bỏ hỗ trợ query chồng.
  let chuoi: Promise<unknown> = Promise.resolve();
  const q: Truy = { query: <R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) => { const p = chuoi.then(() => c.query<R>(text, values)); chuoi = p.then(() => undefined, () => undefined); return p; } };
  try {
    await c.query("begin");
    await c.query("select set_config('app.workspace_id', $1, true)", [workspaceId]);
    const kq = await fn(q);
    await c.query("commit");
    return kq;
  } catch (e) {
    hong = await c.query("rollback").then(() => false).catch(() => true);
    throw e;
  } finally { c.release(hong); }
}
/** Tra cứu cấp nền tảng qua hàm SECURITY DEFINER (đăng nhập, chứng chỉ công khai). */
export async function truyNenTang<R extends Record<string, unknown>>(sql: string, values: unknown[]): Promise<R[]> {
  return (await pool().query(sql, values)).rows as R[];
}
