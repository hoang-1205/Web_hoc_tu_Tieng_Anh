import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';

export const metadata: Metadata = {
  title: 'VocabQuest — Nền Tảng Học Từ Vựng Game Hóa Thông Minh',
  description: 'Học tiếng Anh chuẩn ngữ pháp qua các trò chơi tương tác, họ từ vựng (Word Families) và thuật toán lặp lại ngắt quãng SM-2 SRS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
