import type { Catalog } from '../catalog';
import type { Design } from '../types';

/**
 * Harper Cloud P0 试点系列 fixture。
 * 尺寸来自 3D 资产规范（米），价格为演示价（USD 分），
 * 上线前由商品中心（prisma seed → 后台维护）替换。
 */
export const HARPER_SERIES_ID = 'harper-cloud';
export const HARPER_PRICE_TABLE_VERSION = '2026-09-21-01';

export const HARPER_CATALOG: Catalog = {
  seriesId: HARPER_SERIES_ID,
  priceTableVersion: HARPER_PRICE_TABLE_VERSION,
  currency: 'USD',
  modules: [
    {
      code: 'HC-LAF-01',
      type: 'laf_seat',
      name: 'LAF Arm Seat',
      dimensionsM: { w: 0.838, d: 0.94, h: 0.914 },
      sockets: ['socket_right'],
      powerCompatible: true,
      basePriceMinor: 94000,
      powerAddonMinor: 45000,
    },
    {
      code: 'HC-RAF-01',
      type: 'raf_seat',
      name: 'RAF Arm Seat',
      dimensionsM: { w: 0.838, d: 0.94, h: 0.914 },
      sockets: ['socket_left'],
      powerCompatible: true,
      basePriceMinor: 94000,
      powerAddonMinor: 45000,
    },
    {
      code: 'HC-ARM-01',
      type: 'armless_seat',
      name: 'Armless Seat',
      dimensionsM: { w: 0.838, d: 0.94, h: 0.914 },
      sockets: ['socket_left', 'socket_right'],
      powerCompatible: true,
      basePriceMinor: 84000,
      powerAddonMinor: 45000,
    },
    {
      code: 'HC-CRN-01',
      type: 'corner',
      name: 'Corner',
      dimensionsM: { w: 0.94, d: 0.94, h: 0.914 },
      sockets: ['socket_left', 'socket_front'],
      powerCompatible: false,
      basePriceMinor: 94000,
      powerAddonMinor: 0,
    },
    {
      code: 'HC-CHS-01',
      type: 'chaise',
      name: 'Chaise',
      dimensionsM: { w: 0.838, d: 1.524, h: 0.914 },
      sockets: ['socket_left', 'socket_right'],
      powerCompatible: true,
      basePriceMinor: 112000,
      powerAddonMinor: 45000,
    },
    {
      code: 'HC-OTT-01',
      type: 'ottoman',
      name: 'Ottoman',
      dimensionsM: { w: 0.838, d: 0.61, h: 0.483 },
      sockets: ['socket_left'],
      powerCompatible: false,
      basePriceMinor: 49000,
      powerAddonMinor: 0,
    },
  ],
  grades: [
    { key: 'fabric', name: 'Fabric', priceFactor: 1.0 },
    { key: 'performance', name: 'Performance Fabric', priceFactor: 1.15 },
    { key: 'leather_match', name: 'Leather Match', priceFactor: 1.35 },
    { key: 'top_grain', name: 'Top-Grain Leather', priceFactor: 1.7 },
    { key: 'full_grain', name: 'Full-Grain Leather', priceFactor: 2.1 },
  ],
  legs: [
    { key: 'natural', name: 'Natural Oak', priceAddonMinor: 0 },
    { key: 'walnut', name: 'Walnut', priceAddonMinor: 9000 },
    { key: 'metal', name: 'Brushed Metal', priceAddonMinor: 12000 },
  ],
  shipping: [
    // 门槛取满足 subtotal >= threshold 的最高一档
    { zone: 'US-CONUS', service: 'economy', thresholdMinor: 0, feeMinor: 14900 },
    { zone: 'US-CONUS', service: 'economy', thresholdMinor: 500000, feeMinor: 0 },
    { zone: 'US-CONUS', service: 'white_glove', thresholdMinor: 0, feeMinor: 29900 },
    { zone: 'US-CONUS', service: 'white_glove', thresholdMinor: 500000, feeMinor: 0 },
    { zone: 'US-AK-HI', service: 'economy', thresholdMinor: 0, feeMinor: 34900 },
    { zone: 'US-AK-HI', service: 'white_glove', thresholdMinor: 0, feeMinor: 49900 },
  ],
};

/** P0 四个预置模板之一：4 件套左贵妃 L 形（fabric/Fog 价 = $3,840） */
export const HARPER_TEMPLATE_L_SECTIONAL_4: Design = {
  schemaVersion: 1,
  seriesId: HARPER_SERIES_ID,
  templateId: 'l-sectional-4',
  items: [
    { moduleCode: 'HC-LAF-01', power: false },
    { moduleCode: 'HC-ARM-01', power: false },
    { moduleCode: 'HC-CRN-01', power: false },
    { moduleCode: 'HC-CHS-01', power: false },
  ],
  cover: { grade: 'fabric', colorwayId: 'fog' },
  leg: 'natural',
};

export const HARPER_TEMPLATES: Design[] = [
  HARPER_TEMPLATE_L_SECTIONAL_4,
  {
    schemaVersion: 1,
    seriesId: HARPER_SERIES_ID,
    templateId: 'sofa-3',
    items: [
      { moduleCode: 'HC-LAF-01', power: false },
      { moduleCode: 'HC-ARM-01', power: false },
      { moduleCode: 'HC-RAF-01', power: false },
    ],
    cover: { grade: 'fabric', colorwayId: 'charcoal' },
    leg: 'natural',
  },
  {
    schemaVersion: 1,
    seriesId: HARPER_SERIES_ID,
    templateId: 'l-sectional-5',
    items: [
      { moduleCode: 'HC-LAF-01', power: false },
      { moduleCode: 'HC-ARM-01', power: false },
      { moduleCode: 'HC-CRN-01', power: false },
      { moduleCode: 'HC-ARM-01', power: false },
      { moduleCode: 'HC-RAF-01', power: false },
    ],
    cover: { grade: 'fabric', colorwayId: 'fog' },
    leg: 'walnut',
  },
  {
    schemaVersion: 1,
    seriesId: HARPER_SERIES_ID,
    templateId: 'sofa-4-power',
    items: [
      { moduleCode: 'HC-LAF-01', power: true },
      { moduleCode: 'HC-ARM-01', power: true },
      { moduleCode: 'HC-ARM-01', power: false },
      { moduleCode: 'HC-RAF-01', power: true },
    ],
    cover: { grade: 'performance', colorwayId: 'slate' },
    leg: 'metal',
  },
];

/** 色卡（fabric 示例；完整色卡以后台 colorway 表为准） */
export const HARPER_COLORWAYS: Record<string, { name: string; srgb: string; millSku: string }[]> = {
  fabric: [
    { name: 'Fog', srgb: '#B9B3AA', millSku: 'FB-FOG-01' },
    { name: 'Charcoal', srgb: '#5D564E', millSku: 'FB-CHA-02' },
    { name: 'Oat', srgb: '#C9B39C', millSku: 'FB-OAT-03' },
  ],
  performance: [
    { name: 'Slate', srgb: '#6E7478', millSku: 'PF-SLA-01' },
    { name: 'Sand', srgb: '#C4B5A0', millSku: 'PF-SND-02' },
  ],
  leather_match: [
    { name: 'Caramel', srgb: '#A8703E', millSku: 'LM-CAR-01' },
  ],
  top_grain: [
    { name: 'Cognac', srgb: '#9A5A2E', millSku: 'TG-COG-01' },
  ],
  full_grain: [
    { name: 'Espresso', srgb: '#4A3024', millSku: 'FG-ESP-01' },
  ],
};
