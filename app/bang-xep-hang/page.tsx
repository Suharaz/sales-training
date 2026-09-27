import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { TheKpi } from "@/components/TheKpi";
import { nguCanhTrang } from "@/services/trang";
import { bangXepHang, diemCuaToi } from "@/services/diem";
import { datAnDanh } from "@/services/nhan-vien";
import { DIEM_SU_KIEN, GIOI_HAN_NGAY, HANG, TEN_SU_KIEN_DIEM, hangKeTiep, type SuKienDiem } from "@/core/gamification";
export const dynamic = "force-dynamic";
export default async function TrangBxh() {
  const { phien, ws } = await nguCanhTrang();
  const [bxh, toi, anDanh] = await ws(async (q) => Promise.all([bangXepHang(q, { nguoiXemId: phien.nguoiDungId, muiGio: phien.muiGio }), diemCuaToi(q, phien.nguoiDungId, phien.muiGio), (await q.query<{ an_danh_bxh: boolean }>("select an_danh_bxh from nguoi_dung where id = $1", [phien.nguoiDungId])).rows[0]?.an_danh_bxh ?? false]));
  async function doiAnDanh(form: FormData) { "use server"; const { phien, ws } = await nguCanhTrang(); await ws((q) => datAnDanh(q, { nguoiDungId: phien.nguoiDungId, anDanh: form.get("an_danh") === "1" })); revalidatePath("/bang-xep-hang"); }
  const ke = hangKeTiep(toi.diem);
  const mauHang: Record<string, string> = { Bronze: "nhan-vang", Silver: "nhan-xam", Gold: "nhan-vang", Diamond: "nhan-tim" };
  return (
    <KhungShell phien={phien} duongDan="/bang-xep-hang" tieuDe="Bảng xếp hạng & Gamification" moTa="Điểm cho hoạt động luyện tập, chuỗi ngày liên tiếp, hạng Bronze → Diamond. Tên hiển thị rút gọn; bạn có thể ẩn danh.">
      {phien.vaiTro === "sale" && <div className="luoi-kpi mb-4">
        <TheKpi ten="Điểm của bạn" giaTri={toi.diem.toLocaleString("vi-VN")} phu={ke ? `Còn ${ke.conThieu.toLocaleString("vi-VN")} điểm tới ${ke.ten}` : "Hạng cao nhất"} icon="cup" mau="var(--vang)" />
        <TheKpi ten="Hạng" giaTri={toi.hang} icon="ngoi_sao" mau="var(--tim)" />
        <TheKpi ten="Chuỗi ngày" giaTri={`${toi.chuoi} 🔥`} phu="một hoạt động mỗi ngày để giữ chuỗi" icon="lua" mau="var(--cam)" />
      </div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="the overflow-x-auto"><table className="bang"><thead><tr><th>#</th><th>Thành viên</th><th>Điểm</th><th>Chuỗi</th><th>Phiên</th><th>Điểm TB</th><th>Hạng</th></tr></thead>
          <tbody>{bxh.length === 0 ? <tr><td colSpan={7} className="text-center mo-ta py-6">Chưa có điểm nào.</td></tr> : bxh.map((b, i) => <tr key={b.nguoiDungId} style={b.laToi ? { background: "var(--nhan-mo)" } : undefined}><td className="tabular">{["🥇", "🥈", "🥉"][i] ?? i + 1}</td><td className="font-medium">{b.ten}{b.laToi && <span className="nhan nhan-nhan ml-2">Bạn</span>}</td><td className="tabular font-semibold">{b.diem.toLocaleString("vi-VN")}</td><td className="tabular">{b.chuoi ? `${b.chuoi} 🔥` : "—"}</td><td className="tabular">{b.phienLuyenTap}</td><td className="tabular">{b.diemTb ?? "—"}</td><td><span className={`nhan ${mauHang[b.hang]}`}>{b.hang}</span></td></tr>)}</tbody></table></div>
        <div className="flex flex-col gap-4">
          <div className="the p-4 text-sm"><div className="font-semibold mb-2">Quy tắc điểm</div><table className="bang"><tbody>{(Object.keys(DIEM_SU_KIEN) as SuKienDiem[]).map((k) => <tr key={k}><td className="text-xs">{TEN_SU_KIEN_DIEM[k]}</td><td className="tabular text-right font-semibold">+{DIEM_SU_KIEN[k]}</td><td className="text-[11px] text-right" style={{ color: "var(--chu-nhat)" }}>tối đa {GIOI_HAN_NGAY[k]}/ngày</td></tr>)}</tbody></table></div>
          <div className="the p-4 text-sm"><div className="font-semibold mb-2">Lộ trình thăng hạng</div><div className="flex items-center justify-between text-xs">{HANG.map((h, i) => <div key={h.ten} className="flex items-center gap-1"><span className={`nhan ${mauHang[h.ten]}`}>{h.ten}</span><span style={{ color: "var(--chu-nhat)" }}>{h.tu.toLocaleString("vi-VN")}+</span>{i < HANG.length - 1 && <span style={{ color: "var(--chu-nhat)" }}>→</span>}</div>)}</div></div>
          <form action={doiAnDanh} className="the p-4 text-sm flex items-center justify-between gap-2"><div><div className="font-semibold">Ẩn danh trên bảng</div><div className="text-xs" style={{ color: "var(--chu-mo)" }}>Người khác sẽ thấy «Thành viên #xxxx».</div></div><input type="hidden" name="an_danh" value={anDanh ? "0" : "1"} /><button className={`nut nut-nho ${anDanh ? "nut-chinh" : ""}`}>{anDanh ? "Đang ẩn · Bật lại tên" : "Ẩn danh"}</button></form>
          {phien.vaiTro === "sale" && toi.lichSu.length > 0 && <div className="the p-4 text-sm"><div className="font-semibold mb-2">Lịch sử điểm gần đây</div><div className="flex flex-col gap-1 text-xs">{toi.lichSu.slice(0, 10).map((l, i) => <div key={i} className="flex justify-between"><span>{TEN_SU_KIEN_DIEM[l.su_kien as SuKienDiem] ?? l.su_kien}</span><span className="tabular font-semibold">+{l.diem}</span></div>)}</div></div>}
        </div>
      </div>
    </KhungShell>
  );
}
