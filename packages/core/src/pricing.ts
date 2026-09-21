import { findGrade, findLeg, findModule, type Catalog } from './catalog';
import type { Design, ShippingService, ShippingZone } from './types';

export interface PriceBreakdown {
  currency: string;
  priceTableVersion: string;
  subtotalMinor: number;
  modulesMinor: number;
  coverUpliftMinor: number;
  powerMinor: number;
  legAddonMinor: number;
  shippingMinor: number | null;
  shippingService: ShippingService | null;
  shippingZone: ShippingZone;
  taxMinor: number | null;
  totalMinor: number | null;
}

export interface PricingOptions {
  shippingZone?: ShippingZone;
  shippingService?: ShippingService;
  /** Avalara 等外部税额（分）；未提供时 tax/total 为 null，结算页补算 */
  taxMinor?: number;
}

/**
 * 定价纯函数（架构文档第 6 章）：
 *
 *   subtotal = Σ(moduleBase × gradeFactor + powerAddon) + legAddon
 *   shipping = 费率表（zone+service，取满足门槛的最高档）
 *   total    = subtotal + shipping + tax
 *
 * 金额全程整数分；系数乘法后立即四舍五入，禁止浮点进入金额。
 */
export function priceDesign(
  design: Design,
  catalog: Catalog,
  options: PricingOptions = {},
): PriceBreakdown {
  const zone = options.shippingZone ?? 'US-CONUS';
  const service = options.shippingService ?? 'white_glove';
  const grade = findGrade(catalog, design.cover.grade);
  const factor = grade?.priceFactor ?? 1;
  const leg = findLeg(catalog, design.leg);

  let modulesMinor = 0;
  let coverUpliftMinor = 0;
  let powerMinor = 0;

  for (const item of design.items) {
    const mod = findModule(catalog, item.moduleCode);
    if (mod === null) continue;
    const base = mod.basePriceMinor;
    const graded = Math.round(base * factor);
    modulesMinor += graded;
    coverUpliftMinor += graded - base;
    if (item.power) powerMinor += mod.powerAddonMinor;
  }

  const legAddonMinor = leg?.priceAddonMinor ?? 0;
  const subtotalMinor = modulesMinor + powerMinor + legAddonMinor;

  const shippingMinor = lookupShipping(catalog, zone, service, subtotalMinor);
  const taxMinor = options.taxMinor ?? null;
  const totalMinor =
    shippingMinor === null || taxMinor === null
      ? null
      : subtotalMinor + shippingMinor + taxMinor;

  return {
    currency: catalog.currency,
    priceTableVersion: catalog.priceTableVersion,
    subtotalMinor,
    modulesMinor,
    coverUpliftMinor,
    powerMinor,
    legAddonMinor,
    shippingMinor,
    shippingService: service,
    shippingZone: zone,
    taxMinor,
    totalMinor,
  };
}

function lookupShipping(
  catalog: Catalog,
  zone: ShippingZone,
  service: ShippingService,
  subtotalMinor: number,
): number | null {
  const rows = catalog.shipping
    .filter((r) => r.zone === zone && r.service === service && subtotalMinor >= r.thresholdMinor)
    .sort((a, b) => b.thresholdMinor - a.thresholdMinor);
  return rows[0]?.feeMinor ?? null;
}
