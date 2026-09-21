import { violation, type Rule } from './types';

/**
 * R7：尺寸预警（warn，不阻断）。
 * 用户在房间规划器/结算前填写了房间尺寸时，
 * 占地宽或深超出房间即提示，勾选确认后放行。
 */
export const sizeFitRule: Rule = {
  code: 'SIZE_FIT',
  level: 'warn',
  message: 'This configuration may be larger than your room. Double-check the dimensions.',
  test(ctx, options) {
    const room = options.room;
    const dims = ctx.layout?.dimensionsM;
    if (!room || !dims) return [];

    const overWidth = dims.w > room.widthM;
    const overDepth = dims.d > room.depthM;
    if (!overWidth && !overDepth) return [];

    const which = overWidth && overDepth ? 'width and depth' : overWidth ? 'width' : 'depth';
    return [
      violation(
        {
          code: 'SIZE_FIT',
          level: 'warn',
          message: `The sofa ${which} may exceed your room dimensions (${fmtM(dims.w)} × ${fmtM(dims.d)}).`,
        },
        ctx.design.items.map((_, i) => i),
      ),
    ];
  },
};

function fmtM(v: number): string {
  return `${v.toFixed(2)}m`;
}
