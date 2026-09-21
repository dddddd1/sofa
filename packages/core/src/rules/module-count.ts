import { RULE_LIMITS } from '../catalog';
import { violation, type Rule } from './types';

/** R1：模块数量上下限（包装/运输约束 3–8 件） */
export const moduleCountRule: Rule = {
  code: 'MODULE_COUNT',
  level: 'block',
  message: `Sectionals support ${RULE_LIMITS.MIN_MODULES}–${RULE_LIMITS.MAX_MODULES} modules.`,
  test(ctx) {
    const n = ctx.design.items.length;
    if (n === 0) return [];
    if (n < RULE_LIMITS.MIN_MODULES || n > RULE_LIMITS.MAX_MODULES) {
      return [
        violation(
          { code: 'MODULE_COUNT', level: 'block', message: countMessage(n) },
          ctx.design.items.map((_, i) => i),
        ),
      ];
    }
    return [];
  },
};

function countMessage(n: number): string {
  if (n < RULE_LIMITS.MIN_MODULES) {
    return `Add at least ${RULE_LIMITS.MIN_MODULES - n} more module${RULE_LIMITS.MIN_MODULES - n > 1 ? 's' : ''} to complete your sofa.`;
  }
  return `Sectionals support up to ${RULE_LIMITS.MAX_MODULES} modules. Remove a module to add another.`;
}
