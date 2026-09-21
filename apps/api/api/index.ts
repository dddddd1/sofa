import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bootstrapServerless } from '../src/bootstrap';

/**
 * Vercel Serverless Function 入口。
 * rewrites（vercel.json）把全部路径送至本函数；Nest 的 globalPrefix 'v1' 按原始 path 路由。
 */
export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const handler = await bootstrapServerless();
  handler(req as never, res as never);
}