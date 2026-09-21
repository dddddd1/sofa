import type { INestApplication } from '@nestjs/common';

/** 本地常驻（main.ts）与 Vercel Serverless（bootstrap.ts）共用的应用级配置。 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.enableCors({
    // P0：预检期放开；W2 按站点域（harper-home.com 等）收敛
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  });
  app.enableShutdownHooks();
}