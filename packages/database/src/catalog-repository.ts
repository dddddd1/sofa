import type { Catalog, DimensionsM } from '@harper/core';
import { prisma } from './client';

/**
 * 目录仓储：把 Postgres 行映射成 @harper/core 需要的 Catalog 同形结构。
 * core 不依赖 Prisma；数据面从 fixture 切到 DB 时，定价/规则代码零改动。
 *
 * P0 单系列 QPS 不高，整表读 + 内存映射；W2 加 ETag/内存缓存即可。
 */
export async function loadCatalog(seriesSlug: string): Promise<Catalog | null> {
  const series = await prisma.series.findUnique({
    where: { slug: seriesSlug },
    include: {
      modules: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } },
      grades: { orderBy: { swatchOrder: 'asc' }, include: { colorways: { where: { active: true } } } },
      legOptions: true,
    },
  });

  if (!series || series.status !== 'active') return null;

  const rates = await prisma.shippingRate.findMany({
    where: { active: true },
    orderBy: { thresholdMinor: 'asc' },
  });

  const catalog: Catalog = {
    seriesId: series.slug,
    priceTableVersion: series.assetVersion, // 见下方说明：定价版本由 PriceTable 发布时同步
    currency: series.currency,
    modules: series.modules.map((m) => ({
      code: m.code,
      type: m.type,
      name: m.name,
      dimensionsM: m.dimensionsM as unknown as DimensionsM,
      sockets: m.sockets,
      powerCompatible: m.powerCompatible,
      basePriceMinor: m.basePriceMinor,
      powerAddonMinor: m.powerAddonMinor,
    })),
    grades: series.grades.map((g) => ({
      key: g.gradeKey,
      name: g.name,
      priceFactor: g.priceFactor.toNumber(),
    })),
    legs: series.legOptions.map((l) => ({
      key: l.legKey,
      name: l.name,
      priceAddonMinor: l.priceAddonMinor,
    })),
    shipping: rates.map((r) => ({
      zone: r.zone as Catalog['shipping'][number]['zone'],
      service: r.service as Catalog['shipping'][number]['service'],
      thresholdMinor: r.thresholdMinor,
      feeMinor: r.feeMinor,
    })),
  };

  // 价格表版本取最近发布的一版（报价必须绑定版本，见架构文档第 6 章）
  const priceTable = await prisma.priceTable.findFirst({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  });
  if (priceTable) catalog.priceTableVersion = priceTable.version;

  return catalog;
}

export async function listTemplates(seriesSlug: string) {
  const series = await prisma.series.findUnique({ where: { slug: seriesSlug } });
  if (!series) return [];
  const rows = await prisma.configurationTemplate.findMany({
    where: { seriesId: series.id, active: true },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    design: r.designJson as unknown,
  }));
}
