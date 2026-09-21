import type { CatalogModule } from '../catalog';
import { violation, type Rule } from './types';

/**
 * R6：连接拓扑。
 * 普通相邻边 A→B：A 必须带 socket_right，B 必须带 socket_left；
 * 当 A 是 corner 时，corner 走 socket_front 接入返程段首件（仍要求首件带 socket_left）。
 */
export const socketTopologyRule: Rule = {
  code: 'SOCKET_MISMATCH',
  level: 'block',
  message: 'These modules cannot connect in this order.',
  test(ctx) {
    const out = [];
    const { resolved } = ctx;

    for (let i = 0; i < resolved.length - 1; i++) {
      const a = resolved[i];
      const b = resolved[i + 1];
      if (!a || !b) continue; // UNKNOWN_MODULE 已报错，跳过

      const outlet = a.type === 'corner' ? 'socket_front' : 'socket_right';
      if (!hasSocket(a, outlet)) {
        out.push(
          violation(
            {
              code: 'SOCKET_MISMATCH',
              level: 'block',
              message: `${a.name} has no connector on the required side.`,
            },
            [i],
          ),
        );
      }
      if (!hasSocket(b, 'socket_left')) {
        out.push(
          violation(
            {
              code: 'SOCKET_MISMATCH',
              level: 'block',
              message: `${b.name} cannot connect on this side.`,
            },
            [i + 1],
          ),
        );
      }
    }
    return out;
  },
};

function hasSocket(m: CatalogModule, socket: string): boolean {
  return m.sockets.includes(socket);
}
