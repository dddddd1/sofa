import { findLeg, findModule, type Catalog } from './catalog';
import type { Design } from './types';

export interface BomLine {
  moduleCode: string;
  moduleType: string;
  quantity: number;
  power: boolean;
  /** 该模块 fabric 基准单价（分）；面料系数在定价层统一应用 */
  unitBaseMinor: number;
  lineBaseMinor: number;
}

export interface Bom {
  seriesId: string;
  cover: { grade: string; colorwayId: string; millSku?: string };
  leg: { key: string; name: string };
  lines: BomLine[];
}

/**
 * 展开工厂 BOM：同模块+同 power 配置聚合数量。
 * 这是推给工厂 MTO 工单的结构化原料；订单冻结时整体快照。
 */
export function buildBom(design: Design, catalog: Catalog): Bom {
  const grouped = new Map<string, BomLine>();

  for (const item of design.items) {
    const mod = findModule(catalog, item.moduleCode);
    if (mod === null) continue; // UNKNOWN_MODULE 已在规则层阻断，这里防御性跳过

    const key = `${item.moduleCode}|${item.power ? 'pwr' : 'std'}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.lineBaseMinor = existing.quantity * existing.unitBaseMinor;
    } else {
      grouped.set(key, {
        moduleCode: mod.code,
        moduleType: mod.type,
        quantity: 1,
        power: item.power,
        unitBaseMinor: mod.basePriceMinor,
        lineBaseMinor: mod.basePriceMinor,
      });
    }
  }

  const leg = findLeg(catalog, design.leg);

  return {
    seriesId: design.seriesId,
    cover: { grade: design.cover.grade, colorwayId: design.cover.colorwayId },
    leg: { key: design.leg, name: leg?.name ?? design.leg },
    lines: [...grouped.values()],
  };
}
