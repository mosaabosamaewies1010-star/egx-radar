'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, TrendingUp, Activity, BarChart2, ArrowUpRight } from 'lucide-react';
import { AppNav } from '@/components';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { MarketSummary, HeatmapStock } from '@/lib/types';
import {
  MarketRegimeBanner,
  Card, CardHeader, CardTitle, CardBody,
  PriceChangePill,
  WidgetSkeleton, ErrorState, Badge,
} from '@/design-system';
import { track } from '@/lib/analytics';
import { usePageView, useWidgetView } from '@/lib/useAnalytics';
import { getScoreColor } from '@/design-system/tokens/colors';

// ── Market status (Cairo time UTC+2) ─────────────────────────────────────────
function getMarketStatus(): 'open' | 'pre-market' | 'closed' {
  const cairoMs = Date.now() + (2 * 3600000) + (new Date().getTimezoneOffset() * 60000);
  const cairo   = new Date(cairoMs);
  const day     = cairo.getDay(); // 0=Sun … 6=Sat
  const mins    = cairo.getHours() * 60 + cairo.getMinutes();
  if (day === 5 || day === 6) return 'closed';          // Fri/Sat
  if (mins < 10 * 60 + 30)   return 'pre-market';      // before 10:30
  if (mins > 14 * 60 + 30)   return 'closed';          // after 14:30
  return 'open';
}

// ── Score → heatmap color ─────────────────────────────────────────────────────
function scoreToHeatColor(score: number): string {
  if (score >= 75) return '#22C55E';
  if (score >= 60) return '#00C9A7';
  if (score >= 45) return '#3B82F6';
  if (score >= 30) return '#F59E0B';
  return '#EF4444';
}

