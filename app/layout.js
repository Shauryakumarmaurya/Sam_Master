import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Student Attendance Manager",
  description:
    "A modern attendance management tool for school teachers. Track student attendance, mark holidays, and generate monthly reports.",
  keywords: ["attendance", "teacher", "school", "students", "calendar"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} style={{ background: '#f9fafb' }}>
      <body style={{ background: '#f9fafb', minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
