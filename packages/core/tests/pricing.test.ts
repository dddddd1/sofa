import { describe, expect, it } from 'vitest';
import { HARPER_CATALOG, HARPER_TEMPLATE_L_SECTIONAL_4, priceDesign, type Design } from '../src';

describe('pricing — 纯函数', () => {
  it('fabric L 形 4 件套 subtotal = $3,840（与配置器原型一致）', () => {
    const price = priceDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG);
    expect(price.subtotalMinor).toBe(384000);
    expect(price.coverUpliftMinor).toBe(0);
    expect(price.powerMinor).toBe(0);
    expect(price.legAddonMinor).toBe(0);
  });

  it('白手套默认运费 $299，CONUS 满 $5,000 免运费', () => {
    const price = priceDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG);
    expect(price.shippingMinor).toBe(29900);
    expect(price.shippingService).toBe('white_glove');

    const leather: Design = {
      ...HARPER_TEMPLATE_L_SECTIONAL_4,
      cover: { grade: 'full_grain', colorwayId: 'espresso' },
    };
    const premium = priceDesign(leather, HARPER_CATALOG);
    expect(premium.subtotalMinor).toBe(806400);
    expect(premium.shippingMinor).toBe(0);
  });

  it('performance 系数 1.15 + waln 腿 $90 + Power $450', () => {
    const design: Design = {
      schemaVersion: 1,
      seriesId: 'harper-cloud',
      templateId: null,
      items: [
        { moduleCode: 'HC-LAF-01', power: true },
        { moduleCode: 'HC-ARM-01', power: false },
        { moduleCode: 'HC-RAF-01', power: false },
      ],
      cover: { grade: 'performance', colorwayId: 'slate' },
      leg: 'walnut',
    };
    const price = priceDesign(design, HARPER_CATALOG);
    // 94000*1.15 + 84000*1.15 + 94000*1.15 = 312800
    expect(price.modulesMinor).toBe(312800);
    expect(price.powerMinor).toBe(45000);
    expect(price.legAddonMinor).toBe(9000);
    expect(price.subtotalMinor).toBe(366800);
  });

  it('未提供税额时 tax/total 为 null（结算页补算，不臆造数字）', () => {
    const price = priceDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG);
    expect(price.taxMinor).toBeNull();
    expect(price.totalMinor).toBeNull();

    const withTax = priceDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG, { taxMinor: 26880 });
    expect(withTax.totalMinor).toBe(384000 + 29900 + 26880);
  });

  it('AK/HI 分区使用不同运费', () => {
    const price = priceDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG, {
      shippingZone: 'US-AK-HI',
      shippingService: 'white_glove',
    });
    expect(price.shippingMinor).toBe(49900);
  });
});
