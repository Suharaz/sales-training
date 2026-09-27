import type { KichBanDisc, NhomDisc } from "@/core/disc";
export function FormKichBanDisc({ action, sanPhamId, nhom, kb, chiXem, daDuyet }: { action: (f: FormData) => void; sanPhamId: string; nhom: NhomDisc; kb: KichBanDisc; chiXem: boolean; daDuyet: boolean }) {
  const ro = chiXem ? { readOnly: true } : {};
  const O = ({ ten, name, rows, gia_tri, goiY }: { ten: string; name: string; rows: number; gia_tri: string; goiY?: string }) => (
    <label className="flex flex-col gap-1 text-sm"><span className="font-semibold">{ten}</span>{goiY && <span className="text-[11px]" style={{ color: "var(--chu-nhat)" }}>{goiY}</span>}<textarea name={name} className="o-nhap" rows={rows} defaultValue={gia_tri} {...ro} /></label>);
  return (
    <form action={action} className="the p-4 flex flex-col gap-3" key={`${sanPhamId}-${nhom}`}>
      <input type="hidden" name="san_pham_id" value={sanPhamId} /><input type="hidden" name="nhom" value={nhom} />
      <O ten="1. Mở đầu 30 giây" name="mo_dau" rows={3} gia_tri={kb.mo_dau} />
      <O ten="2. Câu hỏi khai thác (mỗi dòng một câu)" name="khai_thac" rows={5} gia_tri={kb.khai_thac.join("\n")} />
      <O ten="3. Trình bày giá trị" name="gia_tri" rows={5} gia_tri={kb.gia_tri} />
      <O ten="4. Xử lý phản đối điển hình" name="phan_doi" rows={12} goiY="Mỗi phản đối một khối, cách nhau một dòng trống: dòng đầu «Khách: …», các dòng sau «Sale: …»" gia_tri={kb.phan_doi.map((p) => `Khách: ${p.cau_khach}\nSale: ${p.cau_tra_loi}`).join("\n\n")} />
      <O ten="5. Chốt" name="chot" rows={3} gia_tri={kb.chot} />
      <O ten="6. Theo dõi sau cuộc gọi" name="theo_doi" rows={2} gia_tri={kb.theo_doi} />
      <div className="grid gap-3 md:grid-cols-2"><O ten="Từ nên dùng (mỗi dòng một cụm)" name="tu_nen_dung" rows={5} gia_tri={kb.tu_nen_dung.join("\n")} /><O ten="Từ nên tránh (mỗi dòng một cụm)" name="tu_tranh" rows={5} gia_tri={kb.tu_tranh.join("\n")} /></div>
      {!chiXem && <div className="flex gap-2"><button name="hanh_dong" value="luu" className="nut">Lưu nháp</button><button name="hanh_dong" value="duyet" className="nut nut-chinh">{daDuyet ? "Lưu và giữ duyệt" : "Lưu và duyệt"}</button></div>}
    </form>
  );
}
