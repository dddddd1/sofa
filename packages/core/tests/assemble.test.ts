import { describe, expect, it } from 'vitest';
import { validateDesign } from '../src/validate';
import { listAddPresets } from '../src/assemble';
import { HARPER_CATALOG, HARPER_TEMPLATES } from '../src/fixtures/harper-cloud';
import type { Design } from '../src/types';

/**
 * 防错优先的核心不变量：
 * 应用任何"闭合类"预设（末尾以 RAF / EICA / Ottoman 收尾）后的方案，
 * 都不应产生任何 block 级错误。起点单件（start-laf）是唯一被允许的中间态。
 */

function blocksAt(design: Design): string[] {
  return validateDesign(design, HARPER_CATALOG)
    .violations.filter((v) => v.level === 'block')
    .map((v) => v.message);
}

const END_MODULES = new Set(['raf_seat', 'chaise', 'ottoman']);
const isClosing = (p: { add: { moduleCode: string }[] }, catalog: typeof HARPER_CATALOG) => {
  const last = p.add[p.add.length - 1]!;
  const mod = catalog.modules.find((m) => m.code === last.moduleCode);
  return !!mod && END_MODULES.has(mod.type);
};

describe('listAddPresets —— 防错优先不变量', () => {
  it('从空开始，一路跟推荐预设走，闭合步始终无 block 错误', () => {
    let design: Design = {
      schemaVersion: 1,
      seriesId: 'harper-cloud',
      templateId: null,
      items: [],
      cover: { grade: 'fabric', colorwayId: 'fog' },
      leg: 'natural',
    };
    const depths: number[] = [];
    for (let depth = 0; depth < 4; depth++) {
      const presets = listAddPresets(design, HARPER_CATALOG);
      if (presets.length === 0) break;
      const choice = presets[0]!;
      design = { ...design, items: [...design.items, ...choice.add] };
      depths.push(depth);
      if (isClosing(choice, HARPER_CATALOG)) {
        expect(blocksAt(design), `depth ${depth} (${choice.label})`).toEqual([]);
      }
    }
    expect(depths.length).toBeGreaterThanOrEqual(2);
    expect(design.items.length).toBeLessThanOrEqual(8);
  });

  it('从每个预置模板出发，任一闭合类预设追加后都无 block 错误', () => {
    for (const tpl of HARPER_TEMPLATES) {
      for (const p of listAddPresets(tpl, HARPER_CATALOG)) {
        if (!isClosing(p, HARPER_CATALOG)) continue;
        const next: Design = { ...tpl, items: [...tpl.items, ...p.add] };
        expect(blocksAt(next), `${tpl.templateId} + ${p.label}`).toEqual([]);
      }
    }
  });

  it('已闭合的模板（末端 RAF / EICA）不再提供扩展项', () => {
    for (const tpl of HARPER_TEMPLATES) {
      const last = tpl.items[tpl.items.length - 1]!;
      const lastMod = HARPER_CATALOG.modules.find((m) => m.code === last.moduleCode)!;
      if (END_MODULES.has(lastMod.type)) {
        expect(listAddPresets(tpl, HARPER_CATALOG), tpl.templateId).toEqual([]);
      }
    }
  });

  it('开放的直线状态可扩展出 L 形，且追加后合法', () => {
    // 一条未闭合的 2 件直线 [LAF, ARM]（合法但未收尾）
    const open: Design = {
      schemaVersion: 1,
      seriesId: 'harper-cloud',
      templateId: null,
      items: [
        { moduleCode: 'HC-LAF-01', power: false },
        { moduleCode: 'HC-ARM-01', power: false },
      ],
      cover: { grade: 'fabric', colorwayId: 'fog' },
      leg: 'natural',
    };
    const presets = listAddPresets(open, HARPER_CATALOG);
    const lShapes = presets.filter((p) => p.id.startsWith('l-shape'));
    expect(lShapes.length).toBeGreaterThan(0);
    for (const p of lShapes) {
      const next: Design = { ...open, items: [...open.items, ...p.add] };
      expect(blocksAt(next), p.label).toEqual([]);
    }
    // 闭合类（收 RAF）同样合法
    for (const p of presets) {
      if (!isClosing(p, HARPER_CATALOG)) continue;
      const next: Design = { ...open, items: [...open.items, ...p.add] };
      expect(blocksAt(next), p.label).toEqual([]);
    }
  });
});