import { describe, expect, it } from 'vitest';
import {
  HARPER_CATALOG,
  HARPER_TEMPLATE_L_SECTIONAL_4,
  validateDesign,
  type Design,
  type DesignItem,
} from '../src';

function design(items: DesignItem[], overrides: Partial<Design> = {}): Design {
  return {
    schemaVersion: 1,
    seriesId: 'harper-cloud',
    templateId: null,
    items,
    cover: { grade: 'fabric', colorwayId: 'fog' },
    leg: 'natural',
    ...overrides,
  };
}

const laf = (power = false): DesignItem => ({ moduleCode: 'HC-LAF-01', power });
const raf = (power = false): DesignItem => ({ moduleCode: 'HC-RAF-01', power });
const arm = (power = false): DesignItem => ({ moduleCode: 'HC-ARM-01', power });
const crn = (): DesignItem => ({ moduleCode: 'HC-CRN-01', power: false });
const chs = (): DesignItem => ({ moduleCode: 'HC-CHS-01', power: false });

describe('rules — happy paths', () => {
  it('预置 L 形 4 件套（含贵妃返程段）合法', () => {
    const result = validateDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.bom?.lines).toHaveLength(4);
  });

  it('直排 3 人位（LAF+无扶手+RAF）合法', () => {
    const result = validateDesign(design([laf(), arm(), raf()]), HARPER_CATALOG);
    expect(result.valid).toBe(true);
    expect(result.layout?.cornerIndex).toBeNull();
  });
});

describe('rules — block 违规', () => {
  it('缺右侧端头：ENDPOINT_OPEN', () => {
    const result = validateDesign(design([laf(), arm(), arm()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'ENDPOINT_OPEN' && v.indexes.includes(2))).toBe(true);
    expect(result.price).toBeNull();
    expect(result.bom).toBeNull();
  });

  it('起点用 RAF 方向错误：ENDPOINT_OPEN', () => {
    const result = validateDesign(design([raf(), arm(), laf()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'ENDPOINT_OPEN')).toBe(true);
  });

  it('超过 8 件上限：MODULE_COUNT', () => {
    const result = validateDesign(design([laf(), ...Array(7).fill(arm()), raf()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'MODULE_COUNT')).toBe(true);
  });

  it('少于 3 件：MODULE_COUNT', () => {
    const result = validateDesign(design([laf(), raf()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'MODULE_COUNT')).toBe(true);
  });

  it('两个转角：CORNER_INVALID', () => {
    const result = validateDesign(design([laf(), crn(), crn(), raf()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'CORNER_INVALID')).toBe(true);
  });

  it('转角在端点且无返程段：CORNER_INVALID', () => {
    const result = validateDesign(design([laf(), arm(), crn()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'CORNER_INVALID' && v.indexes.includes(2))).toBe(true);
  });

  it('两个贵妃：CHAISE_INVALID', () => {
    const result = validateDesign(design([chs(), arm(), crn(), arm(), chs()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.filter((v) => v.code === 'CHAISE_INVALID')).toHaveLength(1);
  });

  it('贵妃放在中段：CHAISE_INVALID', () => {
    const result = validateDesign(design([laf(), chs(), raf()]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'CHAISE_INVALID' && v.indexes.includes(1))).toBe(true);
  });

  it('转角加 Power：POWER_INVALID', () => {
    const result = validateDesign(
      design([laf(), arm(), { moduleCode: 'HC-CRN-01', power: true }, chs()]),
      HARPER_CATALOG,
    );
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'POWER_INVALID' && v.indexes.includes(2))).toBe(true);
  });

  it('Power 件超过 4 个：POWER_INVALID', () => {
    const result = validateDesign(design([laf(true), arm(true), arm(true), arm(true), raf(true)]), HARPER_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'POWER_INVALID')).toBe(true);
  });

  it('引用不存在的模块：UNKNOWN_MODULE 且不出 layout/报价', () => {
    const result = validateDesign(
      design([laf(), { moduleCode: 'HC-X-99', power: false }, raf()]),
      HARPER_CATALOG,
    );
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === 'UNKNOWN_MODULE')).toBe(true);
    expect(result.layout).toBeNull();
  });
});

describe('rules — warn 不阻断', () => {
  it('沙发大于房间：SIZE_FIT warn 但 valid=true', () => {
    const result = validateDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG, {
      room: { widthM: 2.0, depthM: 1.5 },
    });
    expect(result.valid).toBe(true);
    const warn = result.violations.find((v) => v.code === 'SIZE_FIT');
    expect(warn?.level).toBe('warn');
  });

  it('房间足够大时无 SIZE_FIT', () => {
    const result = validateDesign(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG, {
      room: { widthM: 5, depthM: 5 },
    });
    expect(result.violations.some((v) => v.code === 'SIZE_FIT')).toBe(false);
  });
});
