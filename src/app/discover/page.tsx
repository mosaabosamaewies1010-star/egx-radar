'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Minus, Target,
  Filter, RotateCcw, Zap, RefreshCw, Star,
} from 'lucide-react';
import { AppNav } from '@/components';
import { api } from '@/lib/api';
import type { DiscoverItem } from '@/lib/types';
import { Card, ErrorState, WidgetSkeleton } from '@/design-system';
import { track } from '@/lib/analytics';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null, d = 2) {
  if (n == null) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function sraGradeOrder(opp_type: string | null): number {
  if (opp_type === 'SRA_A+') return 0;
  if (opp_type === 'SRA_A')  return 1;
  if (opp_type === 'SRA_B')  return 2;
  return 9;
}

// ── ChangePill ────────────────────────────────────────────────────────────────

function ChangePill({ pct }: { pct: number | null }) {
  if (pct == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const up = pct > 0, dn = pct < 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium num px-1.5 py-0.5 rounded-md"
      style={{
        background: up ? 'rgba(34,197,94,0.12)' : dn ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)',
        color: up ? 'var(--success)' : dn ? 'var(--error)' : 'var(--text-muted)',
      }}
    >
      {up && <TrendingUp size={11} />}
      {dn && <TrendingDown size={11} />}
      {!up && !dn && <Minus size={11} />}
      {up ? '+' : ''}{fmt(pct)}%
    </span>
  );
}

// ── Mini card (for section rows) ──────────────────────────────────────────────

function MiniCard({ item }: { item: DiscoverItem }) {
  const color    = scoreColor(item.score);
  const isSRA    = item.opp_type?.startsWith('SRA_');
  const grade    = item.opp_type?.replace('SRA_', '');

  return (
    <Link
      href={`/stocks/${item.symbol}`}
      className="flex-shrink-0 block rounded-xl p-3 transition-all hover:-translate-y-0.5"
      style={{
        width: 186,
        background: 'var(--bg-surface)',
        border: isSRA ? '1px solid rgba(34,197,94,0.28)' : '1px solid var(--border-subtle)',
      }}
    >
      {/* Symbol + score badge */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-bold num" style={{ color: 'var(--accent-primary)' }}>
              {item.symbol}
            </span>
            {item.is_sharia && (
              <span
                className="text-[8px] px-1 rounded font-bold"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                شريعة
              </span>
            )}
          </div>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'var(--text-muted)', maxWidth: 110, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
          >
            {item.name_ar}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span className="text-sm font-black leading-none num" style={{ color }}>
            {Math.round(item.score)}
          </span>
        </div>
      </div>

      {/* SRA grade badge */}
      {isSRA && (
        <div className="mb-2">
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded"
            style={{
              background: grade === 'A+' ? 'rgba(34,197,94,0.15)' : grade === 'A' ? 'rgba(59,130,246,0.15)' : 'rgba(234,179,8,0.15)',
              color:      grade === 'A+' ? 'var(--success)'        : grade === 'A' ? '#3b82f6'               : 'var(--accent-gold)',
            }}
          >
            إشارة {grade}
          </span>
        </div>
      )}

      {/* Price + change */}
      <div className="flex items-center justify-between">
        <span className="text-xs num" style={{ color: 'var(--text-secondary)' }}>
          {item.last_price != null ? `${fmt(item.last_price, 1)} ج` : '—'}
        </span>
        <ChangePill pct={item.last_change_pct} />
      </div>

      {/* RSI + RVOL */}
      <div
        className="flex items-center justify-between mt-1.5 pt-1.5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <span className="text-[9px] num" style={{ color: 'var(--text-muted)' }}>
          RSI {item.rsi != null ? fmt(item.rsi, 0) : '—'}
        </span>
        <span className="text-[9px] num" style={{ color: 'var(--text-muted)' }}>
          RVOL {item.rvol != null ? `${fmt(item.rvol, 1)}×` : '—'}
        </span>
      </div>
    </Link>
  );
}

// ── Section row (horizontal scroll) ──────────────────────────────────────────

function SectionRow({
  title, icon, items, accent, emptyMsg,
}: {
  title:    string;
  icon:     React.ReactNode;
  items:    DiscoverItem[];
  accent:   string;
  emptyMsg?: string;
}) {
  if (items.length === 0) {
    if (!emptyMsg) return null;
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span style={{ color: accent }}>{icon}</span>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{title}</span>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span style={{ color: accent }}>{icon}</span>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full num"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        >
          {items.length}
        </span>
      </div>
      <div
        className="flex gap-3 pb-2"
        style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}
      >
        {items.map((item) => (
          <MiniCard key={item.symbol} item={item} />
        ))}
      </div>
    </div>
  );
}

