import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lá Chắn Xanh - Dịch vụ diệt côn trùng chuyên nghiệp",
  description:
    "GreenShield JSC - Công ty dịch vụ diệt côn trùng chuyên nghiệp. Diệt mối, muỗi, gián, chuột, kiến và các loại côn trùng gây hại.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Montserrat:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
          {children}
          <Toaster position="top-right" richColors />
        </body>
    </html>
  );
}
