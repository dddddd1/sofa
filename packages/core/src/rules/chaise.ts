import { RULE_LIMITS } from '../catalog';
import { violation, type Rule } from './types';
import { indexesOfType } from './endpoints';

/**
 * R4：贵妃方向。
 * 每套至多 1 个 chaise，只能位于序列端点：
 * 位于起点 = 左贵妃（接 LAF 侧），位于终点 = 右贵妃。
 * 注意：L 形方案中终点贵妃接在 corner 之后（返程段末端），属合法，
 * 可连接性由 SOCKET_MISMATCH 规则保证。
 */
export const chaiseRule: Rule = {
  code: 'CHAISE_INVALID',
  level: 'block',
  message: 'The chaise can only be placed at one end of your sectional.',
  test(ctx) {
    const chaises = indexesOfType(ctx, 'chaise');
    if (chaises.length === 0) return [];
    const out = [];
    const n = ctx.resolved.length;

    if (chaises.length > RULE_LIMITS.MAX_CHAISES) {
      out.push(
        violation(
          { code: 'CHAISE_INVALID', level: 'block', message: 'A sectional can include at most one chaise.' },
          chaises,
        ),
      );
    }

    chaises.forEach((i) => {
      if (i !== 0 && i !== n - 1) {
        out.push(
          violation(
            { code: 'CHAISE_INVALID', level: 'block', message: 'Move the chaise to an end of the sectional.' },
            [i],
          ),
        );
      }
    });

    return out;
  },
};
