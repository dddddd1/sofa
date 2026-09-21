'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  validateDesign,
  computeLayout,
  findModule,
  type Catalog,
  type CatalogModule,
  type Design,
  type DesignItem,
  type ValidateResult,
  type LayoutResult,
  type PriceBreakdown,
} from '@harper/core';

const ConfiguratorScene = dynamic(() => import('./three/ConfiguratorScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-black/40">
      Loading 3D…
    </div>
  ),
});

type Zones = 'US-CONUS' | 'US-AK-HI';
type Services = 'white_glove' | 'economy';

const money = (minor: number | null) =>
  minor === null ? '—' : `$${(minor / 100).toFixed(2)}`;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/v1';

interface Quote {
  violations: ValidateResult['violations'];
  layout: LayoutResult;
  bom: ValidateResult['bom'];
  price: PriceBreakdown | null;
  snapshotHash: string | null;
  currency: string;
}

interface Props {
  catalog: Catalog;
  templates: Design[];
  colorways: Record<string, { name: string; srgb: string; millSku: string }[]>;
}

const SERVICE_LABEL: Record<Services, string> = {
  white_glove: 'White-glove delivery',
  economy: 'Economy freight',
};

const ZONE_LABEL: Record<Zones, string> = {
  'US-CONUS': 'Continental US',
  'US-AK-HI': 'AK / HI',
};

