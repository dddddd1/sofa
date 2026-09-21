import type { Catalog } from './catalog';
import { buildBom, type Bom } from './bom';
import { priceDesign, type PriceBreakdown } from './pricing';
import { hasBlock, runRules, type Violation } from './rules';
import type { LayoutResult } from './layout';
import type { Design, ValidateOptions } from './types';

export interface ValidateResult {
  valid: boolean;
  violations: Violation[];
  layout: LayoutResult | null;
  /** 合法时才展开 BOM/报价，避免给非法方案输出可下单数字 */
  bom: Bom | null;
  price: PriceBreakdown | null;
}

/**
 * 配置校验总入口（服务端权威）。
 * 前端可在本地跑同一函数做即时提示，但加购/下单只承认服务端本接口的结果。
 */
export function validateDesign(
  design: Design,
  catalog: Catalog,
  options: ValidateOptions = {},
): ValidateResult {
  const { violations, layout } = runRules(design, catalog, options);
  const valid = !hasBlock(violations);

  if (!valid) {
    return { valid, violations, layout, bom: null, price: null };
  }

  const bom = buildBom(design, catalog);
  const price = priceDesign(design, catalog, {
    shippingZone: options.shippingZone,
    shippingService: options.shippingService,
    taxMinor: options.taxMinor,
  });

  return { valid, violations, layout, bom, price };
}
