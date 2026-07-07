'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, X, Bell, BellOff, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { WatchlistItem } from '@/lib/types';
import {
  Card, CardHeader, CardTitle, CardBody,
  ErrorState, WidgetSkeleton,
} from '@/design-system';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null, decimals = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function ChangePill({ pct }: { pct: number | null }) {
  if (pct === null || pct === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const up = pct > 0;
  const dn = pct < 0;
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

// ── WGT-030: Watchlist item row ───────────────────────────────────────────────

interface ItemRowProps {
  item: WatchlistItem;
  onRemove: (id: number) => void;
  onUpdate: (id: number, data: { notes?: string; alert_price_above?: number | null; alert_price_below?: number | null }) => Promise<void>;
  removingId: number | null;
}

function ItemRow({ item, onRemove, onUpdate, removingId }: ItemRowProps) {
  const [expanded,   setExpanded]   = useState(false);
  const [notes,      setNotes]      = useState(item.notes ?? '');
  const [above,      setAbove]      = useState(item.alert_price_above != null ? String(item.alert_price_above) : '');
  const [below,      setBelow]      = useState(item.alert_price_below != null ? String(item.alert_price_below) : '');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  const hasAlerts = item.alert_price_above != null || item.alert_price_below != null;

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await onUpdate(item.id, {
        notes: notes.trim() || undefined,
        alert_price_above: above ? parseFloat(above) : null,
        alert_price_below: below ? parseFloat(below) : null,
      });
      setExpanded(false);
    } catch (err) {
      if (err instanceof ApiError) {
        let msg: string;
        try { msg = JSON.parse(err.message).error ?? err.message; } catch { msg = err.message; }
        setSaveError(msg);
      } else {
        setSaveError('حدث خطأ');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col border-b border-[var(--border-subtle)] last:border-0">
      {/* Main row */}
      <div className="flex items-center gap-3 py-3">
        {/* Symbol → stock page */}
        <Link
          href={`/stocks/${item.symbol}`}
          className="w-16 text-xs font-bold shrink-0 num hover:underline"
          style={{ color: 'var(--accent-primary)' }}
        >
          {item.symbol ?? '—'}
        </Link>

        {/* Name + sector */}
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{item.name_ar ?? '—'}</p>
          {item.sector && (
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{item.sector}</p>
          )}
        </div>

        {/* Last price */}
        <span className="text-xs num w-20 text-left" style={{ color: 'var(--text-secondary)' }}>
          {item.last_price != null ? `${fmt(item.last_price)} ج.م` : '—'}
        </span>

        {/* Change pill */}
        <span className="w-20 text-left">
          <ChangePill pct={item.last_change_pct} />
        </span>

        {/* Alert indicator */}
        <span
          className="shrink-0"
          title={hasAlerts ? 'تنبيهات مضبوطة' : 'لا تنبيهات'}
          style={{ color: hasAlerts ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          {hasAlerts ? <Bell size={13} /> : <BellOff size={13} />}
        </span>

        {/* Edit toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs px-2 py-1 rounded-md shrink-0"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          aria-label="تعديل"
        >
          {expanded ? <ChevronUp size={12} /> : 'تعديل'}
        </button>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.id)}
          disabled={removingId === item.id}
          className="p-1 rounded-md shrink-0 disabled:opacity-40 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="حذف"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inline edit form */}
      {expanded && (
        <div className="pb-3 pl-20 pr-4 flex flex-col gap-3">
          {saveError && (
            <div
              role="alert"
              className="rounded-lg px-3 py-2 text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {saveError}
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>ملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سبب الاهتمام..."
              className="rounded-lg px-3 py-1.5 text-xs outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Alert prices */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>تنبيه إذا تجاوز</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={above}
                onChange={(e) => setAbove(e.target.value)}
                placeholder="—"
                className="rounded-lg px-3 py-1.5 text-xs outline-none num"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  direction: 'ltr',
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>تنبيه إذا انخفض عن</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={below}
                onChange={(e) => setBelow(e.target.value)}
                placeholder="—"
                className="rounded-lg px-3 py-1.5 text-xs outline-none num"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  direction: 'ltr',
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-60 flex items-center gap-1"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {saving
                ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : null}
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WGT-031: Watchlist list ───────────────────────────────────────────────────

function WatchlistList({
  items,
  onRemove,
  onUpdate,
  removingId,
}: {
  items: WatchlistItem[];
  onRemove: (id: number) => void;
  onUpdate: (id: number, data: { notes?: string; alert_price_above?: number | null; alert_price_below?: number | null }) => Promise<void>;
  removingId: number | null;
}) {
  return (
    <Card widgetId="WGT-031" padding="md">
      <CardHeader>
        <CardTitle>قائمة المتابعة</CardTitle>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {items.length} سهم
        </span>
      </CardHeader>
      <CardBody>
        {items.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            لا توجد أسهم في قائمة المتابعة — أضف أول سهم
          </p>
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onRemove={onRemove}
              onUpdate={onUpdate}
              removingId={removingId}
            />
          ))
        )}
      </CardBody>
    </Card>
  );
}

// ── WGT-032: Add stock form ───────────────────────────────────────────────────

function AddStockForm({
  onAdd,
}: {
  onAdd: (symbol: string, notes?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [symbol,   setSymbol]   = useState('');
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const reset = () => { setSymbol(''); setNotes(''); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!symbol.trim()) {
      setError('يرجى إدخال رمز السهم');
      return;
    }
    setLoading(true);
    try {
      await onAdd(symbol.trim().toUpperCase(), notes.trim() || undefined);
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
    <Card widgetId="WGT-032" padding="md">
      <button
        onClick={() => { setExpanded((v) => !v); if (expanded) reset(); }}
        className="w-full flex items-center justify-between"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-sm font-semibold">إضافة سهم للمتابعة</span>
        {expanded
          ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
          : <Plus size={16} style={{ color: 'var(--accent-primary)' }} />}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {error && (
            <div
              role="alert"
              className="rounded-lg px-4 py-2.5 text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>ملاحظات (اختياري)</label>
              <input
                type="text"
                placeholder="سبب الاهتمام..."
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
              {loading
                ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <Plus size={13} />}
              {loading ? 'جارٍ الإضافة…' : 'إضافة'}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ── Page (WGT-030/031/032) ────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [items,      setItems]      = useState<WatchlistItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWatchlist();
      setItems(data.items);
    } catch {
      setError('تعذّر تحميل قائمة المتابعة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (symbol: string, notes?: string) => {
    await api.addToWatchlist({ symbol, notes });
    await load();
  };

  const handleUpdate = async (
    id: number,
    data: { notes?: string; alert_price_above?: number | null; alert_price_below?: number | null },
  ) => {
    const updated = await api.updateWatchlistItem(id, data);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
  };

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await api.removeFromWatchlist(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      setRemovingId(null);
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
          قائمة المتابعة
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          تابع أسهمك المفضلة واضبط تنبيهات الأسعار
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl overflow-hidden"><WidgetSkeleton rows={5} /></div>
      ) : error ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : (
        <>
          <AddStockForm onAdd={handleAdd} />
          <WatchlistList
            items={items}
            onRemove={handleRemove}
            onUpdate={handleUpdate}
            removingId={removingId}
          />
        </>
      )}
    </main>
  );
}
