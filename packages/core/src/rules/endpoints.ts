import type { ModuleType } from '../types';
import { violation, type Rule, type RuleContext, type Violation } from './types';

/** 合法的序列起点/终点与中段模块类型 */
const START_TYPES: ReadonlySet<ModuleType> = new Set(['laf_seat', 'chaise']);
const END_TYPES: ReadonlySet<ModuleType> = new Set(['raf_seat', 'chaise', 'ottoman']);
const INTERIOR_TYPES: ReadonlySet<ModuleType> = new Set([
  'armless_seat',
  'corner',
  'console',
]);

/**
 * R2：端点封闭。
 * 串联序列必须以 LAF（或左贵妃）起，以 RAF / 贵妃 / 脚凳收；
 * 中段只允许无扶手座、转角、控制台。
 */
export const endpointsRule: Rule = {
  code: 'ENDPOINT_OPEN',
  level: 'block',
  message: 'Your sofa needs a closed end on both sides.',
  test(ctx) {
    const out: Violation[] = [];
    const { resolved } = ctx;
    if (resolved.length === 0) return out;

    const first = resolved[0];
    const last = resolved[resolved.length - 1];

    if (first && !START_TYPES.has(first.type)) {
      out.push(
        violation(
          { code: 'ENDPOINT_OPEN', level: 'block', message: 'Start with a left-facing arm seat or left chaise.' },
          [0],
        ),
      );
    }
    if (last && !END_TYPES.has(last.type)) {
      out.push(
        violation(
          { code: 'ENDPOINT_OPEN', level: 'block', message: 'Add a right-facing arm to finish your sofa.' },
          [resolved.length - 1],
        ),
      );
    }

    resolved.forEach((m, i) => {
      if (i === 0 || i === resolved.length - 1) return;
      if (m !== null && !INTERIOR_TYPES.has(m.type)) {
        out.push(
          violation(
            {
              code: 'ENDPOINT_OPEN',
              level: 'block',
              message: `${m.name} can only be placed at the end of a sectional.`,
            },
            [i],
          ),
        );
      }
    });

    return out;
  },
};

export function indexesOfType(ctx: RuleContext, type: ModuleType): number[] {
  const indexes: number[] = [];
  ctx.resolved.forEach((m, i) => {
    if (m?.type === type) indexes.push(i);
  });
  return indexes;
}
