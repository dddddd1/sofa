import type { Design } from './types';

/**
 * 规范化 Design：
 *  - items 的顺序有语义（拼装序列），保持原序；
 *  - 对象键排序后序列化，保证不同来源/不同键序的同一方案哈希一致；
 *  - 哈希同时喂给 design_quote.snapshot_hash 与 ar_asset_cache.snapshot_hash。
 */
const CANONICAL_FIELDS = [
  'schemaVersion',
  'seriesId',
  'templateId',
  'items',
  'cover',
  'leg',
] as const;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(',')}}`;
}

export function canonicalizeDesign(design: Design): string {
  const picked = Object.fromEntries(
    CANONICAL_FIELDS.map((f) => [f, design[f] as unknown]),
  );
  return stableStringify(picked);
}

/**
 * 方案哈希。使用 Web Crypto（Node 20 / 现代浏览器均内置 globalThis.crypto.subtle），
 * 不引入任何哈希依赖。返回 16 进制 sha256。
 */
export async function hashSnapshot(design: Design): Promise<string> {
  const canonical = canonicalizeDesign(design);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
