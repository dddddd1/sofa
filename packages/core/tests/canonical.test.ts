import { describe, expect, it } from 'vitest';
import { HARPER_TEMPLATE_L_SECTIONAL_4, canonicalizeDesign, hashSnapshot, type Design } from '../src';

describe('canonical / snapshot hash', () => {
  it('键顺序不同的同一方案，规范化字符串一致', () => {
    const a = HARPER_TEMPLATE_L_SECTIONAL_4;
    const b: Design = {
      leg: 'natural',
      cover: { colorwayId: 'fog', grade: 'fabric' },
      items: a.items,
      templateId: 'l-sectional-4',
      seriesId: 'harper-cloud',
      schemaVersion: 1,
    };
    expect(canonicalizeDesign(a)).toBe(canonicalizeDesign(b));
  });

  it('模块顺序不同 → 哈希不同（顺序有语义）', async () => {
    const a = HARPER_TEMPLATE_L_SECTIONAL_4;
    const b: Design = {
      ...a,
      items: [...a.items].reverse(),
    };
    expect(await hashSnapshot(a)).not.toBe(await hashSnapshot(b));
  });

  it('同方案两次哈希相同，且为 64 位 sha256 hex', async () => {
    const hash = await hashSnapshot(HARPER_TEMPLATE_L_SECTIONAL_4);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(await hashSnapshot(HARPER_TEMPLATE_L_SECTIONAL_4));
  });
});
