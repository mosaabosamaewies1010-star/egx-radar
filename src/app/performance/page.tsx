'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Target, Award, BarChart2, Clock, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import type { PerformanceResponse, PerformanceSlice, TradeRecord, TradeHistoryResponse } from '@/lib/types';
import {
  Card, CardHeader, CardTitle, CardBody,
  ErrorState, WidgetSkeleton,
} from '@/design-system';
import { AppNav } from '@/components';

// ── helpers ───────────────────────────────────────────────────────────────────

function pct(n: number | null, decimals = 1): string {
  if (n == null) return '—';
  return `${n.toFixed(decimals)}%`;
}

function pfColor(pf: number | null): string {
  if (pf == null) return 'var(--text-muted)';
  if (pf >= 1.5) return 'var(--success)';
  if (pf >= 1.0) return '#f59e0b';
  return 'var(--error)';
}

function wrColor(wr: number | null): string {
  if (wr == null) return 'var(--text-muted)';
  if (wr >= 50) return 'var(--success)';
  if (wr >= 40) return '#f59e0b';
  return 'var(--error)';
}

// ── WGT-100: Overall stats row ────────────────────────────────────────────────

function OverallStats({ s }: { s: PerformanceSlice }) {
  const stats = [
    { label: 'إجمالي الصفقات', value: s.total.toString(),          icon: <BarChart2 size={16} />, color: 'var(--accent-primary)' },
    { label: 'نسبة الربح',     value: pct(s.win_rate),             icon: <Target    size={16} />, color: wrColor(s.win_rate) },
    { label: 'Profit Factor',  value: s.profit_factor?.toFixed(3) ?? '—', icon: <Award size={16} />, color: pfColor(s.profit_factor) },
    { label: 'متوسط الربح',    value: pct(s.avg_win_pct),          icon: <TrendingUp   size={16} />, color: 'var(--success)' },
    { label: 'متوسط الخسارة',  value: pct(s.avg_loss_pct),        icon: <TrendingDown size={16} />, color: 'var(--error)' },
    { label: 'متوسط الأيام',   value: s.avg_hold_days?.toFixed(1) ?? '—', icon: <Clock size={16} />, color: 'var(--text-secondary)' },
  ];

  return (
    <div data-widget-id="WGT-100" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(({ label, value, icon, color }) => (
        <div
          key={label}
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-1.5" style={{ color }}>
            {icon}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
          <p className="text-xl font-black num" style={{ color }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── WGT-101: By year table ────────────────────────────────────────────────────

function ByYearTable({ rows }: { rows: PerformanceResponse['by_year'] }) {
  return (
    <Card widgetId="WGT-101">
      <CardHeader>
        <CardTitle icon={<BarChart2 size={16} />}>الأداء السنوي</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                {['السنة','الصفقات','نسبة الربح','Profit Factor','متوسط الربح','متوسط الخسارة','وصل TP1','وقف خسارة'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3 font-bold num" style={{ color: 'var(--text-primary)' }}>{r.year}</td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--text-secondary)' }}>{r.total}</td>
                  <td className="px-4 py-3 font-medium num" style={{ color: wrColor(r.win_rate) }}>{pct(r.win_rate)}</td>
                  <td className="px-4 py-3 font-bold num" style={{ color: pfColor(r.profit_factor) }}>{r.profit_factor?.toFixed(3) ?? '—'}</td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--success)' }}>{pct(r.avg_win_pct)}</td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--error)' }}>{pct(r.avg_loss_pct)}</td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--text-secondary)' }}>{pct(r.tp1_rate)}</td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--text-secondary)' }}>{pct(r.sl_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

// ── WGT-102: By sector bars ───────────────────────────────────────────────────

function BySectorTable({ rows }: { rows: PerformanceResponse['by_sector'] }) {
  const maxPF = Math.max(...rows.map(r => r.profit_factor ?? 0));

  return (
    <Card widgetId="WGT-102">
      <CardHeader>
        <CardTitle icon={<Target size={16} />}>الأداء بالقطاع</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const barW = maxPF > 0 ? ((r.profit_factor ?? 0) / maxPF) * 100 : 0;
            const color = pfColor(r.profit_factor);
            return (
              <div key={r.sector}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.sector}</span>
                  <div className="flex items-center gap-3 text-xs num" style={{ color: 'var(--text-muted)' }}>
                    <span>{r.total} صفقة</span>
                    <span style={{ color: wrColor(r.win_rate) }}>ربح {pct(r.win_rate)}</span>
                    <span className="font-bold" style={{ color }}>PF {r.profit_factor?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${barW}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

// ── WGT-103: Top stocks ───────────────────────────────────────────────────────

function TopStocksTable({ rows }: { rows: PerformanceResponse['top_stocks'] }) {
  return (
    <Card widgetId="WGT-103">
      <CardHeader>
        <CardTitle icon={<Award size={16} />}>أفضل الأسهم أداءً</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                {['السهم','الصفقات','نسبة الربح','Profit Factor','متوسط الربح'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.symbol} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3">
                    <Link href={`/stocks/${r.symbol}`} className="font-bold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                      {r.symbol}
                    </Link>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.sector}</p>
                  </td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--text-secondary)' }}>{r.total}</td>
                  <td className="px-4 py-3 font-medium num" style={{ color: wrColor(r.win_rate) }}>{pct(r.win_rate)}</td>
                  <td className="px-4 py-3 font-bold num" style={{ color: pfColor(r.profit_factor) }}>{r.profit_factor?.toFixed(3) ?? '—'}</td>
                  <td className="px-4 py-3 num" style={{ color: 'var(--success)' }}>{pct(r.avg_win_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

// ── WGT-104: Trade History ────────────────────────────────────────────────────

const OUTCOME_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  WIN:     { label: 'ربح ✅',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  LOSS:    { label: 'خسارة ❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  EXPIRED: { label: 'انتهت ⏱', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
};

const EXIT_LABELS: Record<string, string> = {
  TP2:        'وصل TP2',
  TP1:        'وصل TP1',
  SL:         'ضرب SL',
  SL_same_bar:'ضرب SL',
  timeout:    'انتهت المدة',
  MANUAL:     'يدوي',
};

function TradeRow({ t }: { t: TradeRecord }) {
  const oc     = OUTCOME_LABELS[t.outcome] ?? OUTCOME_LABELS.EXPIRED;
  const pnlPos = (t.pnl_pct ?? 0) > 0;
  const pnlNeg = (t.pnl_pct ?? 0) < 0;

  return (
    <tr
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      {/* السهم */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/stocks/${t.symbol}`} className="font-bold hover:underline" style={{ color: 'var(--accent-primary)' }}>
          {t.symbol}
        </Link>
        <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>{t.name_ar}</p>
      </td>

      {/* النوع */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          {t.opp_type}
        </span>
        {t.sra_grade && (
          <span className="mr-1 text-xs font-bold" style={{ color: t.sra_grade === 'A+' ? '#22c55e' : t.sra_grade === 'A' ? '#3b82f6' : '#f59e0b' }}>
            {t.sra_grade}
          </span>
        )}
      </td>

      {/* النتيجة */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ color: oc.color, background: oc.bg }}>
          {oc.label}
        </span>
        {t.exit_reason && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{EXIT_LABELS[t.exit_reason] ?? t.exit_reason}</p>
        )}
      </td>

      {/* PnL */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {t.pnl_pct != null ? (
          <span className="font-bold num" style={{ color: pnlPos ? '#22c55e' : pnlNeg ? '#ef4444' : 'var(--text-muted)' }}>
            {pnlPos ? '+' : ''}{t.pnl_pct.toFixed(2)}%
          </span>
        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>

      {/* السعر */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="text-xs num space-y-0.5">
          <div style={{ color: 'var(--text-secondary)' }}>دخول {t.entry_price?.toFixed(2) ?? '—'}</div>
          {t.exit_price && <div style={{ color: pnlPos ? '#22c55e' : '#ef4444' }}>خروج {t.exit_price.toFixed(2)}</div>}
        </div>
      </td>

      {/* الأيام */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span className="num text-sm" style={{ color: 'var(--text-secondary)' }}>{t.hold_days ?? '—'}</span>
      </td>

      {/* التاريخ */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-xs num" style={{ color: 'var(--text-muted)' }}>
          <div>فُتحت {t.run_date}</div>
          {t.closed_at && <div>أُغلقت {t.closed_at}</div>}
        </div>
      </td>

      {/* السكور */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span className="num font-bold text-sm" style={{ color: t.radar_score >= 70 ? '#22c55e' : t.radar_score >= 60 ? '#f59e0b' : 'var(--text-muted)' }}>
          {t.radar_score.toFixed(0)}
        </span>
      </td>
    </tr>
  );
}

function TradeHistoryTable() {
  const [trades,   setTrades]   = useState<TradeRecord[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [offset,   setOffset]   = useState(0);
  const [filter,   setFilter]   = useState('');   // '' | WIN | LOSS | EXPIRED
  const LIMIT = 20;

  const load = useCallback(async (off: number, outcome: string) => {
    setLoading(true);
    try {
      const res: TradeHistoryResponse = await api.getTradeHistory({
        limit: LIMIT, offset: off, outcome: outcome || undefined,
      });
      setTrades(res.trades);
      setTotal(res.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0, ''); }, [load]);

  const handleFilter = (f: string) => {
    setFilter(f);
    setOffset(0);
    load(0, f);
  };

  const handlePage = (dir: 1 | -1) => {
    const next = offset + dir * LIMIT;
    setOffset(next);
    load(next, filter);
  };

  const pages      = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const FILTERS = [
    { val: '',        label: `الكل (${total})` },
    { val: 'WIN',     label: 'رابحة ✅' },
    { val: 'LOSS',    label: 'خاسرة ❌' },
    { val: 'EXPIRED', label: 'منتهية ⏱' },
  ];

  return (
    <Card widgetId="WGT-104" padding="none">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle icon={<BarChart2 size={16} />}>
            سجل الصفقات — {total} صفقة
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            {FILTERS.map(({ val, label }) => (
              <button
                key={val}
                onClick={() => handleFilter(val)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: filter === val ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color:      filter === val ? 'white' : 'var(--text-secondary)',
                  border:     `1px solid ${filter === val ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {loading ? (
          <div className="p-6"><WidgetSkeleton rows={5} /></div>
        ) : trades.length === 0 ? (
          <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>لا توجد صفقات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['السهم', 'النوع', 'النتيجة', 'PnL %', 'الأسعار', 'أيام', 'التاريخ', 'سكور'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => <TradeRow key={t.id} t={t} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => handlePage(-1)}
              disabled={offset === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              <ChevronRight size={14} /> السابق
            </button>
            <span className="text-xs num" style={{ color: 'var(--text-muted)' }}>
              {currentPage} / {pages}
            </span>
            <button
              onClick={() => handlePage(1)}
              disabled={offset + LIMIT >= total}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              التالي <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [data,    setData]    = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getPerformance());
    } catch {
      setError('تعذّر تحميل بيانات الأداء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
            سجل الأداء
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            نتائج موثقة ومدققة من الباك-تست والإشارات الحية — كل صفقة بسجل قرارها الكامل
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <WidgetSkeleton rows={3} />
            <WidgetSkeleton rows={6} />
          </div>
        ) : error ? (
          <ErrorState scenario="network" onRetry={load} />
        ) : data && data.overall ? (
          <>
            {/* WGT-100 */}
            <OverallStats s={data.overall} />

            {/* Disclaimer */}
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--text-muted)' }}
            >
              النتائج مبنية على بيانات تاريخية (backtest) من 2022 إلى اليوم. الأداء السابق لا يضمن نتائج مستقبلية.
            </div>

            {/* WGT-101 + WGT-102 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ByYearTable rows={data.by_year} />
              <BySectorTable rows={data.by_sector} />
            </div>

            {/* WGT-103 */}
            <TopStocksTable rows={data.top_stocks} />

            {/* WGT-104 */}
            <TradeHistoryTable />
          </>
        ) : (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            لا توجد بيانات أداء بعد
          </div>
        )}

        <p className="text-center pb-4 text-xs" style={{ color: 'var(--text-disabled)' }}>
          ⚠️ البيانات للأغراض التعليمية فقط — ليست نصيحة استثمارية
        </p>
      </main>
    </div>
  );
}
