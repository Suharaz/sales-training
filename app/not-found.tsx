import Link from "next/link";
export default function KhongTimThay() {
  return <div className="min-h-screen flex items-center justify-center p-6"><div className="the p-8 text-center"><div className="text-lg font-bold">Không tìm thấy trang</div><div className="mo-ta mt-1">Đường dẫn không tồn tại hoặc bạn không có quyền xem.</div><Link href="/" className="nut nut-chinh mt-4">Về tổng quan</Link></div></div>;
}
