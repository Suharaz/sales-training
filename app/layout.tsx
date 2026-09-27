import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { ThanhTienTrinh } from "@/components/ThanhTienTrinh";
export const metadata: Metadata = { title: "TAKI Sales Training", description: "Nền tảng huấn luyện đội sale bằng AI: role-play, phân tích cuộc gọi, kịch bản, đào tạo và gamification." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('st_theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}` }} />
      </head>
      <body><Suspense fallback={null}><ThanhTienTrinh /></Suspense>{children}</body>
    </html>
  );
}
