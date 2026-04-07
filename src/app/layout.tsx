import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dịch Vụ Diệt Côn Trùng Tại Hà Nội — Diệt Gián Đức, Chuột, Mối | Lá Chắn Xanh",
  description:
    "Công ty diệt côn trùng chuyên nghiệp tại Hà Nội. Chuyên diệt gián Đức bằng gel bả nhập ngoại Maxforce, Advion — hiệu quả dây chuyền, không mùi. Dịch vụ diệt mối, chuột, muỗi, kiến, ruồi. Phương pháp IPM an toàn. Khảo sát miễn phí — Bảo hành cam kết.",
  keywords: [
    "diệt côn trùng",
    "diệt côn trùng Hà Nội",
    "công ty diệt côn trùng",
    "diệt gián Đức",
    "diệt gián Đức Hà Nội",
    "gel bả diệt gián",
    "diệt gián Đức bằng gel bả",
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
    title: "Diệt Gián Đức & Côn Trùng Chuyên Nghiệp Tại Hà Nội | Lá Chắn Xanh",
    description:
      "Chuyên diệt gián Đức bằng gel bả nhập ngoại. Diệt mối, chuột, muỗi cho gia đình & doanh nghiệp tại Hà Nội. Khảo sát miễn phí — Bảo hành cam kết.",
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

const jsonLdBusiness = {
  "@context": "https://schema.org",
  "@type": "PestControlService",
  name: "Lá Chắn Xanh — GreenShield JSC",
  alternateName: "GreenShield JSC",
  description:
    "Công ty diệt côn trùng chuyên nghiệp tại Hà Nội. Chuyên diệt gián Đức bằng gel bả nhập ngoại, diệt mối, chuột, muỗi bằng phương pháp IPM an toàn.",
  url: "https://greenshield.com.vn",
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
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Dịch vụ diệt gián Đức",
          description: "Diệt gián Đức (Blattella germanica) bằng gel bả nhập ngoại Maxforce, Advion. Hiệu quả dây chuyền, không mùi, an toàn thực phẩm. Bảo hành 30 ngày.",
        },
      },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dịch vụ diệt mối" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dịch vụ diệt chuột" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dịch vụ diệt muỗi" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Phun khử trùng, khử khuẩn" } },
    ],
  },
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Gián Đức khác gián thường như thế nào?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gián Đức (Blattella germanica) có kích thước nhỏ 1.3-1.6cm, màu nâu vàng, sinh sản cực nhanh — mỗi con cái đẻ 30-40 trứng mỗi lần và sống được 6-9 tháng. Chúng thường sống trong khe tủ bếp, thiết bị điện, hộp carton. Khác với gián Mỹ (gián bay, 3-4cm), gián Đức không bay được nhưng lây lan nhanh hơn rất nhiều.",
      },
    },
    {
      "@type": "Question",
      name: "Tại sao phun thuốc không diệt được gián Đức?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gián Đức đã kháng hầu hết thuốc phun truyền thống. Khi phun, gián trốn sâu vào khe kẽ và quay lại sau 1-2 tuần. Phương pháp hiệu quả nhất là gel bả chuyên dụng (Maxforce, Advion) — gián ăn bả, về tổ chết, đồng loại ăn xác tiếp tục trúng độc. Đây gọi là hiệu ứng dây chuyền, diệt được cả tổ gián.",
      },
    },
    {
      "@type": "Question",
      name: "Giá dịch vụ diệt gián Đức tại Hà Nội bao nhiêu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chi phí diệt gián Đức phụ thuộc vào diện tích và mức độ nhiễm. Lá Chắn Xanh khảo sát miễn phí tại nhà trước khi báo giá. Gói đơn lẻ từ 300.000đ, gói định kỳ tiết kiệm 15-25%. Gel bả nhập ngoại có hiệu quả 3-5 ngày, bảo hành 30 ngày.",
      },
    },
    {
      "@type": "Question",
      name: "Thuốc diệt gián Đức có an toàn cho trẻ nhỏ không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gel bả diệt gián Đức được bơm vào khe kẽ tủ bếp, gầm chậu rửa — những vị trí trẻ nhỏ và thú cưng không tiếp cận được. Sản phẩm Maxforce, Advion đều có chứng nhận an toàn cho gia đình. Không bay hơi, không mùi, không cần di tản khi xử lý.",
      },
    },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      </head>
      <body className="font-sans">
          {children}
          <Toaster position="top-right" richColors />
        </body>
    </html>
  );
}
