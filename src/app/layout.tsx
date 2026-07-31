import type { Metadata } from 'next';
import './globals.css';
import { ScoreProvider } from '../context/ScoreContext';

export const metadata: Metadata = {
  title: 'Permata Discovery — Sistem Penilaian Lomba Blind Rias HUT RI Ke-81',
  description: 'Aplikasi Rekapitulasi Penilaian Lomba Blind Rias Ibu-Ibu & Lomba RW secara otomatis dan real-time.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
        <ScoreProvider>{children}</ScoreProvider>
      </body>
    </html>
  );
}
