import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FloatingControls } from "@/components/floating-controls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Priolo",
  description: "Sistem Penunjang Keputusan Pemrosesan Dokumen ULOK",
  icons: {
    icon: "/icons/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col transition-colors duration-300">
        
        {/* === BOUNDARY STATE SYSTEM === */}
        <ThemeProvider>
          {children}
          <FloatingControls />
        </ThemeProvider>
        
      </body>
    </html>
  );
}