// ── Full stock card (grid) ────────────────────────────────────────────────────

function StockCard({ item }: { item: DiscoverItem }) {
  const color = scoreColor(item.score);

  return (
    <Link
      href={`/stocks/${item.symbol}`}
      className="block rounded-xl p-4 transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      data-widget-id="WGT-050"
    >
      {/* Symbol + score */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold num" style={{ color: 'var(--accent-primary)' }}>
              {item.symbol}
            </span>
            {item.is_sharia && (
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                شريعة
              </span>
            )}
            {item.has_opportunity && (
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              >
                <Target size={9} />
                {item.opp_type ?? 'فرصة'}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {item.name_ar}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span className="text-base font-black leading-none num" style={{ color }}>
            {Math.round(item.score)}
          </span>
          <span className="text-[8px] leading-none" style={{ color: 'var(--text-muted)' }}>
            قوة
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold num" style={{ color: 'var(--text-primary)' }}>
          {item.last_price != null ? `${fmt(item.last_price)} ج.م` : '—'}
        </span>
        <ChangePill pct={item.last_change_pct} />
      </div>

      {/* Indicators */}
      <div
        className="grid grid-cols-3 gap-1 pt-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>RSI</span>
          <span className="text-xs font-semibold num" style={{ color: 'var(--text-secondary)' }}>
            {item.rsi != null ? fmt(item.rsi, 0) : '—'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>ADX</span>
          <span className="text-xs font-semibold num" style={{ color: 'var(--text-secondary)' }}>
            {item.adx != null ? fmt(item.adx, 0) : '—'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>RVOL</span>
          <span className="text-xs font-semibold num" style={{ color: 'var(--text-secondary)' }}>
            {item.rvol != null ? fmt(item.rvol, 1) : '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

interface Filters {
  sector:    string;
  sharia:    boolean;
  min_score: number;
  opp_only:  boolean;
  sort:      'score' | 'rvol' | 'rsi' | 'change_pct';
}

const DEFAULT_FILTERS: Filters = {
  sector: '', sharia: false, min_score: 0, opp_only: false, sort: 'score',
};

function FilterBar({
  filters, sectors, onChange, onReset,
}: {
  filters:  Filters;
  sectors:  string[];
  onChange: (f: Partial<Filters>) => void;
  onReset:  () => void;
}) {
  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Card widgetId="WGT-051" padding="md">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        <select
          value={filters.sector}
          onChange={(e) => onChange({ sector: e.target.value })}
          className="text-xs rounded-lg px-3 py-1.5 outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          aria-label="القطاع"
        >
          <option value="">كل القطاعات</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.min_score}
          onChange={(e) => onChange({ min_score: Number(e.target.value) })}
          className="text-xs rounded-lg px-3 py-1.5 outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          aria-label="الحد الأدنى للدرجة"
        >
          <option value={0}>كل الدرجات</option>
          <option value={40}>40+</option>
          <option value={60}>60+</option>
          <option value={75}>75+</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as Filters['sort'] })}
          className="text-xs rounded-lg px-3 py-1.5 outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          aria-label="الترتيب"
        >
          <option value="score">ترتيب: القوة</option>
          <option value="rvol">ترتيب: الحجم النسبي</option>
          <option value="rsi">ترتيب: RSI</option>
          <option value="change_pct">ترتيب: التغيّر%</option>
        </select>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={filters.sharia} onChange={(e) => onChange({ sharia: e.target.checked })} className="rounded" />
          شريعة فقط
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={filters.opp_only} onChange={(e) => onChange({ opp_only: e.target.checked })} className="rounded" />
          ذات فرصة فقط
        </label>

        {isDirty && (
          <button
            onClick={onReset}
            className="ml-auto flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-muted)' }}
            aria-label="إعادة ضبط الفلاتر"
          >
            <RotateCcw size={12} />
            إعادة ضبط
          </button>
        )}
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  // sections data — loaded once, no user filters
  const [allItems,   setAllItems]   = useState<DiscoverItem[]>([]);
  const [wlSymbols,  setWlSymbols]  = useState<Set<string>>(new Set());
  const [sectLoading, setSectLoading] = useState(true);

  // filtered grid
  const [gridItems, setGridItems] = useState<DiscoverItem[]>([]);
  const [sectors,   setSectors]   = useState<string[]>([]);
  const [total,     setTotal]     = useState(0);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError,   setGridError]   = useState<string | null>(null);
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);

  // Load sections (top 100, no filters) + watchlist in parallel on mount
  useEffect(() => {
    track('discover_opened', {});
    Promise.all([
      api.discover({ limit: 100, sort: 'score' }),
      api.getWatchlist().catch(() => ({ items: [] })),
    ]).then(([disc, wl]) => {
      setAllItems(disc.items);
      setSectors(disc.sectors);
      const syms = new Set<string>(
        (wl.items as Array<{ symbol: string | null }>)
          .map((w) => w.symbol ?? '')
          .filter(Boolean)
      );
      setWlSymbols(syms);
    }).catch(() => {
      /* sections non-critical — page still works */
    }).finally(() => setSectLoading(false));
  }, []);

  // Load filtered grid whenever filters change
  const loadGrid = useCallback(async (f: Filters) => {
    setGridLoading(true);
    setGridError(null);
    try {
      const data = await api.discover({
        sector:    f.sector    || undefined,
        sharia:    f.sharia    || undefined,
        min_score: f.min_score || undefined,
        opp_only:  f.opp_only  || undefined,
        sort:      f.sort,
        limit:     60,
      });
      setGridItems(data.items);
      setTotal(data.total);
      if (sectors.length === 0) setSectors(data.sectors);
    } catch {
      setGridError('تعذّر تحميل الأسهم');
    } finally {
      setGridLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadGrid(filters); }, [loadGrid, filters]);

  // ── Derived sections ────────────────────────────────────────────────────────

  const sraSection = [...allItems]
    .filter((i) => i.opp_type?.startsWith('SRA_'))
    .sort((a, b) => sraGradeOrder(a.opp_type) - sraGradeOrder(b.opp_type))
    .slice(0, 8);

  const momentumSection = allItems
    .filter((i) => !i.opp_type?.startsWith('SRA_') && (i.adx ?? 0) >= 25 && (i.rsi ?? 0) >= 55 && (i.rvol ?? 0) >= 1.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const recoverySection = allItems
    .filter((i) => (i.rsi ?? 100) <= 38 && i.obv_trend === 'UP')
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const watchlistSection = allItems
    .filter((i) => wlSymbols.has(i.symbol))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const hasSections = !sectLoading && (
    sraSection.length > 0 || momentumSection.length > 0 ||
    recoverySection.length > 0 || watchlistSection.length > 0
  );

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-7">

        {/* Header */}
        <div>
          <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
            اكتشف الأسهم
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            أسهم مصنّفة بـ القوة — قسّمت لك أبرز الإشارات اليوم
          </p>
        </div>

        {/* ── Ranked Sections ──────────────────────────────────────── */}
        {sectLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2.5">
                <div className="h-5 w-40 rounded shimmer" style={{ background: 'var(--bg-surface)' }} />
                <div className="flex gap-3">
                  {[1,2,3,4].map((j) => (
                    <div key={j} className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 186 }}>
                      <WidgetSkeleton rows={4} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : hasSections ? (
          <div className="space-y-6">
            <SectionRow
              title="إشارات SRA اليوم"
              icon={<Zap size={16} />}
              items={sraSection}
              accent="#22c55e"
            />
            <SectionRow
              title="زخم قوي"
              icon={<TrendingUp size={16} />}
              items={momentumSection}
              accent="#3b82f6"
            />
            <SectionRow
              title="إشارات استرداد"
              icon={<RefreshCw size={16} />}
              items={recoverySection}
              accent="#f59e0b"
            />
            {wlSymbols.size > 0 && (
              <SectionRow
                title="قائمة المتابعة"
                icon={<Star size={16} />}
                items={watchlistSection}
                accent="#818cf8"
                emptyMsg="الأسهم في قائمتك لم تُصنَّف بعد — جرّب غداً"
              />
            )}
          </div>
        ) : null}

        {/* Divider */}
        {hasSections && (
          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
        )}

        {/* ── All Stocks (Filtered) ─────────────────────────────────── */}
        <div className="space-y-4">
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            كل الأسهم
          </h2>

          <FilterBar
            filters={filters}
            sectors={sectors}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />

          {!gridLoading && !gridError && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }} data-widget-id="WGT-052">
              {total} سهم مطابق
              {filters.sector ? ` في ${filters.sector}` : ''}
            </p>
          )}

          {gridLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <WidgetSkeleton rows={4} />
                </div>
              ))}
            </div>
          ) : gridError ? (
            <ErrorState scenario="network" onRetry={() => loadGrid(filters)} />
          ) : gridItems.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                لا توجد أسهم تطابق الفلاتر المختارة
              </p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs mt-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridItems.map((item) => (
                <StockCard key={item.symbol} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
