import type { Catalog, CatalogModule } from '../catalog';
import type { Design, ValidateOptions } from '../types';
import type { LayoutResult } from '../layout';

export type ViolationLevel = 'block' | 'warn';

export interface Violation {
  level: ViolationLevel;
  /** 稳定错误码，前端按码做本地化与高亮 */
  code: string;
  /** 默认英文文案（建议原文，上线前过母语审校） */
  message: string;
  /** 关联的模块下标，3D 视口据此描边 */
  indexes: number[];
}

export interface RuleContext {
  design: Design;
  catalog: Catalog;
  /** items 按 catalog 解析的结果；未知名为 null */
  resolved: (CatalogModule | null)[];
  /** 尺寸类规则依赖 layout；存在未知模块时可能为 null */
  layout: LayoutResult | null;
}

export interface Rule {
  code: string;
  level: ViolationLevel;
  /** 给前端下发的可序列化描述（前端只做即时提示，不做权威判定） */
  message: string;
  test(ctx: RuleContext, options: ValidateOptions): Violation[];
}

export function violation(
  rule: Pick<Rule, 'code' | 'level' | 'message'>,
  indexes: number[] = [],
  messageOverride?: string,
): Violation {
  return {
    level: rule.level,
    code: rule.code,
    message: messageOverride ?? rule.message,
    indexes,
  };
}
