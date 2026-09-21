import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

/**
 * 目录只读接口（配置器首屏数据）：
 *  GET /v1/catalog/series/:slug           模块/面料/腿/运费
 *  GET /v1/catalog/series/:slug/templates 预置模板
 *  GET /v1/catalog/series/:slug/rules     规则描述（前端本地即时提示用，非权威）
 */
@Controller('catalog/series')
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalogs: CatalogService) {}

  @Get(':slug')
  async getSeries(@Param('slug') slug: string) {
    const catalog = await this.catalogs.getCatalog(slug);
    return { seriesId: catalog.seriesId, currency: catalog.currency, priceTableVersion: catalog.priceTableVersion, catalog };
  }

  @Get(':slug/templates')
  async getTemplates(@Param('slug') slug: string) {
    return { seriesId: slug, templates: await this.catalogs.getTemplates(slug) };
  }
}
