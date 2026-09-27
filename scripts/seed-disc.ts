// Chèn bộ kịch bản DISC mẫu cho sản phẩm đầu tiên của workspace demo nếu chưa có (dùng cho DB đã seed trước đợt DISC).
import { poolChu, dongPool } from "../db/ket-noi";
import { KB_DISC_MAU } from "../db/seed-disc";
async function main() {
  const p = poolChu(); await p.query("select set_config('app.nen_tang','1',false)");
  const ws = (await p.query<{ id: string }>("select id from workspace where slug = 'demo'")).rows[0];
  if (!ws) { console.log("Chưa có workspace demo"); return; }
  const sp = (await p.query<{ id: string }>("select id from san_pham where workspace_id = $1 order by tang limit 1", [ws.id])).rows[0];
  if (!sp) { console.log("Chưa có sản phẩm"); return; }
  let so = 0;
  for (const n of ["D", "I", "S", "C"]) { const r = await p.query("insert into kich_ban_disc(workspace_id, san_pham_id, nhom, noi_dung, trang_thai, che_do_ai) values ($1,$2,$3,$4,'da_duyet','seed') on conflict (san_pham_id, nhom) do nothing", [ws.id, sp.id, n, JSON.stringify(KB_DISC_MAU[n])]); so += r.rowCount ?? 0; }
  console.log(`Đã chèn ${so} kịch bản DISC mẫu.`);
}
main().then(dongPool).catch((e) => { console.error(e); process.exit(1); });
