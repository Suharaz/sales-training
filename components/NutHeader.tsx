"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
export function NutTheme() {
  const [toi, setToi] = useState(false);
  useEffect(() => { try { setToi(document.documentElement.getAttribute("data-theme") === "dark"); } catch { /* bỏ qua */ } }, []);
  const doi = () => {
    const moi = !toi; setToi(moi);
    try { if (moi) { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem("st_theme", "dark"); } else { document.documentElement.removeAttribute("data-theme"); localStorage.setItem("st_theme", "light"); } } catch { /* bỏ qua */ }
  };
  return <button type="button" className="nut nut-nho" onClick={doi} title={toi ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}><Icon ten={toi ? "mat_troi" : "mat_trang"} size={16} /></button>;
}
export function NutDangXuat() {
  const router = useRouter();
  const [dang, setDang] = useState(false);
  return (
    <button type="button" className="nut nut-nho" disabled={dang} title="Đăng xuất" onClick={async () => { setDang(true); await fetch("/api/dang-xuat", { method: "POST" }); router.push("/dang-nhap"); router.refresh(); }}>
      <Icon ten="dang_xuat" size={16} />
    </button>
  );
}
