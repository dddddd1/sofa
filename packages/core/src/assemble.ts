import type { Catalog } from './catalog';
import { RULE_LIMITS, findModule } from './catalog';
import type { Design } from './types';

/**
 * 防错优先的组装引导。
 *
 * 与"自由追加任意模块 → 一次性爆一堆 block 错误"的模式相反，
 * 这里只返回"追加后保证通过全部 block 规则"的预设组合，交互层只展示可点项，
 * 用户因此基本摆不出非法方案。朝向由序列顺序 + 3D layout 自动推导，无需用户指定。
 *
 * 约束来源（与 rules/ 各规则保持一致）：
 *  - 端点：LAF 起，RAF/EICA/Ottoman 收；中段仅 armless/corner（ENDPOINT_OPEN）
 *  - corner 至多 1、须两侧有件并有返程段（CORNER_INVALID）
 *  - chaise 至多 1、只能位于端点（CHAISE_INVALID）
 *  - 件数 3–8、Power ≤ 4（MODULE_COUNT / POWER_INVALID）
 */

export interface AddPresetItem {
  moduleCode: string;
  power: boolean;
}

export interface AddPreset {
  id: string;
  /** 用户可见描述（英文，面向海外 DTC 买家） */
  label: string;
  /** 追加到当前序列右侧的模块 */
  add: AddPresetItem[];
}

function countBy(design: Design, pred: (code: string) => boolean): number {
  return design.items.filter((i) => pred(i.moduleCode)).length;
}

/**
 * 返回当前状态下可安全追加的预设。空集 = 已闭合/无法扩展，无需再提示。
 */
export function listAddPresets(design: Design, catalog: Catalog): AddPreset[] {
  const items = design.items;
  const addCount = items.length;
  const powerCount = items.filter((i) => i.power).length;

  if (addCount === 0) {
    return [
      {
        id: 'start-laf',
        label: 'Start with a left-arm seat',
        add: [{ moduleCode: findFirst(catalog, 'laf_seat'), power: false }],
      },
    ];
  }

  const resolved = items.map((i) => findModule(catalog, i.moduleCode));
  const last = resolved[resolved.length - 1];
  if (!last) return [];

  const lastType = last.type;
  const closedEnd = lastType === 'raf_seat' || lastType === 'chaise' || lastType === 'ottoman';
  // 已经闭合（或贵妃在末端不可再延伸）：不再提供追加
  if (closedEnd) return [];

  const hasCorner = countBy(design, (c) => resolveType(catalog, c) === 'corner') > 0;
  const hasChaise = countBy(design, (c) => resolveType(catalog, c) === 'chaise') > 0;

  const out: AddPreset[] = [];
  const can = (extraCount: number) => addCount + extraCount <= RULE_LIMITS.MAX_MODULES;
  const atLeast = (extraCount: number) => addCount + extraCount >= RULE_LIMITS.MIN_MODULES;

  const armless = firstByType(catalog, 'armless_seat');
  const raf = firstByType(catalog, 'raf_seat');
  const ottoman = firstByType(catalog, 'ottoman');
  const corner = firstByType(catalog, 'corner');
  const chaise = firstByType(catalog, 'chaise');

  // 闭合类：结果必须是合法收尾模块（RAF/EICA/Ottoman）
  if (raf && can(1) && atLeast(1)) {
    out.push({
      id: 'close-raf',
      label: 'Close with a right-arm seat',
      add: [{ moduleCode: raf, power: false }],
    });
  }
  if (armless && raf && can(2)) {
    out.push({
      id: 'seat-plus-raf',
      label: 'Add an armless seat and close with a right-arm',
      add: [
        { moduleCode: armless, power: false },
        { moduleCode: raf, power: false },
      ],
    });
  }
  if (ottoman && can(1) && atLeast(1)) {
    out.push({
      id: 'seat-plus-ottoman',
      label: 'Add an ottoman to finish',
      add: [{ moduleCode: ottoman, power: false }],
    });
  }

  // L 形：仅在尚无 corner / chaise 时提供
  if (!hasCorner && !hasChaise && corner && chaise && can(3)) {
    if (armless) {
      out.push({
        id: 'l-shape-chaise',
        label: 'Make it an L-shape with an armless seat + chaise',
        add: [
          { moduleCode: corner, power: false },
          { moduleCode: armless, power: false },
          { moduleCode: chaise, power: false },
        ],
      });
    }
    if (can(2)) {
      out.push({
        id: 'l-shape-compact',
        label: 'Make it a compact L-shape with a chaise',
        add: [
          { moduleCode: corner, power: false },
          { moduleCode: chaise, power: false },
        ],
      });
    }
  }

  return out;
}

/** 找到目录中某类型的第一件（fixture 每类型一件，够用） */
function findFirst(catalog: Catalog, type: string): string {
  const m = catalog.modules.find((mod) => mod.type === type);
  if (!m) throw new Error(`assemble: no ${type} module in catalog`);
  return m.code;
}
function firstByType(catalog: Catalog, type: string): string | null {
  const m = catalog.modules.find((mod) => mod.type === type);
  return m ? m.code : null;
}
function resolveType(catalog: Catalog, code: string): string {
  return findModule(catalog, code)?.type ?? '';
}