import 'reflect-metadata';
import express, { type Request, type Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app-options';

/** Vercel 的 Node handler 需要的形态：接收 Node http 的 req/res。 */
export type ExpressHandler = (req: Request, res: Response) => void;

let cachedHandler: ExpressHandler | null = null;

/**
 * 懒初始化 Nest + Express 组合，并在函数实例内缓存（warm 请求复用同一实例，
 * 避免冷启动重建开销）。PrismaClient 的单例也挂在 globalThis，同样跨请求复用。
 */
export async function bootstrapServerless(): Promise<ExpressHandler> {
  if (cachedHandler) return cachedHandler;

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bufferLogs: true },
  );
  configureApp(app);
  await app.init();

  cachedHandler = expressApp as unknown as ExpressHandler;
  return cachedHandler;
}