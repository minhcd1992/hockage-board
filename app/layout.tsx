import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Học Kage Board',
  description: 'A Next.js based high-performance whiteboard application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
