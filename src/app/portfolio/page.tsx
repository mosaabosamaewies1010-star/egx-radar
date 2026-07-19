'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Minus, ChevronUp, HeartPulse, AlertTriangle, Lightbulb } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { PortfolioHolding, PortfolioSummary, PortfolioHealth } from '@/lib/types';
import {
  Card, CardHeader, CardTitle, CardBody,
  ErrorState, WidgetSkeleton, MetricCard,
} from '@/design-system';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null, decimals = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function PnlCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const up = value > 0;
  const dn = value < 0;
  return (
    <span
      className="flex items-center gap-1 font-medium num"
      style={{ color: up ? 'var(--success)' : dn ? 'var(--error)' : 'var(--text-muted)' }}
    >
      {up && <TrendingUp  size={12} />}
      {dn && <TrendingDown size={12} />}
      {!up && !dn && <Minus size={12} />}
      {fmt(value)}
    </span>
  );
}

// ── WGT-022: Summary bar ─────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: PortfolioSummary }) {
  const pnlPct = summary.total_invested > 0 && summary.total_unrealized_pnl !== null
    ? (summary.total_unrealized_pnl / summary.total_invested) * 100
    : undefined;

  return (
    <Card
      widgetId="WGT-022"
      padding="none"
      className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--border-subtle)]"
    >
      <MetricCard
        label="إجمالي المستثمر"
        value={fmt(summary.total_invested)}
        suffix=" ج.م"
        widgetId="WGT-022-invested"
      />
      <MetricCard
        label="مراكز مفتوحة"
        value={summary.open_positions}
        widgetId="WGT-022-open"
      />
      <MetricCard
        label="أرباح/خسائر غير محققة"
        value={summary.total_unrealized_pnl !== null ? fmt(summary.total_unrealized_pnl) : '—'}
        change={pnlPct}
        suffix={summary.total_unrealized_pnl !== null ? ' ج.م' : ''}
        widgetId="WGT-022-unrealized"
      />
      <MetricCard
        label="أرباح/خسائر محققة"
        value={fmt(summary.total_realized_pnl)}
        suffix=" ج.م"
        widgetId="WGT-022-realized"
      />
    </Card>
  );
}

// ── WGT-025: Portfolio Health ─────────────────────────────────────────────────

function healthColor(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 40) return '#f59e0b';
  return 'var(--error)';
}

