import { Inject, Injectable } from '@nestjs/common';
import { hashSnapshot, validateDesign } from '@harper/core';
import { CatalogService } from '../catalog/catalog.service';
import type { ValidateRequest } from './designs.dto';

@Injectable()
export class DesignsService {
  constructor(@Inject(CatalogService) private readonly catalogs: CatalogService) {}

  /**
   * 服务端权威校验。前端在浏览器里跑同一份 core 代码只做即时反馈；
   * 加购/下单只承认本接口结果（架构文档第 3、6 章）。
   */
  async validate(body: ValidateRequest) {
    const { design, options = {} } = body;
    const catalog = await this.catalogs.getCatalog(design.seriesId);

    const result = validateDesign(design, catalog, options);
    const snapshotHash = await hashSnapshot(design);

    return {
      ...result,
      snapshotHash,
      meta: {
        priceTableVersion: result.price?.priceTableVersion ?? catalog.priceTableVersion,
        currency: catalog.currency,
        // 报价暂存 TTL 由调用方（加购接口）落 design_quote 时设置；validate 本身无副作用
      },
    };
  }
}
