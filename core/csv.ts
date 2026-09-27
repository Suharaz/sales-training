// Xuất CSV an toàn cho Excel tiếng Việt: BOM UTF-8, dấu phẩy, escape ngoặc kép, chặn công thức.
export function dongCsv(o: unknown[]): string {
  return o.map((v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // chặn CSV injection
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",");
}
export function taoCsv(tieuDe: string[], hang: unknown[][]): string {
  return "﻿" + [dongCsv(tieuDe), ...hang.map(dongCsv)].join("\r\n");
}