// ── Mini Heatmap ──────────────────────────────────────────────────────────────
function MiniHeatmap({ stocks }: { stocks: HeatmapStock[] }) {
  if (!stocks.length) return (
    <p className="text-center py-6" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
      لا تتوفر بيانات للخريطة الحرارية حالياً
    </p>
  );

  // Group by sector
  const sectors: Record<string, HeatmapStock[]> = {};
  for (const s of stocks) {
    (sectors[s.sector] ??= []).push(s);
  }

  return (
    <div className="space-y-3">
      {Object.entries(sectors).map(([sector, items]) => (
        <div key={sector} className="space-y-1.5">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{sector}</p>
          <div className="flex flex-wrap gap-1">
            {items.map((s) => (
              <Link
                key={s.symbol}
                href={`/stocks/${s.symbol}`}
                title={`${s.symbol} — Radar ${s.score}`}
                className="rounded transition-opacity hover:opacity-80"
                style={{
                  width: 28, height: 20,
                  background: scoreToHeatColor(s.score),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 8, color: 'white', fontWeight: 700, lineHeight: 1 }}>
                  {s.symbol.slice(0, 3)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        {[
          ['#22C55E', '≥75'],
          ['#00C9A7', '≥60'],
          ['#3B82F6', '≥45'],
          ['#F59E0B', '≥30'],
          ['#EF4444', '<30'],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Breadth Bar ───────────────────────────────────────────────────────────────
function BreadthBar({ advancing, declining, unchanged }: {
  advancing: number; declining: number; unchanged: number;
}) {
  const total = (advancing || 0) + (declining || 0) + (unchanged || 0);
  if (!total) return null;
  const advPct = Math.round((advancing / total) * 100);
  const decPct = Math.round((declining / total) * 100);
  const unchPct = 100 - advPct - decPct;

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        <div style={{ width: `${advPct}%`,  background: 'var(--success)',       borderRadius: '6px 0 0 6px' }} />
        <div style={{ width: `${unchPct}%`, background: 'var(--bg-overlay)' }} />
        <div style={{ width: `${decPct}%`,  background: 'var(--error)',         borderRadius: '0 6px 6px 0' }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--success)' }}>↑ {advancing} ({advPct}%)</span>
        <span>{unchanged} محايد</span>
        <span style={{ color: 'var(--error)' }}>↓ {declining} ({decPct}%)</span>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, valueColor, icon: Icon,
}: {
  label: string; value: string; sub?: string;
  valueColor?: string; icon?: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
}) {
  return (
    <Card padding="lg" className="space-y-1.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} style={{ color: 'var(--text-muted)' }} />}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <p className="font-black num" style={{ fontSize: 'var(--text-2xl)', color: valueColor ?? 'var(--text-primary)' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{sub}</p>}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MarketDashboardPage() {
  const { lang, setRegime } = useAppStore();
  usePageView();

  const breadthRef  = useWidgetView('WGT-008');
  const sectorRef   = useWidgetView('WGT-019');
  const heatmapRef  = useWidgetView('WGT-009');

  const [data,      setData]      = useState<MarketSummary | null>(null);
  const [heatmap,   setHeatmap]   = useState<HeatmapStock[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const marketStatus = getMarketStatus();

  const load = async () => {
    setError(null);
    try {
      const [summary, heatResp] = await Promise.all([
        api.getMarketSummary(),
        api.getHeatmap(),
      ]);
      setData(summary);
      setHeatmap(heatResp.stocks);
      if (summary.regime) {
        setRegime(summary.regime);
        track('regime_viewed', { regime: summary.regime.regime, confidence: summary.regime.confidence });
      }
    } catch {
      setError('تعذّر الاتصال بالخادم. تأكد من تشغيل API على المنفذ 5001.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNav />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="h-6 w-64 rounded-lg shimmer" style={{ background: 'var(--bg-surface)' }} />
          <div className="h-20 rounded-2xl shimmer" style={{ background: 'var(--bg-surface)' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl shimmer" style={{ background: 'var(--bg-surface)' }} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card><WidgetSkeleton rows={6} /></Card>
            <Card><WidgetSkeleton rows={6} /></Card>
          </div>
          <Card><WidgetSkeleton rows={8} /></Card>
        </main>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNav />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          <ErrorState scenario="network" lang="ar" onRetry={load} />
        </main>
      </div>
    );
  }

  const regime   = data?.regime;
  const breadth  = regime?.breadth;
  const egx30    = regime ? data?.egx30_close : null;
  const egxChg   = data?.egx30_change_pct ?? null;

  // Today's Arabic date
  const todayAr = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex flex-col min-h-screen" data-widget-id="LYT-002">
      <AppNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Status bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="font-black" style={{ fontSize: 'var(--text-xl)' }}>
              {lang === 'ar' ? 'لوحة السوق' : 'Market Dashboard'}
            </h1>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: marketStatus === 'open' ? 'var(--success-bg)' : 'var(--bg-elevated)',
                color:      marketStatus === 'open' ? 'var(--success)'    : 'var(--text-muted)',
                border: `1px solid ${marketStatus === 'open' ? 'var(--success)' : 'var(--border-default)'}`,
              }}
            >
              {marketStatus === 'open' ? '● مفتوح' : marketStatus === 'pre-market' ? '◐ قبل الجلسة' : '○ مغلق'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{todayAr}</span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Market Regime Banner (WGT-004) ──────────────────────────── */}
        {regime ? (
          <MarketRegimeBanner
            regime={regime.regime}
            confidence={regime.confidence}
            reason={regime.reason?.ar}
            lastUpdated={regime.run_date
              ? `آخر تحديث ${new Date(regime.run_date).toLocaleDateString('ar-EG')}`
              : undefined}
            lang="ar"
          />
        ) : (
          <div className="h-20 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-center pt-6" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              بيانات Regime غير متاحة
            </p>
          </div>
        )}

        {/* ── Stat cards row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* EGX30 */}
          <Card padding="lg" className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <BarChart2 size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>EGX30</span>
            </div>
            <p className="font-black num" style={{ fontSize: 'var(--text-xl)' }}>
              {egx30 ? egx30.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) : '—'}
            </p>
            {egxChg !== null ? (
              <PriceChangePill change={egxChg * 100} changePct={egxChg} size="sm" />
            ) : (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>تغيير غير متاح</span>
            )}
          </Card>

          {/* Breadth */}
          <Card padding="lg" className="space-y-1.5" ref={breadthRef} data-widget-id="WGT-008">
            <div className="flex items-center gap-1.5">
              <Activity size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>اتساع السوق</span>
            </div>
            {breadth ? (
              <>
                <p className="font-black num" style={{ fontSize: 'var(--text-xl)', color: 'var(--success)' }}>
                  {Math.round(breadth.advancing / ((breadth.advancing + breadth.declining + breadth.unchanged) || 1) * 100)}%
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  ↑{breadth.advancing} ↓{breadth.declining} ={breadth.unchanged}
                </p>
              </>
            ) : (
              <p className="font-black num" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)' }}>—</p>
            )}
          </Card>

          {/* Sector leader */}
          <Card padding="lg" className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>أفضل قطاع</span>
            </div>
            {data?.sector_ranking[0] ? (
              <>
                <p className="font-bold truncate" style={{ fontSize: 'var(--text-base)' }}>
                  {data.sector_ranking[0].sector}
                </p>
                <Badge variant="success">{data.sector_ranking[0].avg_score.toFixed(0)}</Badge>
              </>
            ) : (
              <p className="font-black" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)' }}>—</p>
            )}
          </Card>

          {/* Opportunities count */}
          <Link href="/opportunities">
            <Card padding="lg" className="space-y-1.5 cursor-pointer hover:border-[var(--accent-primary)] transition-colors">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight size={13} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>الفرص النشطة</span>
              </div>
              <p className="font-black num" style={{ fontSize: 'var(--text-2xl)', color: 'var(--accent-primary)' }}>
                {data?.opportunities_count ?? 0}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>اضغط للتفاصيل</p>
            </Card>
          </Link>
        </div>

        {/* ── Main grid: Sector Ranking + Top Lists ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Sector Ranking (WGT-019) */}
          <Card padding="lg" className="space-y-4" ref={sectorRef} data-widget-id="WGT-019">
            <CardTitle>ترتيب القطاعات</CardTitle>
            {!data?.sector_ranking.length ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>لا تتوفر بيانات</p>
            ) : (
              <div className="space-y-2.5">
                {data.sector_ranking.map((s, i) => {
                  const pct = (s.avg_score / 100) * 100;
                  return (
                    <div key={s.sector} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', width: 16 }}>{i + 1}</span>
                          <span style={{ fontSize: 'var(--text-sm)' }}>{s.sector}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.count} سهم</span>
                          <span className="font-bold num" style={{ fontSize: 'var(--text-sm)', color: getScoreColor(s.avg_score) }}>
                            {s.avg_score}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: getScoreColor(s.avg_score) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Top Volume + Top Breakouts */}
          <div className="space-y-4">

            {/* Top Volume */}
            <Card padding="lg" className="space-y-3">
              <CardTitle>أعلى حجم تداول</CardTitle>
              {!data?.top_volume.length ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>لا تتوفر بيانات</p>
              ) : (
                <div className="space-y-2">
                  {data.top_volume.map((s) => (
                    <Link
                      key={s.symbol}
                      href={`/stocks/${s.symbol}`}
                      className="flex items-center justify-between py-1.5 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ fontSize: 'var(--text-sm)' }}>{s.symbol}</span>
                        <span className="truncate max-w-28" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {s.name_ar}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {s.rvol ? `RVOL ${s.rvol}×` : ''}
                        </span>
                        <span className="font-bold num text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: 'var(--bg-elevated)', color: getScoreColor(s.score) }}>
                          {s.score}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Breakouts */}
            <Card padding="lg" className="space-y-3">
              <CardTitle>أقوى اختراق</CardTitle>
              {!data?.top_breakouts.length ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>لا تتوفر بيانات</p>
              ) : (
                <div className="space-y-2">
                  {data.top_breakouts.map((s) => (
                    <Link
                      key={s.symbol}
                      href={`/stocks/${s.symbol}`}
                      className="flex items-center justify-between py-1.5 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ fontSize: 'var(--text-sm)' }}>{s.symbol}</span>
                        <span className="truncate max-w-28" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {s.name_ar}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.trend_score !== undefined && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            اتجاه {s.trend_score}
                          </span>
                        )}
                        <span className="font-bold num text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: 'var(--bg-elevated)', color: getScoreColor(s.score) }}>
                          {s.score}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ── Breadth detail ──────────────────────────────────────────── */}
        {breadth && (
          <Card padding="lg" className="space-y-3">
            <CardTitle>اتساع السوق — تفصيل</CardTitle>
            <BreadthBar
              advancing={breadth.advancing ?? 0}
              declining={breadth.declining ?? 0}
              unchanged={breadth.unchanged ?? 0}
            />
          </Card>
        )}

        {/* ── Mini Heatmap (WGT-009) ──────────────────────────────────── */}
        <Card padding="lg" className="space-y-4" ref={heatmapRef} data-widget-id="WGT-009">
          <CardTitle>خريطة السوق الحرارية</CardTitle>
          <MiniHeatmap stocks={heatmap} />
        </Card>

        {/* ── Disclaimer ──────────────────────────────────────────────── */}
        <p className="text-center pb-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}>
          ⚠️ البيانات للأغراض التعليمية فقط — ليست نصيحة استثمارية
        </p>
      </main>
    </div>
  );
}
