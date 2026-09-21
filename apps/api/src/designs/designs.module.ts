import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';

@Module({
  imports: [CatalogModule],
  controllers: [DesignsController],
  providers: [DesignsService],
})
export class DesignsModule {}
