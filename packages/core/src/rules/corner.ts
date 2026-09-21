import { RULE_LIMITS } from '../catalog';
import { violation, type Rule } from './types';
import { indexesOfType } from './endpoints';

/**
 * R3：唯一转角。
 * 每套至多 1 个 corner；corner 两侧都必须有模块（不能在端点），
 * 且其后必须存在返程段。
 */
export const cornerRule: Rule = {
  code: 'CORNER_INVALID',
  level: 'block',
  message: 'A sectional can include one corner, with seats on both sides.',
  test(ctx) {
    const corners = indexesOfType(ctx, 'corner');
    if (corners.length === 0) return [];

    const out = [];
    if (corners.length > RULE_LIMITS.MAX_CORNERS) {
      out.push(
        violation(
          { code: 'CORNER_INVALID', level: 'block', message: 'A sectional can include at most one corner.' },
          corners,
        ),
      );
    }

    const firstCorner = corners[0]!;
    const n = ctx.resolved.length;
    const atEdge = firstCorner === 0 || firstCorner === n - 1;
    const noReturnRun = firstCorner >= n - 1;
    if (atEdge || noReturnRun) {
      out.push(
        violation(
          {
            code: 'CORNER_INVALID',
            level: 'block',
            message: 'The corner needs a seat before it and a return section after it.',
          },
          [firstCorner],
        ),
      );
    }
    return out;
  },
};