export function Configurator({ catalog, templates, colorways }: Props) {
  const [items, setItems] = useState<DesignItem[]>(() =>
    templates[0]!.items.map((i) => ({ ...i })),
  );
  const [cover, setCover] = useState<{ grade: string; colorwayId: string }>(() =>
    templates[0]!.cover,
  );
  const [leg, setLeg] = useState<Design['leg']>(templates[0]!.leg);
  const [shippingZone, setShippingZone] = useState<Zones>('US-CONUS');
  const [shippingService, setShippingService] = useState<Services>('white_glove');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(
    templates[0]!.templateId ?? null,
  );
  const [quote, setQuote] = useState<Quote | null>(null);

  const modulesByCode = useMemo(
    () => new Map(catalog.modules.map((m) => [m.code, m] as const)),
    [catalog],
  );

  const design: Design = useMemo(
    () => ({ schemaVersion: 1, seriesId: catalog.seriesId, templateId: activeTemplate, items, cover, leg }),
    [catalog, items, cover, leg, activeTemplate],
  );

  // 本地即时校验：复用与后端同源的 @harper/core（无网络延迟，毫秒级反馈）
  const result = useMemo(
    () => validateDesign(design, catalog, { shippingZone, shippingService }),
    [design, catalog, shippingZone, shippingService],
  );

  // 权威报价：POST /v1/designs/validate（DB-backed 价格表 + snapshotHash），奈防抖
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch(`${API_BASE}/designs/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design,
          options: { shippingZone, shippingService },
        }),
      });
      if (cancelled) return;
      if (res.ok) {
        const j = await res.json();
        setQuote({
          violations: j.violations,
          layout: j.layout,
          bom: j.bom,
          price: j.price,
          snapshotHash: j.snapshotHash,
          currency: j.meta?.currency ?? catalog.currency,
        });
      }
    };
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [design, shippingZone, shippingService, catalog.currency]);

  // 首帧即时 3D + 报价用本地结果（与服务器同源），权威值随后覆盖
  const localLayout = useMemo(() => {
    try {
      return computeLayout(design, catalog);
    } catch {
      return null;
    }
  }, [design, catalog]);

  const effectiveLayout = quote?.layout ?? localLayout;
  const effectivePrice = quote?.price ?? result.price;
  const effectiveBom = quote?.bom ?? result.bom;
  const hasBlockers = result.violations.filter((v) => v.level === 'block');
  const priceValid = hasBlockers.length === 0;

  const colorHex = useMemo(() => {
    const list = colorways[cover.grade] ?? [];
    const cw = list.find((c) => c.name.toLowerCase() === cover.colorwayId.toLowerCase());
    return cw?.srgb ?? '#b0a89c';
  }, [colorways, cover.grade, cover.colorwayId]);

  const addModule = useCallback(
    (code: string) => {
      const mod = modulesByCode.get(code);
      if (!mod) return;
      setItems((prev) => [...prev, { moduleCode: code, power: false }]);
      setActiveTemplate(null);
    },
    [modulesByCode],
  );

  const removeModule = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setActiveTemplate(null);
  }, []);

  const togglePower = useCallback((index: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, power: !it.power } : it)),
    );
    setActiveTemplate(null);
  }, []);

  const applyTemplate = useCallback(
    (t: Design) => {
      setItems(t.items.map((i) => ({ ...i })));
      setCover(t.cover);
      setLeg(t.leg);
      setActiveTemplate(t.templateId);
    },
    [],
  );

  const onDraftHash = async () => {
    const hash = quote?.snapshotHash;
    if (hash) navigator.clipboard?.writeText(hash).catch(() => {});
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight">Harper Cloud</span>
          <span className="rounded-full bg-harper-clay/10 px-2.5 py-0.5 text-xs text-harper-clay">
            3D Configurator
          </span>
        </div>
        <span className="text-sm font-semibold tabular-nums">{money(effectivePrice ? effectivePrice.subtotalMinor : null)}</span>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_300px]">
        {/* 左：模块与面料配置 */}
        <aside className="flex flex-col gap-6 overflow-y-auto border-r border-black/5 p-5">
          <TemplateSwatches templates={templates} active={activeTemplate} onSelect={applyTemplate} />

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
              Your modules ({items.length})
            </h2>
            <ul className="space-y-2">
              {items.map((it, i) => {
                const m = modulesByCode.get(it.moduleCode);
                return (
                  <li key={i} className="rounded-md border border-black/10 p-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{m?.name ?? it.moduleCode}</p>
                        <p className="text-xs text-black/40">{m?.dimensionsM.w} × {m?.dimensionsM.d} m</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m?.powerCompatible && (
                          <button
                            onClick={() => togglePower(i)}
                            className={`rounded px-2 py-0.5 text-[11px] transition ${
                              it.power ? 'bg-harper-ink text-white' : 'bg-black/5 text-black/50'
                            }`}
                            title="Power module"
                          >
                            Power
                          </button>
                        )}
                        <button
                          onClick={() => removeModule(i)}
                          className="text-black/35 hover:text-red-500"
                          aria-label="Remove module"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
              Add a module
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {catalog.modules.map((m) => (
                <button
                  key={m.code}
                  onClick={() => addModule(m.code)}
                  className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:border-harper-clay hover:text-harper-clay"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </section>

          <CoverPicker catalog={catalog} cover={cover} colorways={colorways} onChange={setCover} />
          <LegPicker catalog={catalog} leg={leg} onChange={setLeg} />
        </aside>

        {/* 中：3D 预览 + 尺寸 + 阻塞提示 */}
        <section className="relative min-h-[420px] bg-[#f4efe7]">
          <div className="absolute inset-0">
            {effectiveLayout && (
              <ConfiguratorScene
                placements={effectiveLayout.placements}
                modules={modulesByCode}
                heightM={effectiveLayout.dimensionsM.h}
                color={colorHex}
              />
            )}
          </div>

          <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-black/70 px-3 py-1.5 text-xs text-white">
            {effectiveLayout
              ? `Occupies ${effectiveLayout.dimensionsM.w.toFixed(2)} × ${effectiveLayout.dimensionsM.d.toFixed(2)} m`
              : 'No valid layout'}
          </div>

          {hasBlockers.length > 0 && (
            <div className="absolute inset-x-4 bottom-4 rounded-md bg-red-50/95 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {hasBlockers.map((v) => (
                <p key={v.code}>• {v.message}</p>
              ))}
            </div>
          )}
        </section>

        {/* 右：报价与 BOM */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-l border-black/5 p-5">
          <section className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-black/40">
              Delivery
            </label>
            <select
              className="rounded-md border border-black/15 px-2.5 py-2 text-sm"
              value={shippingZone}
              onChange={(e) => setShippingZone(e.target.value as Zones)}
            >
              {Object.entries(ZONE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-black/15 px-2.5 py-2 text-sm"
              value={shippingService}
              onChange={(e) => setShippingService(e.target.value as Services)}
            >
              {Object.entries(SERVICE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </section>

          <QuoteCard
            price={effectivePrice}
            bom={effectiveBom}
            currency={catalog.currency}
            priceValid={priceValid}
            onDraftHash={onDraftHash}
          />
        </aside>
      </main>
    </div>
  );
}

function TemplateSwatches({
  templates,
  active,
  onSelect,
}: {
  templates: Design[];
  active: string | null;
  onSelect: (t: Design) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
        Start from a design
      </h2>
      <div className="flex gap-1.5">
        {templates.map((t) => (
          <button
            key={t.templateId}
            onClick={() => onSelect(t)}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition ${
              active === t.templateId
                ? 'border-harper-clay bg-harper-clay/10 text-harper-clay'
                : 'border-black/10 text-black/50 hover:border-black/25'
            }`}
          >
            {t.items.length} pcs
          </button>
        ))}
      </div>
    </section>
  );
}

