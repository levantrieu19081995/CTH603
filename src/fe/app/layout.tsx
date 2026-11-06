import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dự đoán nguy cơ đột quỵ - CT603",
  description: "Đồ án môn Khai phá dữ liệu: so sánh Decision Tree, kNN, SVM trên dữ liệu Stroke Prediction",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden">
        <AppHeader />
        <div className="flex-1 overflow-y-auto scroll-an">
          <PageTransition>{children}</PageTransition>
        </div>
      </body>
    </html>
  );
}
