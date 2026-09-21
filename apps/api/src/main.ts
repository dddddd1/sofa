import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.enableCors({
    // P0：预检期放开；W2 按站点域（harper-home.com 等）收敛
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  });
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Harper API listening on http://localhost:${port}/v1`);
}

void bootstrap();