function HealthBar({ label, score, max, sub }: { label: string; score: number; max: number; sub?: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = healthColor(pct);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</span>
        <span className="num" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {score.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      {sub && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function PortfolioHealthCard({ health }: { health: PortfolioHealth }) {
  if (health.health_score == null) {
    return (
      <Card widgetId="WGT-025" padding="lg">
        <CardHeader><CardTitle icon={<HeartPulse size={16} />}>صحة المحفظة</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            {health.message ?? 'مفيش بيانات كافية لحساب صحة المحفظة'}
          </p>
        </CardBody>
      </Card>
    );
  }

  const c = health.components;
  const color = healthColor(health.health_score);

  return (
    <Card widgetId="WGT-025" padding="lg" className="space-y-4">
      <CardHeader>
        <CardTitle icon={<HeartPulse size={16} />}>صحة المحفظة</CardTitle>
      </CardHeader>

      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-black num shrink-0"
          style={{ background: `${color}18`, border: `2px solid ${color}`, color, fontSize: 'var(--text-2xl)' }}
        >
          {Math.round(health.health_score)}
        </div>
        <div className="flex-1 space-y-3">
          <HealthBar label="التنويع" score={c.diversification.score} max={c.diversification.max}
            sub={c.diversification.top_sector ? `أعلى قطاع: ${c.diversification.top_sector} (${c.diversification.top_sector_pct}%)` : undefined} />
          <HealthBar label="المخاطرة" score={c.risk.score} max={c.risk.max}
            sub={c.risk.weighted_atr_pct != null ? `متوسط التقلب (ATR) مرجّح: ${c.risk.weighted_atr_pct}%` : undefined} />
          <HealthBar label="الجودة الفنية" score={c.technical_quality.score} max={c.technical_quality.max}
            sub={c.technical_quality.weighted_radar_score != null ? `متوسط radar_score مرجّح: ${c.technical_quality.weighted_radar_score}/100` : undefined} />
          <HealthBar label="الأداء" score={c.performance.score} max={c.performance.max}
            sub={c.performance.return_pct != null ? `العائد الكلي: ${c.performance.return_pct > 0 ? '+' : ''}${c.performance.return_pct}%` : undefined} />
        </div>
      </div>

      {health.warnings.length > 0 && (
        <div className="space-y-1.5 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {health.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle size={13} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{w}</span>
            </div>
          ))}
        </div>
      )}

      {health.recommendations.length > 0 && (
        <div className="space-y-1.5">
          {health.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <Lightbulb size={13} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{r}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}>
        الأداء محسوب من إجمالي الربح/الخسارة (محقق وغير محقق) على رأس المال المستثمر — بدون مقارنة بمؤشر EGX30 حاليًا
      </p>
    </Card>
  );
}

// ── WGT-023: Holdings list ────────────────────────────────────────────────────

interface HoldingRowProps {
  holding: PortfolioHolding;
  onClose: (id: number, price: number) => void;
  onDelete: (id: number) => void;
  closingId: number | null;
  deletingId: number | null;
}

function HoldingRow({ holding: h, onClose, onDelete, closingId, deletingId }: HoldingRowProps) {
  const [closePrice, setClosePrice] = useState('');
  const [showClose, setShowClose] = useState(false);

  const handleConfirmClose = () => {
    const price = parseFloat(closePrice);
    if (!price || price <= 0) return;
    onClose(h.id, price);
    setShowClose(false);
    setClosePrice('');
  };

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex items-center gap-3">
        {/* Symbol */}
        <span
          className="w-16 text-xs font-bold shrink-0 num"
          style={{ color: 'var(--accent-primary)' }}
        >
          {h.symbol ?? '—'}
        </span>

        {/* Name */}
        <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {h.name_ar ?? '—'}
        </span>

        {/* Qty × avg cost */}
        <span className="hidden sm:block text-xs num" style={{ color: 'var(--text-muted)' }}>
          {h.quantity} × {fmt(h.avg_cost)}
        </span>

        {/* Cost basis */}
        <span className="text-xs num w-24 text-left" style={{ color: 'var(--text-secondary)' }}>
          {fmt(h.cost_basis)} ج.م
        </span>

        {/* P&L column */}
        <span className="w-28 text-xs text-left">
          {h.is_open ? <PnlCell value={h.unrealized_pnl} /> : <PnlCell value={h.realized_pnl} />}
        </span>

        {/* Close button — only on open positions */}
        {h.is_open && (
          <button
            onClick={() => setShowClose((v) => !v)}
            className="text-xs px-2 py-1 rounded-md transition-colors shrink-0 flex items-center gap-1"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            {showClose ? <ChevronUp size={12} /> : 'إغلاق'}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(h.id)}
          disabled={deletingId === h.id}
          className="p-1 rounded-md transition-colors shrink-0 disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          aria-label="حذف"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inline close form */}
      {showClose && (
        <div className="flex items-center gap-2 pr-4 pl-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>سعر الخروج:</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={closePrice}
            onChange={(e) => setClosePrice(e.target.value)}
            className="w-28 rounded-lg px-3 py-1.5 text-xs outline-none num"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              direction: 'ltr',
            }}
          />
          <button
            onClick={handleConfirmClose}
            disabled={closingId === h.id || !closePrice || parseFloat(closePrice) <= 0}
            className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 flex items-center gap-1"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {closingId === h.id ? (
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : 'تأكيد'}
          </button>
        </div>
      )}
    </div>
  );
}

