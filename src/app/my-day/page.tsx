'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Minus,
  Bell, Target, Eye, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { MyDay } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardBody, ErrorState, WidgetSkeleton, MetricCard } from '@/design-system';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null, d = 2) {
  if (n == null) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function PnlBadge({ pnl, pct }: { pnl: number | null; pct: number | null }) {
  if (pnl == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const up = pnl > 0, dn = pnl < 0;
  const color = up ? 'var(--success)' : dn ? 'var(--error)' : 'var(--text-muted)';
  return (
    <div className="flex items-center gap-1.5">
      {up && <TrendingUp size={14} style={{ color }} />}
      {dn && <TrendingDown size={14} style={{ color }} />}
      {!up && !dn && <Minus size={14} style={{ color }} />}
      <span className="font-bold num" style={{ color }}>
        {up ? '+' : ''}{fmt(pnl)} ج.م
      </span>
      {pct != null && (
        <span className="text-xs num" style={{ color }}>
          ({up ? '+' : ''}{fmt(pct)}%)
        </span>
      )}
    </div>
  );
}

// ── WGT-070: Portfolio snapshot ───────────────────────────────────────────────

function PortfolioSnapshot({ data }: { data: MyDay }) {
  if (!data.portfolio) {
    return (
      <Card widgetId="WGT-070">
        <CardHeader>
          <CardTitle icon={<TrendingUp size={16} />}>محفظتي اليوم</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="text-center py-6">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              لا توجد صفقات مفتوحة
            </p>
            <Link
              href="/portfolio"
              className="text-xs px-4 py-2 rounded-lg"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              أضف صفقة
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  const p = data.portfolio;
  return (
    <Card widgetId="WGT-070">
      <CardHeader>
        <CardTitle icon={<TrendingUp size={16} />}>محفظتي اليوم</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard label="صفقات مفتوحة" value={String(p.open_positions)} />
          <MetricCard label="إجمالي التكلفة" value={`${fmt(p.total_invested, 0)} ج.م`} />
        </div>
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ربح/خسارة غير محققة
          </span>
          <PnlBadge pnl={p.unrealized_pnl} pct={p.unrealized_pnl_pct} />
        </div>
        <Link
          href="/portfolio"
          className="block text-center text-xs mt-3"
          style={{ color: 'var(--accent-primary)' }}
        >
          عرض المحفظة كاملة ←
        </Link>
      </CardBody>
    </Card>
  );
}

// ── WGT-071: Watchlist alerts ─────────────────────────────────────────────────

function WatchlistAlerts({ data }: { data: MyDay }) {
  return (
    <Card widgetId="WGT-071">
      <CardHeader>
        <CardTitle icon={<Bell size={16} />}>
          تنبيهات المتابعة
          {data.watchlist_alerts.length > 0 && (
            <span
              className="mr-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              {data.watchlist_alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardBody>
        {/* Summary row */}
        <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>
            <Eye size={12} className="inline ml-1" />
            {data.watchlist_count} سهم متابَع
          </span>
          {data.active_opportunities.length > 0 && (
            <span>
              <Target size={12} className="inline ml-1" />
              {data.active_opportunities.length} فرص نشطة
            </span>
          )}
        </div>

        {data.watchlist_alerts.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            لا تنبيهات اليوم
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.watchlist_alerts.map((alert) => {
              const isAbove = alert.alert_type === 'above';
              const color   = isAbove ? 'var(--success)' : 'var(--error)';
              const bg      = isAbove ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
              return (
                <Link
                  key={`${alert.symbol}-${alert.alert_type}`}
                  href={`/stocks/${alert.symbol}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:opacity-90"
                  style={{ background: bg, border: `1px solid ${color}30` }}
                >
                  <AlertTriangle size={14} style={{ color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold num" style={{ color: 'var(--accent-primary)' }}>
                      {alert.symbol}
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {alert.name_ar}
                    </p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p style={{ color }}>
                      {isAbove ? '▲ تجاوز' : '▼ هبط تحت'} {fmt(alert.alert_price)}
                    </p>
                    <p className="num" style={{ color: 'var(--text-secondary)' }}>
                      السعر: {fmt(alert.current_price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Active opportunities for watchlist */}
        {data.active_opportunities.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
              فرص نشطة في قائمة متابعتك
            </p>
            {data.active_opportunities.map((opp) => (
              <Link
                key={opp.symbol}
                href={`/stocks/${opp.symbol}`}
                className="flex items-center gap-2 py-1.5 text-xs hover:opacity-80"
              >
                <span
                  className="px-1.5 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  {opp.opp_type ?? 'فرصة'}
                </span>
                <span style={{ color: 'var(--accent-primary)' }}>{opp.symbol}</span>
                <span style={{ color: 'var(--text-muted)' }}>{opp.name_ar}</span>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/watchlist"
          className="block text-center text-xs mt-3"
          style={{ color: 'var(--accent-primary)' }}
        >
          إدارة قائمة المتابعة ←
        </Link>
      </CardBody>
    </Card>
  );
}

// ── WGT-072: Notifications summary ───────────────────────────────────────────

function NotificationsSummary({ data }: { data: MyDay }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
      data-widget-id="WGT-072"
    >
      <div className="flex items-center gap-3">
        <Bell size={16} style={{ color: 'var(--text-muted)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            الإشعارات
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.unread_notifications > 0
              ? `${data.unread_notifications} غير مقروء`
              : 'لا إشعارات جديدة'}
          </p>
        </div>
      </div>
      {data.unread_notifications > 0 && (
        <Link
          href="/notifications"
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          عرض الكل
        </Link>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyDayPage() {
  const [data,    setData]    = useState<MyDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getMyDay());
    } catch {
      setError('تعذّر تحميل ملخص يومك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6" style={{ minHeight: '100vh' }}>
      <div>
        <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
          يومي
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {data?.as_of ? `ملخص يوم ${data.as_of}` : 'ملخصك الشخصي لليوم'}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <WidgetSkeleton rows={4} />
          <WidgetSkeleton rows={5} />
        </div>
      ) : error ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : data ? (
        <>
          <NotificationsSummary data={data} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioSnapshot data={data} />
            <WatchlistAlerts data={data} />
          </div>
        </>
      ) : null}
    </main>
  );
}
