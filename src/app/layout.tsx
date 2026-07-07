import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EGX Radar — رادار البورصة المصرية',
  description: 'منصة تحليل ذكية للبورصة المصرية — نتيجة رادار، فرص التداول، وضع السوق',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col market-bg-pattern"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        {children}
      </body>
    </html>
  );
}
