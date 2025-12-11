import type { Metadata } from "next";
import {
  Noto_Serif_KR,
  Noto_Sans_KR,
  Nanum_Pen_Script,
  Merriweather,
} from "next/font/google";
import "./globals.css";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

const notoSerifKr = Noto_Serif_KR({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-kr",
});

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
});

const nanumPen = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-nanum-pen",
});

export const metadata: Metadata = {
  title: "Today's Page | 오늘의 한 페이지",
  description: "Create your AI character and battle daily.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${merriweather.variable} ${notoSerifKr.variable} ${notoSansKr.variable} ${nanumPen.variable} antialiased pb-20`}
      >
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="min-h-screen max-w-3xl mx-auto px-4">
              {children}
            </main>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
