'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw, Filter, TrendingUp,
  BarChart2, Newspaper, CalendarDays, Briefcase, Bookmark, Crown,
} from 'lucide-react';
import { AppNav } from '@/components';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { MarketRegime, MarketSummary, OpportunityListItem } from '@/lib/types';
import {
  MarketRegimeBanner,
  Card, CardHeader, CardTitle, CardBody,
  ScoreBadge, SignalQualityBadge,
  WidgetSkeleton, EmptyState, ErrorState,
  Badge,
} from '@/design-system';
import { track } from '@/lib/analytics';
import { usePageView } from '@/lib/useAnalytics';

// ── WGT-090: Market Pulse ─────────────────────────────────────────────────────

function MarketPulse({ summary }: { summary: MarketSummary }) {
  const change     = summary.egx30_change_pct;
  const changeColor = change == null ? 'var(--text-muted)'
    : change > 0 ? 'var(--success)' : change < 0 ? 'var(--error)' : 'var(--text-secondary)';
  const breadth   = summary.regime?.breadth;
  const topSector = summary.sector_ranking[0];

  const tile = (children: React.ReactNode) => (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      {children}
    </div>
  );

  return (
    <div data-widget-id="WGT-090" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tile(
        <>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>EGX30</p>
          {summary.egx30_close != null && (
            <p className="text-lg font-bold num" style={{ color: 'var(--text-primary)' }}>
              {summary.egx30_close.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}
            </p>
          )}
          {change != null && (
            <p className="text-xs font-medium num" style={{ color: changeColor }}>
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </>
      )}

      {tile(
        <>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>اتجاه السوق</p>
          {breadth ? (
            <div className="flex items-center gap-2 text-xs mt-1">
              <span style={{ color: 'var(--success)' }}>▲ {breadth.advancing}</span>
              <span style={{ color: 'var(--error)' }}>▼ {breadth.declining}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {breadth.unchanged}</span>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>—</p>
          )}
        </>
      )}

      {tile(
        <>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>أقوى قطاع</p>
          {topSector ? (
            <>
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {topSector.sector}
              </p>
              <p className="text-xs num" style={{ color: 'var(--accent-primary)' }}>
                {topSector.avg_score.toFixed(0)} نقطة
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>—</p>
          )}
        </>
      )}

      {tile(
        <>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>الفرص النشطة</p>
          <p className="text-2xl font-black num" style={{ color: 'var(--accent-primary)' }}>
            {summary.opportunities_count}
          </p>
        </>
      )}
    </div>
  );
}

// ── WGT-091: Quick Actions ────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: '/discover',      icon: BarChart2,    label: 'اكتشف',      accent: 'var(--accent-primary)' },
  { href: '/morning-brief', icon: Newspaper,    label: 'موجز صباحي', accent: '#f59e0b' },
  { href: '/my-day',        icon: CalendarDays, label: 'يومي',        accent: '#8b5cf6' },
  { href: '/portfolio',     icon: Briefcase,    label: 'محفظتي',     accent: '#22c55e' },
  { href: '/watchlist',     icon: Bookmark,     label: 'متابعة',     accent: '#06b6d4' },
  { href: '/payments',      icon: Crown,        label: 'PRO ⭐',      accent: '#f59e0b' },
] as const;