function HoldingsList({
  holdings,
  onClose,
  onDelete,
  closingId,
  deletingId,
}: {
  holdings: PortfolioHolding[];
  onClose: (id: number, price: number) => void;
  onDelete: (id: number) => void;
  closingId: number | null;
  deletingId: number | null;
}) {
  const open   = holdings.filter((h) => h.is_open);
  const closed = holdings.filter((h) => !h.is_open);

  return (
    <Card widgetId="WGT-023" padding="md">
      <CardHeader>
        <CardTitle>المحفظة</CardTitle>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {open.length} مفتوح · {closed.length} مغلق
        </span>
      </CardHeader>
      <CardBody>
        {holdings.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            لا توجد صفقات بعد — أضف أولى مراكزك
          </p>
        ) : (
          <>
            {open.length > 0 && (
              <>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  مفتوحة ({open.length})
                </p>
                {open.map((h) => (
                  <HoldingRow
                    key={h.id}
                    holding={h}
                    onClose={onClose}
                    onDelete={onDelete}
                    closingId={closingId}
                    deletingId={deletingId}
                  />
                ))}
              </>
            )}
            {closed.length > 0 && (
              <>
                <p className="text-xs font-semibold mb-2 mt-4" style={{ color: 'var(--text-muted)' }}>
                  مغلقة ({closed.length})
                </p>
                {closed.map((h) => (
                  <HoldingRow
                    key={h.id}
                    holding={h}
                    onClose={onClose}
                    onDelete={onDelete}
                    closingId={closingId}
                    deletingId={deletingId}
                  />
                ))}
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

// ── WGT-024: Add position form ────────────────────────────────────────────────

function AddPositionForm({
  onAdd,
}: {
  onAdd: (symbol: string, quantity: number, avgCost: number, notes?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [symbol,   setSymbol]   = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost,  setAvgCost]  = useState('');
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const reset = () => { setSymbol(''); setQuantity(''); setAvgCost(''); setNotes(''); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty  = parseFloat(quantity);
    const cost = parseFloat(avgCost);
    if (!symbol.trim() || qty <= 0 || cost <= 0) {
      setError('يرجى إدخال رمز السهم والكمية والسعر');
      return;
    }
    setLoading(true);
    try {
      await onAdd(symbol.trim().toUpperCase(), qty, cost, notes || undefined);
      reset();
      setExpanded(false);
    } catch (err) {
      if (err instanceof ApiError) {
        let msg: string;
        try { msg = JSON.parse(err.message).error ?? err.message; } catch { msg = err.message; }
        setError(msg);
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card widgetId="WGT-024" padding="md">
      <button
        onClick={() => { setExpanded((v) => !v); if (expanded) reset(); }}
        className="w-full flex items-center justify-between"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-sm font-semibold">إضافة صفقة جديدة</span>
        {expanded
          ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
          : <Plus size={16} style={{ color: 'var(--accent-primary)' }} />}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {error && (
            <div
              role="alert"
              className="rounded-lg px-4 py-2.5 text-xs text-center"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>رمز السهم *</label>
              <input
                type="text"
                placeholder="COMI"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="rounded-lg px-3 py-2 text-sm outline-none num"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  direction: 'ltr',
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>الكمية *</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none num"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  direction: 'ltr',
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>متوسط السعر (ج.م) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="87.50"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none num"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  direction: 'ltr',
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>ملاحظات (اختياري)</label>
            <input
              type="text"
              placeholder="وصف الصفقة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setExpanded(false); reset(); }}
              className="text-xs px-4 py-2 rounded-lg"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-60 flex items-center gap-1.5"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {loading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              {loading ? 'جارٍ الإضافة…' : 'إضافة'}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [summary,    setSummary]    = useState<PortfolioSummary | null>(null);
  const [holdings,   setHoldings]   = useState<PortfolioHolding[]>([]);
  const [health,     setHealth]     = useState<PortfolioHealth | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [closingId,  setClosingId]  = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPortfolio();
      setSummary(data.summary);
      setHoldings(data.holdings);
    } catch {
      setError('تعذّر تحميل المحفظة');
      setLoading(false);
      return;
    }
    // منفصلة عن التحميل الأساسي — لو فشلت، القايمة والملخص لسه بيظهروا عادي
    try {
      setHealth(await api.getPortfolioHealth());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (symbol: string, quantity: number, avgCost: number, notes?: string) => {
    await api.addHolding({ symbol, quantity, avg_cost: avgCost, notes });
    await load();
  };

  const handleClose = async (id: number, price: number) => {
    setClosingId(id);
    try {
      await api.closeHolding(id, price);
      await load();
    } finally {
      setClosingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.deleteHolding(id);
      const data = await api.getPortfolio();
      setSummary(data.summary);
      setHoldings(data.holdings);
      try { setHealth(await api.getPortfolioHealth()); } catch { setHealth(null); }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6"
      style={{ minHeight: '100vh' }}
    >
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
        >
          محفظتي
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          تتبّع مراكزك ومتوسطات الشراء والأرباح والخسائر
        </p>
      </div>

      {loading ? (
        <>
          <div className="rounded-2xl overflow-hidden"><WidgetSkeleton rows={1} /></div>
          <div className="rounded-2xl overflow-hidden"><WidgetSkeleton rows={5} /></div>
        </>
      ) : error ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : (
        <>
          {summary && <SummaryBar summary={summary} />}
          {health && <PortfolioHealthCard health={health} />}
          <AddPositionForm onAdd={handleAdd} />
          <HoldingsList
            holdings={holdings}
            onClose={handleClose}
            onDelete={handleDelete}
            closingId={closingId}
            deletingId={deletingId}
          />
        </>
      )}

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        الأرباح والخسائر غير المحققة مبنية على آخر سعر متاح — ليست تحديثاً لحظياً
      </p>
    </main>
  );
}
