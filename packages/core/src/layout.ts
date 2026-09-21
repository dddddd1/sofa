import type { Catalog, CatalogModule, DimensionsM } from './catalog';
import { findModule } from './catalog';
import type { Design } from './types';

export interface PlacedModule {
  index: number;
  moduleCode: string;
  /** 米，相对沙发占地中心（与 3D 资产规范第 4 章坐标系一致） */
  x: number;
  z: number;
  /** 绕 Y 旋转角度（度）；转角返程段为 90 */
  rotationY: 0 | 90;
}

export interface LayoutResult {
  placements: PlacedModule[];
  /** 整套沙发占地外接矩形与最大高度（米） */
  dimensionsM: DimensionsM;
  cornerIndex: number | null;
}

/**
 * 由模块序列计算 3D 摆放。
 *
 * 规则（与《3D 资产生产规范》第 4–5 章一致）：
 *  - 主段沿 +X 串联，原点最终平移到占地中心；
 *  - corner 之前（含 corner）为主段；corner 之后为返程段，
 *    沿 +Z 延伸、模块旋转 90°，x 与 corner 中心对齐；
 *  - 无 corner 时全部沿 +X。
 *
 * 前端只消费本结果摆放实例，不自行推算连接关系，避免与服务端口径漂移。
 */
export function computeLayout(
  design: Design,
  catalog: Catalog,
  preResolved?: (CatalogModule | null)[],
): LayoutResult {
  const resolved = preResolved ?? design.items.map((i) => findModule(catalog, i.moduleCode));
  const mods = resolved.map((m) => {
    if (m === null) throw new Error('computeLayout: unknown module in design');
    return m;
  });

  const cornerIndex = (() => {
    const i = mods.findIndex((m) => m.type === 'corner');
    return i === -1 ? null : i;
  })();

  const placements: PlacedModule[] = [];

  // 主段：沿 +X
  let xCursor = 0;
  const mainEnd = cornerIndex ?? mods.length - 1;
  for (let i = 0; i <= mainEnd; i++) {
    const m = mods[i]!;
    placements.push({ index: i, moduleCode: m.code, x: xCursor + m.dimensionsM.w / 2, z: 0, rotationY: 0 });
    xCursor += m.dimensionsM.w;
  }

  // 返程段：从 corner 前沿沿 +Z，旋转 90°
  let depthM = mods.slice(0, mainEnd + 1).reduce((max, m) => Math.max(max, m.dimensionsM.d), 0);
  if (cornerIndex !== null) {
    const corner = mods[cornerIndex]!;
    const cornerX = placements[cornerIndex]!.x;
    let zCursor = corner.dimensionsM.d / 2;
    for (let i = cornerIndex + 1; i < mods.length; i++) {
      const m = mods[i]!;
      placements.push({
        index: i,
        moduleCode: m.code,
        x: cornerX,
        z: zCursor + m.dimensionsM.d / 2,
        rotationY: 90,
      });
      zCursor += m.dimensionsM.d;
    }
    depthM = Math.max(depthM, zCursor);
  }

  const widthM = xCursor;
  const heightM = mods.reduce((max, m) => Math.max(max, m.dimensionsM.h), 0);

  // 居中：把原点平移到占地矩形中心
  const centered = placements.map((p) => ({ ...p, x: p.x - widthM / 2, z: p.z - depthM / 2 }));

  return {
    placements: centered,
    dimensionsM: { w: widthM, d: depthM, h: heightM },
    cornerIndex,
  };
}
