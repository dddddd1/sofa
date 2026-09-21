import { PrismaClient } from '@prisma/client';

/**
 * 单例 PrismaClient：
 *  - API 长驻进程复用一个连接池；
 *  - tsx seed 直跑时同样走这里。
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
