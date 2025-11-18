import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstatePro - Premium Real Estate Services",
  description: "Transform your real estate vision into reality with our comprehensive consultation, design, and marketing services.",
  keywords: ["Real Estate", "Property", "Consultation", "Design", "Marketing", "Premium Properties"],
  authors: [{ name: "EstatePro Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "EstatePro - Premium Real Estate Services",
    description: "Transform your real estate vision into reality with our comprehensive services",
    url: "https://chat.z.ai",
    siteName: "EstatePro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EstatePro - Premium Real Estate Services",
    description: "Transform your real estate vision into reality",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
