import { redirect } from "next/navigation";
import { KhungShell } from "@/components/KhungShell";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { NutCho } from "@/components/NutCho";
import { nguCanhTrang } from "@/services/trang";
import { danhSachSanPham } from "@/services/kich-ban";
import { danhSachNhanVien } from "@/services/nhan-vien";
import { napVaPhanTich, type CuocGoi } from "@/services/cuoc-goi";
import { cheDoAI } from "@/services/ai-gateway";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const MAU = `Trần Minh Đức: Dạ chào anh A, em là Đức bên Công ty Demo. Anh vừa tham gia webinar tối qua đúng không ạ? Anh thấy phần nào hữu ích nhất?
Nguyễn Văn A: Phần chuỗi email tự động. Bên anh đang mất nhiều lead lắm.
Trần Minh Đức: Dạ em hiểu, tức là lead vào nhưng không ai chăm kịp đúng không ạ? Hiện đội anh có mấy người?
Nguyễn Văn A: Ba bạn sale. Nhưng giá khóa 19,8 triệu hơi cao so với ngân sách bên anh.
Trần Minh Đức: Dạ em ghi nhận, mức đầu tư này cần cân nhắc là đúng ạ. Học viên trước của em tiết kiệm 30% thời gian chăm sóc sau 2 tháng. Mình chia 3 kỳ được, anh thấy phù hợp không ạ?
Nguyễn Văn A: Chia 3 kỳ thì được.
Trần Minh Đức: Dạ, em gửi anh lộ trình và bảng chia kỳ ngay sau cuộc gọi, em hẹn gọi lại anh thứ 5 lúc 10h để chốt nhé?
Nguyễn Văn A: Ok em.`;
export default async function TrangNapCuocGoi({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  const { phien, ws } = await nguCanhTrang();
  const [sp, nv] = await ws(async (q) => Promise.all([danhSachSanPham(q), phien.vaiTro === "quan_ly" ? danhSachNhanVien(q) : Promise.resolve([])]));
  const { loi } = await searchParams;
  async function nap(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang();
    const saleId = phien.vaiTro === "quan_ly" && form.get("nguoi_dung_id") ? String(form.get("nguoi_dung_id")) : phien.nguoiDungId;
    let id = "";
    try {
      const r = await ws(async (q) => {
        const nd = (await q.query<{ ten: string }>("select ten from nguoi_dung where id = $1", [saleId])).rows[0];
        if (!nd) throw new Error("Không tìm thấy nhân viên");
        const phutGiay = String(form.get("thoi_luong") ?? "").trim();
        const [m, s] = phutGiay.split(":").map(Number);
        const thoiLuong = phutGiay ? (Number.isFinite(m) ? m * 60 + (Number.isFinite(s) ? s : 0) : null) : null;
        const goiLucStr = String(form.get("goi_luc") ?? "");
        return napVaPhanTich(q, { workspaceId: phien.workspaceId, nguoiDungId: saleId, tenSale: nd.ten, sanPhamId: String(form.get("san_pham_id") ?? "") || null, tenKhach: String(form.get("ten_khach") ?? ""),
          ketQua: (["thang", "thua", "hen", "khac"].includes(String(form.get("ket_qua"))) ? String(form.get("ket_qua")) : "khac") as CuocGoi["ket_qua"], transcript: String(form.get("transcript") ?? ""), thoiLuongGiay: thoiLuong, goiLuc: goiLucStr ? new Date(goiLucStr) : undefined, muiGio: phien.muiGio });
      });
      id = r.id;
    } catch (e) { redirect(`/cuoc-goi/moi?loi=${encodeURIComponent((e as Error).message)}`); }
    redirect(`/cuoc-goi/${id}`);
  }
  return (
    <KhungShell phien={phien} duongDan="/cuoc-goi" tieuDe="Nạp cuộc gọi" moTa="Dán transcript (từ tổng đài, Remin Note, hoặc gõ tay). Mỗi dòng «Tên người nói: nội dung». AI phân tích ngay khi nạp (20–60 giây).">
      <form action={nap} className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="the p-5 flex flex-col gap-3">
          {loi && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--do-mo)", color: "var(--chu-do)" }}>{loi}</div>}
          <label className="flex flex-col gap-1 text-sm"><span className="font-medium">Transcript</span><textarea name="transcript" required className="o-nhap font-mono text-[13px]" rows={18} placeholder={MAU} defaultValue="" /></label>
          <div className="text-xs" style={{ color: "var(--chu-mo)" }}>Dòng bắt đầu bằng tên có chữ «sale», «NV», «tư vấn» hoặc trùng tên nhân viên được xem là lượt của sale; còn lại là khách. Timecode «[00:12]» được bỏ qua.</div>
        </div>
        <div className="the p-5 flex flex-col gap-3 text-sm">
          <ThongBaoAI cheDo={cheDoAI()} />
          {phien.vaiTro === "quan_ly" && <label className="flex flex-col gap-1"><span className="font-medium">Nhân viên gọi</span><select name="nguoi_dung_id" className="o-nhap" defaultValue={phien.nguoiDungId}>{nv.map((n) => <option key={n.id} value={n.id}>{n.ten}{n.vai_tro === "quan_ly" ? " (quản lý)" : ""}</option>)}</select></label>}
          <label className="flex flex-col gap-1"><span className="font-medium">Tên khách / công ty</span><input name="ten_khach" className="o-nhap" placeholder="Cty ABC — Nguyễn Văn A" /></label>
          <label className="flex flex-col gap-1"><span className="font-medium">Sản phẩm</span><select name="san_pham_id" className="o-nhap" defaultValue={sp[0]?.id ?? ""}>{sp.map((s) => <option key={s.id} value={s.id}>{s.ten}</option>)}<option value="">(Không rõ)</option></select></label>
          <label className="flex flex-col gap-1"><span className="font-medium">Kết quả</span><select name="ket_qua" className="o-nhap" defaultValue="hen"><option value="thang">Thắng (chốt)</option><option value="hen">Hẹn lại</option><option value="thua">Thua</option><option value="khac">Khác</option></select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="font-medium">Thời lượng</span><input name="thoi_luong" className="o-nhap" placeholder="23:18" /></label>
            <label className="flex flex-col gap-1"><span className="font-medium">Lúc gọi</span><input name="goi_luc" type="datetime-local" className="o-nhap" /></label>
          </div>
          <NutCho dangLam="AI đang phân tích cuộc gọi (20–60 giây)…" className="nut nut-chinh justify-center py-2.5">Nạp và phân tích</NutCho>
          <div className="text-[11px]" style={{ color: "var(--chu-mo)" }}>Điểm cuộc gọi chỉ quản lý và chính sale xem được. Phản đối mới AI phát hiện vào hàng chờ duyệt, không tự sửa kho.</div>
        </div>
      </form>
    </KhungShell>
  );
}