function CoverPicker({
  catalog,
  cover,
  colorways,
  onChange,
}: {
  catalog: Catalog;
  cover: { grade: string; colorwayId: string };
  colorways: Record<string, { name: string; srgb: string; millSku: string }[]>;
  onChange: (c: { grade: string; colorwayId: string }) => void;
}) {
  const grade = catalog.grades.find((g) => g.key === cover.grade);
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">Fabric</h2>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {catalog.grades.map((g) => (
          <button
            key={g.key}
            onClick={() => {
              const cw = colorways[g.key];
              const first = cw?.[0];
              onChange({ grade: g.key, colorwayId: first?.name.toLowerCase() ?? '' });
            }}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              cover.grade === g.key
                ? 'border-harper-clay bg-harper-clay/10 text-harper-clay'
                : 'border-black/15 hover:border-black/30'
            }`}
          >
            {g.name} · ×{g.priceFactor.toFixed(2)}
          </button>
        ))}
      </div>
      {grade && (
        <div className="flex flex-wrap gap-2">
          {(colorways[cover.grade] ?? []).map((cw) => {
            const id = cw.name.toLowerCase();
            const selected = id === cover.colorwayId;
            return (
              <button
                key={cw.millSku}
                onClick={() => onChange({ grade: cover.grade, colorwayId: id })}
                title={cw.name}
                className="group flex flex-col items-center gap-1"
              >
                <span
                  className={`h-9 w-9 rounded-full border-2 shadow-sm ${
                    selected ? 'border-harper-clay ring-2 ring-harper-clay/30' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: cw.srgb }}
                />
                <span className="text-[10px] text-black/50">{cw.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LegPicker({
  catalog,
  leg,
  onChange,
}: {
  catalog: Catalog;
  leg: Design['leg'];
  onChange: (l: Design['leg']) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">Legs</h2>
      <div className="flex flex-wrap gap-1.5">
        {catalog.legs.map((l) => (
          <button
            key={l.key}
            onClick={() => onChange(l.key as Design['leg'])}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              leg === l.key
                ? 'border-harper-clay bg-harper-clay/10 text-harper-clay'
                : 'border-black/15 hover:border-black/30'
            }`}
          >
            {l.name} {l.priceAddonMinor > 0 ? `+${money(l.priceAddonMinor)}` : ''}
          </button>
        ))}
      </div>
    </section>
  );
}

function QuoteCard({
  price,
  bom,
  currency,
  priceValid,
  onDraftHash,
}: {
  price: PriceBreakdown | null;
  bom: ValidateResult['bom'];
  currency: string;
  priceValid: boolean;
  onDraftHash: () => void;
}) {
  return (
    <section className="rounded-md border border-black/10 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-black/40">
        Quote · {currency}
      </h2>
      {price ? (
        <dl className="space-y-1.5 text-sm">
          <Row label="Modules" value={money(price.modulesMinor)} />
          <Row label="Power" value={price.powerMinor ? money(price.powerMinor) : money(0)} dim={!price.powerMinor} />
          <Row label="Legs" value={money(price.legAddonMinor)} dim={price.legAddonMinor === 0} />
          <Row label="Fabric" value={money(price.coverUpliftMinor)} dim={price.coverUpliftMinor === 0} />
          <div className="my-2 h-px bg-black/10" />
          <Row label="Subtotal" value={money(price.subtotalMinor)} strong />
          <Row label="Delivery" value={money(price.shippingMinor)} />
          {price.taxMinor !== null && <Row label="Tax" value={money(price.taxMinor)} />}
          <div className="my-2 h-px bg-black/10" />
          <Row label="Total" value={money(price.totalMinor)} strong />
        </dl>
      ) : (
        <p className="text-sm text-black/40">Pricing unavailable</p>
      )}

      <div className="mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-black/40">
          Bill of materials
        </h3>
        {bom?.lines.length ? (
          <ul className="mt-2 space-y-1 text-xs text-black/60">
            {bom.lines.map((l) => (
              <li key={l.moduleCode}>
                {l.quantity}× {l.moduleCode}
                {l.power ? ' · Power' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-black/40">Resolve blockers to generate BOM.</p>
        )}
      </div>

      {priceValid && (
        <button
          onClick={onDraftHash}
          className="mt-4 w-full rounded-md bg-harper-ink py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Add to cart — {money(price ? price.totalMinor : null)}
        </button>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  dim,
  strong,
}: {
  label: string;
  value: string;
  dim?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={dim ? 'text-black/35' : 'text-black/55'}>{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-semibold' : ''} ${dim ? 'text-black/35' : ''}`}>{value}</dd>
    </div>
  );
}