'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Target, Award, BarChart2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import type { PerformanceResponse, PerformanceSlice } from '@/lib/types';
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
