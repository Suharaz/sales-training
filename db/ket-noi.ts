// Một pool duy nhất; RLS FORCE áp cả chủ bảng nên mọi truy vấn nghiệp vụ vẫn phải qua workspace-guard.
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
export type Truy = { query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>> };
export type { PoolClient };
const g = globalThis as unknown as { __stPool?: Pool; __stPoolChu?: Pool };
/** Chuỗi kết nối role CHỦ (migration, seed). */
export function chuoiKetNoi(): string {
  return process.env.DATABASE_URL || "postgres://localhost:5432/sales_training";
}
/** Chuỗi kết nối role ỨNG DỤNG (local: app_user để RLS có hiệu lực; Neon: cùng chủ vì chủ không phải superuser). */
export function chuoiKetNoiApp(): string {
  return process.env.DATABASE_URL_APP || chuoiKetNoi();
}
function moPool(urlGoc: string, max: number): Pool {
  // Neon/Vercel đưa `sslmode=require&channel_binding=require` trong URL → pg in cảnh báo SSL ra stderr mỗi lần khởi động
  // (Vercel hiển thị thành «error»). Bỏ tham số đó và cấu hình SSL tường minh.
  let url = urlGoc; let canSsl = /neon\.tech|sslmode=require/.test(urlGoc);
  try { const u = new URL(urlGoc); if (u.searchParams.has("sslmode")) { canSsl = true; u.searchParams.delete("sslmode"); } u.searchParams.delete("channel_binding"); url = u.toString(); } catch { /* giữ nguyên */ }
  return new Pool({ connectionString: url, max, idleTimeoutMillis: 60_000, keepAlive: true, connectionTimeoutMillis: 10_000, ssl: canSsl ? { rejectUnauthorized: true } : undefined });
}
/** Pool ứng dụng — mọi truy vấn nghiệp vụ (qua workspace-guard). */
export function pool(): Pool { return (g.__stPool ??= moPool(chuoiKetNoiApp(), 8)); }
/** Pool chủ — chỉ migration, seed, test setup. */
export function poolChu(): Pool { return (g.__stPoolChu ??= moPool(chuoiKetNoi(), 3)); }
export async function dongPool() { await Promise.all([g.__stPool?.end(), g.__stPoolChu?.end()]); g.__stPool = undefined; g.__stPoolChu = undefined; }
