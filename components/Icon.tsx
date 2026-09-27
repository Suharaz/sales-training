// Icon SVG tự dựng (quy ước 6), stroke 1.8, 20px.
const D: Record<string, string> = {
  tong_quan: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  luyen_tap: "M4 5h16v11H8l-4 4V5zM8 9h8M8 12h5",
  cuoc_goi: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  huan_luyen: "M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5",
  kich_ban: "M6 3h9l4 4v14H6V3zM14 3v5h5M9 12h7M9 16h7",
  dao_tao: "M4 6h16v12H4zM4 18l8-3 8 3M12 6v9",
  bxh: "M8 21V10M12 21V4M16 21v-7M4 21h16",
  nhan_vien: "M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0",
  cai_dat: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  dang_xuat: "M10 17l5-5-5-5M15 12H3M21 3v18",
  tia: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  ngoi_sao: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z",
  cup: "M8 4h8v4a4 4 0 01-8 0V4zM6 5H4a3 3 0 003 3M18 5h2a3 3 0 01-3 3M12 12v4M9 20h6M10 16h4v4h-4z",
  lua: "M12 3c1 3 4 4 4 8a4 4 0 01-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-4 1-7z",
  check: "M5 12l4 4L19 6",
  x: "M6 6l12 12M18 6L6 18",
  mui_ten: "M5 12h14M13 6l6 6-6 6",
  quay_lai: "M19 12H5M11 6l-6 6 6 6",
  cong: "M12 5v14M5 12h14",
  chung_chi: "M6 3h12v13l-6-3-6 3V3zM9 7h6M9 10h6",
  dong_ho: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  robot: "M5 9h14v9H5zM9 3v3M15 3v3M9 13h.01M15 13h.01M3 12v3M21 12v3",
  mat_troi: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  mat_trang: "M21 13A9 9 0 1111 3a7 7 0 0010 10z",
  tim_kiem: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  tai_len: "M12 16V4M6 10l6-6 6 6M4 20h16",
  nhiem_vu: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  canh_bao: "M12 3l10 18H2L12 3zM12 10v4M12 18h.01",
};
export function Icon({ ten, size = 20, className = "" }: { ten: keyof typeof D | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={D[ten] ?? D.tong_quan} />
    </svg>
  );
}
