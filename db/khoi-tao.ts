// Áp migration theo thứ tự tên file trong db/migrations (mỗi file một transaction, ghi migration_da_chay).
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { poolChu, dongPool, chuoiKetNoi } from "./ket-noi";

export async function apMigration(): Promise<number> {
  const p = poolChu();
  await p.query("create table if not exists migration_da_chay (ten text primary key, luc timestamptz not null default now())");
  const thuMuc = fileURLToPath(new URL("./migrations/", import.meta.url));
  const files = readdirSync(thuMuc).filter((f) => f.endsWith(".sql")).sort();
  const daChay = new Set<string>((await p.query("select ten from migration_da_chay")).rows.map((r) => r.ten));
  let so = 0;
  for (const f of files) {
    if (daChay.has(f)) continue;
    const c = await p.connect();
    try {
      await c.query("begin");
      await c.query(readFileSync(`${thuMuc}${f}`, "utf8"));
      await c.query("insert into migration_da_chay(ten) values ($1)", [f]);
      await c.query("commit");
      console.log("✓", f); so++;
    } catch (e) { await c.query("rollback"); console.error("✗", f); throw e; } finally { c.release(); }
  }
  return so;
}
if (process.argv[1] && /khoi-tao\.ts$/.test(process.argv[1])) {
  apMigration().then(async (so) => {
    console.log(so ? `Đã áp ${so} migration vào ${chuoiKetNoi().replace(/\/\/[^@/]+@/, "//***@")}` : "Không có migration mới");
    await dongPool();
  }).catch((e) => { console.error(e); process.exit(1); });
}
