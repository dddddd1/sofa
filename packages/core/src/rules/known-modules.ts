import { violation, type Rule, type Violation } from './types';

const META = {
  code: 'UNKNOWN_MODULE',
  level: 'block' as const,
  message: 'This module is no longer available. Remove it to continue.',
};

/** R0：引用的模块编码必须全部存在于当前系列目录 */
export const knownModulesRule: Rule = {
  ...META,
  test(ctx) {
    const out: Violation[] = [];
    ctx.resolved.forEach((m, i) => {
      if (m === null) {
        const code = ctx.design.items[i]?.moduleCode ?? '?';
        out.push(violation(META, [i], `Module "${code}" is unavailable.`));
      }
    });
    return out;
  },
};
