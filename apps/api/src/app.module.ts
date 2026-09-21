import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CatalogModule } from './catalog/catalog.module';
import { DesignsModule } from './designs/designs.module';

@Module({
  imports: [CatalogModule, DesignsModule],
  controllers: [HealthController],
})
export class AppModule {}
