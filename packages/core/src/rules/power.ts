import { RULE_LIMITS } from '../catalog';
import { violation, type Rule, type Violation } from './types';

/**
 * R5：Power 约束。
 * 仅 powerCompatible 的模块可开启 power；每套 Power 件 ≤ 4。
 */
export const powerRule: Rule = {
  code: 'POWER_INVALID',
  level: 'block',
  message: `Up to ${RULE_LIMITS.MAX_POWER} power seats per sectional.`,
  test(ctx) {
    const out: Violation[] = [];
    const poweredIndexes: number[] = [];

    ctx.design.items.forEach((item, i) => {
      if (!item.power) return;
      poweredIndexes.push(i);
      const mod = ctx.resolved[i];
      if (mod && !mod.powerCompatible) {
        out.push(
          violation(
            {
              code: 'POWER_INVALID',
              level: 'block',
              message: `${mod.name} is not available as a power seat.`,
            },
            [i],
          ),
        );
      }
    });

    if (poweredIndexes.length > RULE_LIMITS.MAX_POWER) {
      out.push(
        violation(
          {
            code: 'POWER_INVALID',
            level: 'block',
            message: `Up to ${RULE_LIMITS.MAX_POWER} power seats per sectional.`,
          },
          poweredIndexes,
        ),
      );
    }
    return out;
  },
};
