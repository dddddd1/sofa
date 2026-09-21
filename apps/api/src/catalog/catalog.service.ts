import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Catalog } from '@harper/core';
import { HARPER_CATALOG, HARPER_SERIES_ID } from '@harper/core';
import { loadCatalog, listTemplates } from '@harper/database';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private warnedFallback = false;

  /**
   * 取系列目录。DB 不可用或尚未 migrate/seed 时，
   * Harper Cloud 回落到 core 内置 fixture，保证本地开发与契约联调不断。
   */
  async getCatalog(seriesSlug: string): Promise<Catalog> {
    try {
      const catalog = await loadCatalog(seriesSlug);
      if (catalog) return catalog;
    } catch (err) {
      this.logger.warn(
        `DB catalog load failed (${(err as Error).message}); falling back to fixture for "${seriesSlug}"`,
      );
    }

    if (seriesSlug === HARPER_SERIES_ID) {
      if (!this.warnedFallback) {
        this.logger.warn('Serving HARPER_CATALOG fixture — run migrate + seed to use Postgres data.');
        this.warnedFallback = true;
      }
      return HARPER_CATALOG;
    }

    throw new NotFoundException(`Series "${seriesSlug}" not found`);
  }

  async getTemplates(seriesSlug: string) {
    try {
      const rows = await listTemplates(seriesSlug);
      if (rows.length > 0) return rows;
    } catch (err) {
      this.logger.warn(`DB template load failed (${(err as Error).message})`);
    }
    return [];
  }
}
