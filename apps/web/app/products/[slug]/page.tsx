import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  HARPER_CATALOG,
  HARPER_SERIES_ID,
  HARPER_TEMPLATES,
  HARPER_COLORWAYS,
} from '@harper/core';
import { Configurator } from '../../../components/Configurator';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ slug: HARPER_SERIES_ID }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== HARPER_SERIES_ID) return {};
  return {
    title: 'Harper Cloud Modular Sectional — 3D Configurator',
    description:
      'Configure the Harper Cloud modular sectional in 3D. Choose from 6 modules, 5 fabric grades, 3 leg options and optional power — priced in real time.',
    openGraph: {
      title: 'Harper Cloud Modular Sectional — 3D Configurator',
      description:
        'Build a sectional to your exact layout with live 3D preview and real-time pricing.',
      type: 'website',
    },
  };
}

function productJsonLd() {
  const display = HARPER_CATALOG.modules[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Harper Cloud Modular Sectional',
    description:
      'Modular sectional configurable in 3D — multiple fabric grades, leg options and power modules.',
    brand: { '@type': 'Brand', name: 'Harper Cloud' },
    offers: {
      '@type': 'Offer',
      priceCurrency: HARPER_CATALOG.currency,
      price: display ? String(display.basePriceMinor / 100) : undefined,
      availability: 'https://schema.org/InStock',
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== HARPER_SERIES_ID) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd()) }} />
      <Configurator
        catalog={HARPER_CATALOG}
        templates={HARPER_TEMPLATES}
        colorways={HARPER_COLORWAYS}
      />
    </>
  );
}