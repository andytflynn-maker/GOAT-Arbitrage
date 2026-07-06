import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GOAT Arbitrage',
  description: 'Dealer intelligence for sealed card inventory',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
