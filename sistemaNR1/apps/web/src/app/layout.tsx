import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SistemaNR1 — Gestão de riscos ocupacionais',
  description:
    'Ambiente demonstrativo do SistemaNR1. Módulos em desenvolvimento.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
