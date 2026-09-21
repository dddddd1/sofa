import type { LegKey, ModuleType, ShippingService, ShippingZone } from './types';

/**
 * 商品目录（定价/规则读取的数据面）。
 * W1 由静态 fixture 提供（HARPER_CATALOG）；W2 起由 Postgres + Prisma 提供同形数据，
 * core 不关心数据来源。
 */
export interface DimensionsM {
  w: number;
  d: number;
  h: number;
}

export interface CatalogModule {
  code: string; // HC-LAF-01
  type: ModuleType;
  name: string;
  dimensionsM: DimensionsM;
  /** 连接锚点，取值 socket_left / socket_right / socket_front */
  sockets: string[];
  powerCompatible: boolean;
  /** fabric 等级下的模块基准价（USD 分） */
  basePriceMinor: number;
  /** 升级 Power 的加价（USD 分） */
  powerAddonMinor: number;
}

export interface CatalogGrade {
  key: string; // fabric / performance / leather_match / top_grain / full_grain
  name: string;
  /** 相对 fabric 的价格系数，1.000 = 不加价 */
  priceFactor: number;
}

export interface CatalogLeg {
  key: LegKey;
  name: string;
  priceAddonMinor: number;
}

export interface ShippingRow {
  zone: ShippingZone;
  service: ShippingService;
  /** 满额门槛（分）；subtotal ≥ threshold 时适用该行 */
  thresholdMinor: number;
  feeMinor: number;
}

export interface Catalog {
  seriesId: string;
  priceTableVersion: string;
  currency: string;
  modules: CatalogModule[];
  grades: CatalogGrade[];
  legs: CatalogLeg[];
  shipping: ShippingRow[];
}

export function findModule(catalog: Catalog, code: string): CatalogModule | null {
  return catalog.modules.find((m) => m.code === code) ?? null;
}

export function findGrade(catalog: Catalog, key: string): CatalogGrade | null {
  return catalog.grades.find((g) => g.key === key) ?? null;
}

export function findLeg(catalog: Catalog, key: LegKey): CatalogLeg | null {
  return catalog.legs.find((l) => l.key === key) ?? null;
}

/** 规则上下限（与《P0 技术架构方案》第 7 章规则集一致） */
export const RULE_LIMITS = {
  MIN_MODULES: 3,
  MAX_MODULES: 8,
  MAX_CORNERS: 1,
  MAX_CHAISES: 1,
  MAX_POWER: 4,
  MIN_AISLE_M: 0.76, // 30 inch
} as const;
