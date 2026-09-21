import { describe, expect, it } from 'vitest';
import { HARPER_CATALOG, HARPER_TEMPLATE_L_SECTIONAL_4, computeLayout } from '../src';

describe('layout — 直排', () => {
  it('3 人位沿 X 排列并居中，原点在占地中心', () => {
    const layout = computeLayout(
      {
        schemaVersion: 1,
        seriesId: 'harper-cloud',
        templateId: null,
        items: [
          { moduleCode: 'HC-LAF-01', power: false },
          { moduleCode: 'HC-ARM-01', power: false },
          { moduleCode: 'HC-RAF-01', power: false },
        ],
        cover: { grade: 'fabric', colorwayId: 'fog' },
        leg: 'natural',
      },
      HARPER_CATALOG,
    );

    expect(layout.cornerIndex).toBeNull();
    expect(layout.dimensionsM).toMatchObject({ w: 0.838 * 3, d: 0.94, h: 0.914 });
    // 首尾 x 关于原点对称
    const first = layout.placements[0]!;
    const last = layout.placements[2]!;
    expect(first.x).toBeCloseTo(-last.x, 6);
    expect(first.rotationY).toBe(0);
  });
});

describe('layout — L 形返程段', () => {
  it('corner 后模块旋转 90° 沿 +Z 延伸，外接矩形正确', () => {
    const layout = computeLayout(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG);

    expect(layout.cornerIndex).toBe(2);
    expect(layout.dimensionsM.w).toBeCloseTo(0.838 + 0.838 + 0.94, 6); // 2.616m
    expect(layout.dimensionsM.d).toBeCloseTo(0.94 / 2 + 1.524, 6); // 1.994m

    const chaise = layout.placements[3]!;
    expect(chaise.rotationY).toBe(90);
    expect(chaise.x).toBeCloseTo(layout.placements[2]!.x, 6); // 与转角 x 对齐
    expect(chaise.z).toBeGreaterThan(0);
  });

  it('所有摆放点都在外接矩形内且 Y=0 由资产保证', () => {
    const layout = computeLayout(HARPER_TEMPLATE_L_SECTIONAL_4, HARPER_CATALOG);
    for (const p of layout.placements) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(layout.dimensionsM.w / 2 + 1e-9);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(layout.dimensionsM.d / 2 + 1e-9);
    }
  });
});
