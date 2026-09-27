import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KhungShell } from "@/components/KhungShell";
import { Radar } from "@/components/Radar";
import { TheKpi } from "@/components/TheKpi";
import { ThongBaoAI } from "@/components/ThongBaoAI";
import { NhanDiem } from "@/components/NhanDiem";
import { nguCanhTrang, dinhDangNgay } from "@/services/trang";
import { hoSoKyNang, maTranDoi, goiHuanLuyenMoiNhat, sinhGoiHuanLuyen, thuVienDoanMau } from "@/services/huan-luyen";
import { danhSachPhien } from "@/services/luyen-tap";
import { danhSachCuocGoi } from "@/services/cuoc-goi";
import { KY_NANG, TEN_KY_NANG, xepTheoDiem } from "@/core/khung-ky-nang";
import { LOAI_PHAN_DOI, TEN_LOAI_PHAN_DOI } from "@/core/phan-doi";
import { giaoNhiemVu } from "@/services/cuoc-goi";
export const dynamic = "force-dynamic";
export default async function TrangHoSo({ params }: { params: Promise<{ id: string }> }) {
  const { id: idGoc } = await params;
  const { phien, ws } = await nguCanhTrang();
  const id = idGoc === "toi" ? phien.nguoiDungId : idGoc;
  if (id !== phien.nguoiDungId && phien.vaiTro !== "quan_ly") redirect("/huan-luyen/toi");
  const [hs, mt, goi, phienDs, goiDs, dm] = await ws(async (q) => Promise.all([hoSoKyNang(q, id), maTranDoi(q), goiHuanLuyenMoiNhat(q, id), danhSachPhien(q, { nguoiDungId: id, gioiHan: 8 }), danhSachCuocGoi(q, { nguoiDungId: id, gioiHan: 8 }), thuVienDoanMau(q, { trangThai: "da_duyet" })]));
  if (!hs) notFound();
  async function sinh() {
    "use server";
    const { phien, ws } = await nguCanhTrang();
    const muc = idGoc === "toi" ? phien.nguoiDungId : idGoc;
    if (muc !== phien.nguoiDungId && phien.vaiTro !== "quan_ly") return;
    await ws((q) => sinhGoiHuanLuyen(q, { workspaceId: phien.workspaceId, nguoiDungId: muc }));
    revalidatePath(`/huan-luyen/${idGoc}`);
  }
  async function giao(form: FormData) {
    "use server";
    const { phien, ws } = await nguCanhTrang(); if (phien.vaiTro !== "quan_ly") return;
    const pd = String(form.get("phan_doi") ?? "");
    const han = String(form.get("han") ?? "");
    await ws((q) => giaoNhiemVu(q, { workspaceId: phien.workspaceId, nguoiGiaoId: phien.nguoiDungId, nguoiDungId: id, noiDung: String(form.get("noi_dung") ?? ""), han: han ? new Date(han) : null, loai: pd ? "bai_tap" : "viec", lienKet: pd ? `/luyen-tap/moi?phan_doi=${pd}` : null }));
    revalidatePath(`/huan-luyen/${idGoc}`);
  }
  const yeu = hs.radar ? xepTheoDiem(hs.radar).slice(0, 3) : [];
  const dmNenNghe = goi ? dm.filter((d) => goi.noi_dung.bai_tap.some((b) => b.loai_phan_doi === d.loai_phan_doi)).slice(0, 4) : [];
  return (
    <KhungShell phien={phien} duongDan="/huan-luyen" tieuDe={id === phien.nguoiDungId ? "Huấn luyện của tôi" : hs.ten} moTa={`${hs.chucDanh || "Sale"} · ${hs.soPhien} phiên role-play · ${hs.soCuocGoi} cuộc gọi · 90 ngày`}
      hanhDong={<form action={sinh}><button className="nut nut-chinh">{goi ? "Sinh lại gói huấn luyện" : "Nhờ AI sinh gói huấn luyện"}</button></form>}>
      <div className="luoi-kpi mb-4">
        <TheKpi ten="Điểm TB" giaTri={hs.diemTb ?? "—"} phu={hs.diemTuan != null && hs.diemTuanTruoc != null ? `${hs.diemTuan - hs.diemTuanTruoc >= 0 ? "▲" : "▼"} ${Math.abs(hs.diemTuan - hs.diemTuanTruoc)} so với tuần trước` : "Chưa đủ dữ liệu"} icon="ngoi_sao" mau="var(--nhan)" />
        <TheKpi ten="Tỷ lệ thắng" giaTri={hs.tyLeThang != null ? `${hs.tyLeThang}%` : "—"} icon="cup" mau="var(--xanh)" />
        <TheKpi ten="Ưu tiên luyện" giaTri={yeu[0] ? TEN_KY_NANG[yeu[0]] : "—"} phu={yeu[0] && hs.radar ? `${hs.radar[yeu[0]]}/100` : undefined} icon="huan_luyen" mau="var(--cam)" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="the p-4"><div className="font-semibold mb-2">Radar so với đội</div>
            {hs.radar ? <Radar lop={[{ ten: hs.ten.split(" ").slice(-1)[0], diem: hs.radar, mau: "#3b82f6", dam: true }, ...(mt.radarDoi ? [{ ten: "Đội", diem: mt.radarDoi, mau: "#64748b" }] : []), ...(mt.top20 ? [{ ten: "Top 20%", diem: mt.top20, mau: "#8b5cf6" }] : [])]} size={280} /> : <div className="mo-ta py-8 text-center">Chưa có bản chấm nào.</div>}</div>
          <div className="the p-4"><div className="font-semibold mb-2">Phiên gần đây</div>{phienDs.length === 0 ? <div className="mo-ta">—</div> : <div className="flex flex-col gap-1 text-sm">{phienDs.map((p) => <Link key={p.id} href={`/luyen-tap/${p.id}`} className="flex justify-between py-1 border-b" style={{ borderColor: "var(--vien)" }}><span className="truncate">{p.persona.ten}</span>{p.trang_thai === "xong" ? <NhanDiem diem={p.diem_tong} nhoGon /> : <span className="nhan nhan-xam">{p.trang_thai}</span>}</Link>)}</div>}</div>
          <div className="the p-4"><div className="font-semibold mb-2">Cuộc gọi gần đây</div>{goiDs.length === 0 ? <div className="mo-ta">—</div> : <div className="flex flex-col gap-1 text-sm">{goiDs.map((c) => <Link key={c.id} href={`/cuoc-goi/${c.id}`} className="flex justify-between py-1 border-b" style={{ borderColor: "var(--vien)" }}><span className="truncate">{c.ten_khach || dinhDangNgay(c.goi_luc, phien.muiGio)}</span><NhanDiem diem={c.diem_tong} nhoGon /></Link>)}</div>}</div>
        </div>
        <div className="flex flex-col gap-4">
          {!goi ? <div className="the p-8 text-center"><div className="font-semibold text-lg">Chưa có gói huấn luyện cá nhân</div><div className="mo-ta mt-1">AI sẽ đọc radar, nhận xét từ các phiên và phản đối hay gặp để đề xuất bài học, bài tập role-play và lời khuyên.</div><form action={sinh} className="mt-4"><button className="nut nut-chinh">Sinh gói ngay</button></form></div> : (
            <>
              <div className="the p-5"><div className="flex items-center justify-between mb-2"><div className="font-semibold">Gói huấn luyện cá nhân</div><span className="text-xs" style={{ color: "var(--chu-mo)" }}>{dinhDangNgay(goi.tao_luc, phien.muiGio)}</span></div>
                <p className="text-sm leading-relaxed">{goi.noi_dung.tom_tat}</p>
                <div className="flex flex-wrap gap-1 mt-2">{goi.noi_dung.diem_yeu.map((k) => <span key={k} className="nhan nhan-do">{TEN_KY_NANG[k]}</span>)}</div>
                <div className="mt-3"><ThongBaoAI cheDo={goi.che_do_ai} /></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="the p-4"><div className="font-semibold mb-2">Bài tập role-play</div><div className="flex flex-col gap-2">{goi.noi_dung.bai_tap.map((b, i) => (
                  <div key={i} className="the-2 p-3 text-sm"><div className="font-semibold">{b.ten}</div><div className="text-xs mt-1" style={{ color: "var(--chu-mo)" }}>{b.tinh_huong}</div><div className="text-xs mt-1">Mục tiêu: {b.muc_tieu}</div>
                    {id === phien.nguoiDungId && <Link href={`/luyen-tap/moi?phan_doi=${b.loai_phan_doi}`} className="nut nut-nho nut-chinh mt-2">Luyện ngay · {TEN_LOAI_PHAN_DOI[b.loai_phan_doi]}</Link>}</div>))}</div></div>
                <div className="flex flex-col gap-4">
                  <div className="the p-4"><div className="font-semibold mb-2">Bài học đề xuất</div><ul className="text-sm flex flex-col gap-2">{goi.noi_dung.bai_de_xuat.map((b, i) => <li key={i}><Link href="/dao-tao" className="font-medium hover:underline">{b.tieu_de}</Link><div className="text-xs" style={{ color: "var(--chu-mo)" }}>{b.ly_do}</div></li>)}</ul></div>
                  <div className="the p-4"><div className="font-semibold mb-2">Lời khuyên</div><ul className="text-sm list-disc pl-4 flex flex-col gap-1">{goi.noi_dung.loi_khuyen.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
                </div>
              </div>
              {dmNenNghe.length > 0 && <div className="the p-4"><div className="font-semibold mb-2">Đoạn mẫu nên học thuộc</div><div className="grid gap-2 md:grid-cols-2">{dmNenNghe.map((d) => <div key={d.id} className="the-2 p-3 text-sm"><span className="nhan nhan-xanh mr-1">{TEN_LOAI_PHAN_DOI[d.loai_phan_doi as keyof typeof TEN_LOAI_PHAN_DOI] ?? d.loai_phan_doi}</span>“{d.noi_dung}”</div>)}</div></div>}
            </>)}
          {phien.vaiTro === "quan_ly" && id !== phien.nguoiDungId && (
            <form action={giao} className="the p-4 text-sm flex flex-col gap-2"><div className="font-semibold">Phân công coaching: giao bài tập cho {hs.ten.split(" ").slice(-1)[0]}</div>
              <input name="noi_dung" className="o-nhap" placeholder="Ví dụ: Luyện 2 phiên role-play xử lý phản đối giá, đạt ≥ 80" required />
              <div className="flex flex-wrap gap-2"><select name="phan_doi" className="o-nhap w-56"><option value="">Việc thường (không gắn role-play)</option>{LOAI_PHAN_DOI.filter((l) => l !== "khac").map((l) => <option key={l} value={l}>Role-play: {TEN_LOAI_PHAN_DOI[l]}</option>)}</select><input name="han" type="date" className="o-nhap w-44" /><button className="nut nut-chinh">Giao</button></div>
            </form>)}
          {hs.radar && <div className="the p-4"><div className="font-semibold mb-2">Chi tiết 6 tiêu chí</div><table className="bang"><tbody>{KY_NANG.map((k) => <tr key={k}><td className="font-medium">{TEN_KY_NANG[k]}</td><td className="w-48"><div className="thanh"><i style={{ width: `${hs.radar![k]}%`, background: hs.radar![k] >= 80 ? "var(--xanh)" : hs.radar![k] >= 65 ? "var(--vang)" : "var(--do)" }} /></div></td><td className="tabular text-right font-semibold w-12">{hs.radar![k]}</td><td className="tabular text-xs" style={{ color: "var(--chu-mo)" }}>đội {mt.radarDoi?.[k] ?? "—"}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </KhungShell>
  );
}
