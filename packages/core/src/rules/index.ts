import type { Design, ValidateOptions } from '../types';
import type { Catalog } from '../catalog';
import { findModule } from '../catalog';
import type { LayoutResult } from '../layout';
import { computeLayout } from '../layout';
import type { Rule, RuleContext, Violation } from './types';
import { knownModulesRule } from './known-modules';
import { moduleCountRule } from './module-count';
import { endpointsRule } from './endpoints';
import { cornerRule } from './corner';
import { chaiseRule } from './chaise';
import { powerRule } from './power';
import { socketTopologyRule } from './socket-topology';
import { sizeFitRule } from './size-fit';

/**
 * 规则注册顺序即检查/展示顺序。
 * 新增系列的差异化规则应在后台 DSL 化（P1）；P0 规则集对全系列生效。
 */
export const rules: Rule[] = [
  knownModulesRule,
  moduleCountRule,
  endpointsRule,
  cornerRule,
  chaiseRule,
  powerRule,
  socketTopologyRule,
  sizeFitRule,
];

/** 可序列化描述，下发给前端做本地即时提示（权威判定永远在服务端） */
export interface RuleDescriptor {
  code: string;
  level: 'block' | 'warn';
  message: string;
}

export const ruleDescriptors: RuleDescriptor[] = rules.map((r) => ({
  code: r.code,
  level: r.level,
  message: r.message,
}));

export interface RuleRunResult {
  violations: Violation[];
  layout: LayoutResult | null;
}

export function runRules(
  design: Design,
  catalog: Catalog,
  options: ValidateOptions = {},
): RuleRunResult {
  const resolved = design.items.map((item) => findModule(catalog, item.moduleCode));
  const hasUnknown = resolved.some((m) => m === null);
  // 未知模块时 layout 无法可靠计算，尺寸类规则自然跳过
  const layout = hasUnknown ? null : computeLayout(design, catalog, resolved);

  const ctx: RuleContext = { design, catalog, resolved, layout };
  const violations = rules.flatMap((rule) => rule.test(ctx, options));
  return { violations, layout };
}

export function hasBlock(violations: Violation[]): boolean {
  return violations.some((v) => v.level === 'block');
}

export type { Rule, RuleContext, Violation } from './types';
