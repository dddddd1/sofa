import type { Metadata } from 'next';
import './globals.css';

const siteName = 'Harper Cloud';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${siteName} — Modular Sofas, Configured in 3D`,
    template: `%s | ${siteName}`,
  },
  description:
    'Design and price your modular sectional sofa in a live 3D configurator. Choose modules, performance fabrics, legs and power — real-time pricing with US delivery.',
  keywords: ['modular sofa', 'sectional configurator', '3d sofa builder', 'performance fabric couch'],
  openGraph: {
    siteName,
    type: 'website',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}