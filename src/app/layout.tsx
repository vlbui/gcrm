import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dịch vụ diệt côn trùng tại Hà Nội | Lá Chắn Xanh — GreenShield JSC",
  description:
    "Công ty diệt côn trùng chuyên nghiệp tại Hà Nội. Dịch vụ diệt mối, gián, chuột, muỗi, kiến, ruồi cho gia đình và doanh nghiệp. Phương pháp IPM an toàn, hóa chất nhập ngoại. Khảo sát miễn phí — Bảo hành cam kết.",
  keywords: [
    "diệt côn trùng",
    "diệt côn trùng Hà Nội",
    "công ty diệt côn trùng",
    "dịch vụ diệt mối",
    "diệt gián",
    "diệt chuột",
    "diệt muỗi",
    "kiểm soát côn trùng",
    "phun thuốc diệt côn trùng",
    "diệt mối tận gốc",
    "IPM",
    "Lá Chắn Xanh",
    "GreenShield",
    "pest control Hanoi",
  ],
  openGraph: {
    title: "Dịch vụ diệt côn trùng chuyên nghiệp | Lá Chắn Xanh",
    description:
      "Kiểm soát côn trùng bằng phương pháp IPM tiên tiến. Diệt mối, gián, chuột, muỗi cho gia đình & doanh nghiệp tại Hà Nội. Khảo sát miễn phí.",
    type: "website",
    locale: "vi_VN",
    siteName: "Lá Chắn Xanh — GreenShield JSC",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "PestControlService",
  name: "Lá Chắn Xanh — GreenShield JSC",
  alternateName: "GreenShield JSC",
  description:
    "Công ty dịch vụ diệt côn trùng chuyên nghiệp tại Hà Nội. Diệt mối, gián, chuột, muỗi, kiến bằng phương pháp IPM an toàn.",
  url: "https://lachaxanh.vn",
  telephone: "+84859955969",
  email: "greenshield.jsc@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Số 7, ngõ 125 Trung Kính, Yên Hòa",
    addressLocality: "Cầu Giấy",
    addressRegion: "Hà Nội",
    addressCountry: "VN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 21.0135,
    longitude: 105.7962,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
  areaServed: {
    "@type": "City",
    name: "Hà Nội",
  },
  priceRange: "$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "300",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Dịch vụ kiểm soát côn trùng",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diệt mối" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diệt gián" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diệt chuột" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diệt muỗi" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Phun khử trùng" } },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
          {children}
          <Toaster position="top-right" richColors />
        </body>
    </html>
  );
}