function QuickActions({ isProUser }: { isProUser: boolean }) {
  const actions = isProUser
    ? QUICK_ACTIONS.filter((a) => a.href !== '/payments')
    : QUICK_ACTIONS;

  return (
    <div data-widget-id="WGT-091" className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {actions.map(({ href, icon: Icon, label, accent }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}
          >
            <Icon size={20} style={{ color: accent }} />
          </div>
          <span className="text-xs font-medium text-center" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Opportunity row ────────────────────────────────────────────────────────────

function OppRow({ item, lang, rank }: { item: OpportunityListItem; lang: 'ar' | 'en'; rank: number }) {
  const rr = item.levels.rr ?? 0;
  return (
    <Link
      href={`/stocks/${item.symbol}`}
      onClick={() => track('opportunity_clicked', {
        symbol: item.symbol, score: item.radar_score, type: item.type, rank,
      })}
      className="flex items-center gap-3 px-5 py-4 transition-colors rounded-xl group"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      <ScoreBadge score={item.radar_score} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ fontSize: 'var(--text-base)' }}>
            {item.symbol}
          </span>
          {item.is_sharia && (
            <Badge variant="success" className="text-xs">شريعة</Badge>
          )}
        </div>
        <p className="truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {item.name_ar}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span
          className="text-xs px-2 py-0.5 rounded-md font-medium"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          {item.type === 'Breakout' ? 'اختراق' :
           item.type === 'Momentum' ? 'زخم' :
           item.type === 'Sharia'   ? 'شريعة' : 'تأرجح'}
        </span>
        <SignalQualityBadge quality={item.signal_quality} lang={lang} />
      </div>

      <div className="text-end shrink-0 w-16">
        <div
          className="font-bold"
          style={{ fontSize: 'var(--text-base)', color: 'var(--success)' }}
        >
          {rr.toFixed(1)}:1
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>R/R</div>
      </div>

      <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 w-24 text-xs">
        <span style={{ color: 'var(--success)' }}>دخول {item.levels.entry.toFixed(2)}</span>
        <span style={{ color: 'var(--text-muted)' }}>هدف {item.levels.tp1.toFixed(2)}</span>
        <span style={{ color: 'var(--error)' }}>وقف {item.levels.sl.toFixed(2)}</span>
      </div>
    </Link>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { lang, setRegime, shariaFilter, setShariaFilter, user } = useAppStore();

  usePageView();
  const [regime,     setRegimeLocal] = useState<MarketRegime | null>(null);
  const [summary,    setSummary]     = useState<MarketSummary | null>(null);
  const [opps,       setOpps]        = useState<OpportunityListItem[]>([]);
  const [total,      setTotal]       = useState(0);
  const [loading,    setLoading]     = useState(true);
  const [error,      setError]       = useState<string | null>(null);
  const [refreshing, setRefreshing]  = useState(false);

  const load = useCallback(async (sharia = shariaFilter) => {
    try {
      setError(null);
      const [regData, oppsData] = await Promise.all([
        api.getRegime(),
        api.getOpportunities({ limit: 20, sharia }),
      ]);
      setRegimeLocal(regData);
      setRegime(regData);
      setOpps(oppsData.items);
      setTotal(oppsData.total);
      track('regime_viewed', { regime: regData.regime, confidence: regData.confidence });
      // Market pulse — non-critical, load without blocking
      api.getMarketSummary().then(setSummary).catch(() => {});
    } catch {
      setError('تعذّر الاتصال بالخادم. تأكد من تشغيل API على المنفذ 5001.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shariaFilter, setRegime]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleShariaToggle = () => {
    const next = !shariaFilter;
    setShariaFilter(next);
    track('sharia_filter_toggled', { enabled: next });
    setLoading(true);
    load(next);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── WGT-090: Market Pulse ─────────────────────────────────── */}
        {!loading && summary && <MarketPulse summary={summary} />}

        {/* ── WGT-091: Quick Actions ────────────────────────────────── */}
        <QuickActions isProUser={!!user?.is_pro} />

        {/* ── Market Regime ─────────────────────────────────────────── */}
        <section>
          {loading && !regime ? (
            <div className="h-20 rounded-2xl shimmer" style={{ background: 'var(--bg-surface)' }} />
          ) : regime ? (
            <MarketRegimeBanner
              regime={regime.regime}
              confidence={regime.confidence}
              reason={regime.reason?.ar}
              lastUpdated={regime.run_date
                ? `آخر تحديث ${new Date(regime.run_date).toLocaleDateString('ar-EG')}`
                : undefined}
              lang="ar"
            />
          ) : null}
        </section>

        {/* ── WGT-092: Active Opportunities ─────────────────────────── */}
        <Card padding="none" widgetId="WGT-092">
          <CardHeader className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
                <CardTitle>
                  {lang === 'ar' ? 'فرص التداول النشطة' : 'Active Opportunities'}
                </CardTitle>
                {!loading && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    {total}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShariaToggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    background: shariaFilter ? 'var(--success-bg)' : 'var(--bg-elevated)',
                    color:      shariaFilter ? 'var(--success)'    : 'var(--text-muted)',
                    border: `1px solid ${shariaFilter ? 'var(--success)' : 'var(--border-default)'}`,
                  }}
                >
                  <Filter size={12} />
                  {lang === 'ar' ? 'شريعة' : 'Sharia'}
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-0">
            {loading ? (
              <div className="p-5">
                <WidgetSkeleton rows={5} />
              </div>
            ) : error ? (
              <div className="p-5">
                <ErrorState scenario="network" lang="ar" onRetry={handleRefresh} />
              </div>
            ) : opps.length === 0 ? (
              <div className="p-5">
                <EmptyState scenario="no-opportunities" lang="ar" />
              </div>
            ) : (
              <div className="divide-y-0">
                {opps.map((item, idx) => (
                  <OppRow key={item.id} item={item} lang={lang} rank={idx + 1} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ── Footer note ───────────────────────────────────────────── */}
        <p
          className="text-center pb-4"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}
        >
          ⚠️ البيانات للأغراض التعليمية فقط — ليست نصيحة استثمارية
        </p>
      </main>
    </div>
  );
}
