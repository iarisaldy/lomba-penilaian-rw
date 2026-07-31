import type { Metadata } from 'next';
import './globals.css';
import { ScoreProvider } from '../context/ScoreContext';

export const metadata: Metadata = {
  title: 'Sistem Penilaian Lomba HUT RI ke-81 Permata Discovery',
  description: 'Aplikasi Rekapitulasi Penilaian Lomba Blind Rias Ibu-Ibu & Lomba RW secara otomatis dan real-time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
        <ScoreProvider>{children}</ScoreProvider>
      </body>
    </html>
  );
}
