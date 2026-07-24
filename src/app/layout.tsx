import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_DESC, SITE_URL } from "@/lib/constants";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

// 全站 Organization 结构化数据（富结果/品牌实体）
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  description: SITE_DESC,
  sameAs: [],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - ${SITE_DESC}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: ["厦门培训", "培训机构", "辅导班", "兴趣班", "职业技能培训", "考证培训", "厦门教育"],
  robots: { index: true, follow: true },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - ${SITE_DESC}`,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - ${SITE_DESC}`,
    description: SITE_DESC,
  },
  other: {
    "shenma-site-verification": "060c2f318442b4f1d984aff99a9f4b85_1784899635",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* 字节跳动（抖音/头条搜索）自动收录脚本 */}
      <Script
        id="ttzz"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){var el=document.createElement("script");el.src="https://lf1-cdn-tos.bytegoofy.com/goofy/ttzz/push.js?6a6aea4419cd60cad4aa86de155154eec9c7fcb5b0f7cc19838651853541c70e19d1c501ebd3301f5e2290626f5b53d078c8250527fa0dfd9783a026ff3cf719";el.id="ttzz";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(el,s);})(window)`,
        }}
      />
      {/* Microsoft Clarity 热力图 / 行为分析 */}
      <Script
        id="ms-clarity"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","xrh3evz7uo");`,
        }}
      />
      <body className={`${geistSans.variable} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <JsonLd data={organizationLd} />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
