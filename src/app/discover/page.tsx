'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Target, Filter, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { DiscoverItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardBody, ErrorState, WidgetSkeleton } from '@/design-system';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null, d = 2) {
  if (n == null) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

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

// ── WGT-050: Stock card ───────────────────────────────────────────────────────

function StockCard({ item }: { item: DiscoverItem }) {
  const color = scoreColor(item.score);

  return (
    <Link
      href={`/stocks/${item.symbol}`}
      className="block rounded-xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
      data-widget-id="WGT-050"
    >
      {/* Top row: symbol + score */}
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

        {/* Score circle */}
        <div
          className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span className="text-base font-black leading-none num" style={{ color }}>
            {Math.round(item.score)}
          </span>
          <span className="text-[8px] leading-none" style={{ color: 'var(--text-muted)' }}>
            راداركور
          </span>
        </div>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold num" style={{ color: 'var(--text-primary)' }}>
          {item.last_price != null ? `${fmt(item.last_price)} ج.م` : '—'}
        </span>
        <ChangePill pct={item.last_change_pct} />
      </div>

      {/* Indicators row */}
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

// ── WGT-051: Filter bar ───────────────────────────────────────────────────────

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
  filters,
  sectors,
  onChange,
  onReset,
}: {
  filters: Filters;
  sectors: string[];
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Card widgetId="WGT-051" padding="md">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Sector */}
        <select
          value={filters.sector}
          onChange={(e) => onChange({ sector: e.target.value })}
          className="text-xs rounded-lg px-3 py-1.5 outline-none"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          aria-label="القطاع"
        >
          <option value="">كل القطاعات</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Min score */}
        <select
          value={filters.min_score}
          onChange={(e) => onChange({ min_score: Number(e.target.value) })}
          className="text-xs rounded-lg px-3 py-1.5 outline-none"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          aria-label="الحد الأدنى للراداركور"
        >
          <option value={0}>كل الدرجات</option>
          <option value={40}>40+</option>
          <option value={60}>60+</option>
          <option value={75}>75+</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as Filters['sort'] })}
          className="text-xs rounded-lg px-3 py-1.5 outline-none"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          aria-label="الترتيب"
        >
          <option value="score">ترتيب: راداركور</option>
          <option value="rvol">ترتيب: الحجم النسبي</option>
          <option value="rsi">ترتيب: RSI</option>
          <option value="change_pct">ترتيب: التغيّر%</option>
        </select>

        {/* Toggles */}
        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={filters.sharia}
            onChange={(e) => onChange({ sharia: e.target.checked })}
            className="rounded"
          />
          شريعة فقط
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={filters.opp_only}
            onChange={(e) => onChange({ opp_only: e.target.checked })}
            className="rounded"
          />
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

// ── Page (WGT-050/051/052) ────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [items,   setItems]   = useState<DiscoverItem[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.discover({
        sector:    f.sector    || undefined,
        sharia:    f.sharia    || undefined,
        min_score: f.min_score || undefined,
        opp_only:  f.opp_only  || undefined,
        sort:      f.sort,
        limit:     60,
      });
      setItems(data.items);
      setTotal(data.total);
      setSectors(data.sectors);
    } catch {
      setError('تعذّر تحميل الأسهم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, [load, filters]);

  const handleFilterChange = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
          اكتشف الأسهم
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          أسهم مصنّفة بالراداركور — فلتر وابحث عن الأفضل
        </p>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} sectors={sectors} onChange={handleFilterChange} onReset={handleReset} />

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }} data-widget-id="WGT-052">
          {total} سهم مطابق
          {filters.sector ? ` في ${filters.sector}` : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <WidgetSkeleton rows={4} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState scenario="network" onRetry={() => load(filters)} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            لا توجد أسهم تطابق الفلاتر المختارة
          </p>
          <button
            onClick={handleReset}
            className="text-xs mt-1"
            style={{ color: 'var(--accent-primary)' }}
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <StockCard key={item.symbol} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
