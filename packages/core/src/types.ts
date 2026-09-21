import { z } from 'zod';

/**
 * Design JSON —— 前后端唯一配置契约（见《P0 技术架构方案》第 4 章）。
 * 浏览器编辑、保存、分享、AR、下单全部引用这一结构。
 */
export const DESIGN_SCHEMA_VERSION = 1 as const;

export const legKeySchema = z.enum(['natural', 'walnut', 'metal']);
export type LegKey = z.infer<typeof legKeySchema>;

export const moduleTypeSchema = z.enum([
  'laf_seat',
  'raf_seat',
  'armless_seat',
  'corner',
  'chaise',
  'console',
  'ottoman',
]);
export type ModuleType = z.infer<typeof moduleTypeSchema>;

export const designItemSchema = z.object({
  moduleCode: z.string().min(1),
  power: z.boolean(),
});
export type DesignItem = z.infer<typeof designItemSchema>;

export const designCoverSchema = z.object({
  grade: z.string().min(1),
  colorwayId: z.string().min(1),
});
export type DesignCover = z.infer<typeof designCoverSchema>;

export const designSchema = z.object({
  schemaVersion: z.literal(DESIGN_SCHEMA_VERSION),
  seriesId: z.string().min(1),
  templateId: z.string().nullable(),
  items: z.array(designItemSchema),
  cover: designCoverSchema,
  leg: legKeySchema,
});
export type Design = z.infer<typeof designSchema>;

/** 校验时的可选上下文：房间尺寸用于 warn 级提示，不阻断 */
export interface RoomSize {
  widthM: number;
  depthM: number;
}

export type ShippingZone = 'US-CONUS' | 'US-AK-HI';
export type ShippingService = 'white_glove' | 'economy';

export interface ValidateOptions {
  room?: RoomSize | null;
  shippingZone?: ShippingZone;
  shippingService?: ShippingService;
  /** 外部税务服务算出的税额（分）。W1 未接 Avalara 时为 0，税额在结算页二次确认 */
  taxMinor?: number;
}
