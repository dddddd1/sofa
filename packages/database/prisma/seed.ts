/**
 * P0 seed：把 @harper/core 的 Harper Cloud fixture 灌入 Postgres。
 * 可重复执行（upsert by 业务唯一键）。
 *
 *   pnpm db:up && pnpm db:migrate && pnpm db:seed
 */
import {
  HARPER_CATALOG,
  HARPER_COLORWAYS,
  HARPER_PRICE_TABLE_VERSION,
  HARPER_SERIES_ID,
  HARPER_TEMPLATES,
} from '@harper/core';
import { CoverGradeKey, LegKey, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ASSET_BASE = 'https://assets.harper.example/p0/harper-cloud';

async function main(): Promise<void> {
  console.log('Seeding Harper Cloud catalog…');

  // 价格表版本（报价/订单快照绑定它）
  await prisma.priceTable.upsert({
    where: { version: HARPER_PRICE_TABLE_VERSION },
    update: { published: true, publishedAt: new Date() },
    create: {
      version: HARPER_PRICE_TABLE_VERSION,
      currency: HARPER_CATALOG.currency,
      published: true,
      publishedAt: new Date(),
    },
  });

  const baseModule = HARPER_CATALOG.modules.find((m) => m.type === 'armless_seat');
  if (!baseModule) throw new Error('seed: armless seat baseline missing');

  const series = await prisma.series.upsert({
    where: { slug: HARPER_SERIES_ID },
    update: {},
    create: {
      slug: HARPER_SERIES_ID,
      name: 'Harper Cloud',
      status: 'active',
      assetManifestUrl: `${ASSET_BASE}/manifest.json`,
      assetVersion: '1.0.0',
      basePriceMinor: baseModule.basePriceMinor,
      currency: HARPER_CATALOG.currency,
      leadTimeWeeksMin: 6,
      leadTimeWeeksMax: 8,
      seoTitle: 'Harper Cloud Modular Sectional — Build Your Own',
      seoDescription:
        'Custom modular sectional with 3D configuration. Performance fabrics, power recline, white-glove delivery.',
    },
  });

  // 模块
  for (const [i, m] of HARPER_CATALOG.modules.entries()) {
    await prisma.moduleDef.upsert({
      where: { seriesId_code: { seriesId: series.id, code: m.code } },
      update: {
        type: m.type,
        name: m.name,
        status: 'active',
        dimensionsM: m.dimensionsM as Prisma.InputJsonValue,
        sockets: m.sockets,
        powerCompatible: m.powerCompatible,
        basePriceMinor: m.basePriceMinor,
        powerAddonMinor: m.powerAddonMinor,
        sortOrder: i,
      },
      create: {
        seriesId: series.id,
        code: m.code,
        type: m.type,
        name: m.name,
        status: 'active',
        assetUrl: `${ASSET_BASE}/modules/${m.code}.glb`,
        dimensionsM: m.dimensionsM as Prisma.InputJsonValue,
        sockets: m.sockets,
        powerCompatible: m.powerCompatible,
        basePriceMinor: m.basePriceMinor,
        powerAddonMinor: m.powerAddonMinor,
        sortOrder: i,
      },
    });
  }

  // 面料等级 + 色卡
  for (const [i, grade] of HARPER_CATALOG.grades.entries()) {
    const row = await prisma.coverGrade.upsert({
      where: { seriesId_gradeKey: { seriesId: series.id, gradeKey: grade.key as CoverGradeKey } },
      update: { name: grade.name, priceFactor: grade.priceFactor, swatchOrder: i },
      create: {
        seriesId: series.id,
        gradeKey: grade.key as CoverGradeKey,
        name: grade.name,
        priceFactor: grade.priceFactor,
        tint: grade.key === 'fabric' || grade.key === 'performance',
        swatchOrder: i,
      },
    });

    const colors = HARPER_COLORWAYS[grade.key] ?? [];
    for (const c of colors) {
      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.colorway.upsert({
        where: { gradeId_slug: { gradeId: row.id, slug } },
        update: { name: c.name, srgb: c.srgb, millSku: c.millSku },
        create: {
          gradeId: row.id,
          slug,
          name: c.name,
          srgb: c.srgb,
          millSku: c.millSku,
          leatherTexUrl: row.tint ? null : `${ASSET_BASE}/leather/${slug}.ktx2`,
        },
      });
    }
  }

  // 腿
  for (const leg of HARPER_CATALOG.legs) {
    await prisma.seriesLegOption.upsert({
      where: { seriesId_legKey: { seriesId: series.id, legKey: leg.key as LegKey } },
      update: { name: leg.name, priceAddonMinor: leg.priceAddonMinor },
      create: {
        seriesId: series.id,
        legKey: leg.key as LegKey,
        name: leg.name,
        assetUrl: leg.key === 'natural' ? null : `${ASSET_BASE}/legs/${leg.key}.glb`,
        priceAddonMinor: leg.priceAddonMinor,
      },
    });
  }

  // 运费
  for (const r of HARPER_CATALOG.shipping) {
    await prisma.shippingRate.upsert({
      where: {
        zone_service_thresholdMinor: {
          zone: r.zone,
          service: r.service,
          thresholdMinor: r.thresholdMinor,
        },
      },
      update: { feeMinor: r.feeMinor, active: true },
      create: { zone: r.zone, service: r.service, thresholdMinor: r.thresholdMinor, feeMinor: r.feeMinor },
    });
  }

  // 预置模板
  for (const [i, tpl] of HARPER_TEMPLATES.entries()) {
    const slug = tpl.templateId ?? `template-${i}`;
    await prisma.configurationTemplate.upsert({
      where: { seriesId_slug: { seriesId: series.id, slug } },
      update: { designJson: tpl as Prisma.InputJsonValue, sortOrder: i, active: true },
      create: {
        seriesId: series.id,
        slug,
        name: prettyTemplateName(slug),
        designJson: tpl as Prisma.InputJsonValue,
        sortOrder: i,
        active: true,
      },
    });
  }

  console.log(
    `Seed done: 1 series, ${HARPER_CATALOG.modules.length} modules, ${HARPER_CATALOG.grades.length} grades, ${HARPER_TEMPLATES.length} templates.`,
  );
}

function prettyTemplateName(slug: string): string {
  switch (slug) {
    case 'l-sectional-4':
      return 'L-Sectional with Chaise (4 pc)';
    case 'sofa-3':
      return 'Three-Seat Sofa';
    case 'l-sectional-5':
      return 'L-Sectional (5 pc)';
    case 'sofa-4-power':
      return 'Power Four-Seat Sofa';
    default:
      return slug;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
