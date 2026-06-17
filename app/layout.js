import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "7AM Gradebook",
  description:
    "A modern attendance management tool for school teachers. Track student attendance, mark holidays, and generate monthly reports.",
  keywords: ["attendance", "teacher", "school", "students", "calendar"],
  appleWebApp: {
    title: "7AM Gradebook",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#9333ea',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} style={{ background: '#f9fafb' }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
      </head>
      <body style={{ background: '#f9fafb', minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
