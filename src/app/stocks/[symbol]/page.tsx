'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, RefreshCw, ExternalLink, Star, Lock } from 'lucide-react';
import { AppNav } from '@/components';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import { usePageView, useWidgetView } from '@/lib/useAnalytics';
import { useAppStore } from '@/lib/store';
import type { StockData, SRAOpportunity } from '@/lib/types';
import { getScoreColor } from '@/design-system/tokens/colors';
import {
  ScoreGauge, RadarScoreDisplay,
  Card, CardHeader, CardTitle, CardBody,
  PriceChangePill, MarketRegimeBanner,
  TrendStrengthBar, RiskMeter, SignalQualityBadge,
  OpportunityCard, MetricCard, MetricGrid,
  WidgetSkeleton, ScoreSkeleton, ErrorState, Badge,
} from '@/design-system';

// ── Score Breakdown Bar ───────────────────────────────────────────────────────
function BreakdownBar({
  label, value, max, color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Explain Bullets ───────────────────────────────────────────────────────────
function ExplainWidget({ text }: { text: string }) {
  if (!text) return null;
  const bullets = text.split('\n').filter(Boolean);
  return (
    <div className="space-y-2.5">
      {bullets.map((line, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', borderRight: '2px solid var(--border-strong)' }}
        >
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Trend strength from ADX ───────────────────────────────────────────────────
function adxToStrength(adx: number, rsi: number) {
  if (adx >= 35 && rsi > 55) return 'STRONG_UP'   as const;
  if (adx >= 25 && rsi > 50) return 'MODERATE_UP' as const;
  if (adx >= 25 && rsi < 45) return 'MODERATE_DOWN' as const;
  if (adx >= 35 && rsi < 40) return 'STRONG_DOWN' as const;
  return 'FLAT' as const;
}

// ── Risk level from ATR% ──────────────────────────────────────────────────────
function atrToRisk(atrPct: number) {
  if (atrPct >= 4) return 'VERY_HIGH' as const;
  if (atrPct >= 2.5) return 'HIGH' as const;
  if (atrPct >= 1.5) return 'MEDIUM' as const;
  return 'LOW' as const;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StockPage() {
  const params = useParams<{ symbol: string }>();
  const router = useRouter();
  const symbol = params.symbol.toUpperCase();
  const { lang, regime: regimeState } = useAppStore();

  usePageView();
  const gaugeRef = useWidgetView('WGT-002', { symbol });
  const explainRef = useWidgetView('WGT-003', { symbol });
  const oppRef = useWidgetView('WGT-016', { symbol });

  const [data,    setData]    = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<{ status?: number; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const stock = await api.getStock(symbol);
      setData(stock);
      track('stock_page_viewed', { symbol, score: stock.score, data_quality: stock.data_quality });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError({ status: 404, msg: `السهم "${symbol}" غير موجود في قاعدة البيانات.` });
      } else {
        setError({ msg: 'تعذّر الاتصال بالخادم. تأكد من تشغيل API.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 rounded-lg shimmer" style={{ background: 'var(--bg-surface)' }} />
            <div className="h-8 w-40 rounded-lg shimmer" style={{ background: 'var(--bg-surface)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="md:col-span-1 flex items-center justify-center p-8">
              <ScoreSkeleton />
            </Card>
            <Card className="md:col-span-2">
              <WidgetSkeleton rows={6} />
            </Card>
          </div>
          <Card><WidgetSkeleton rows={4} /></Card>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <ErrorState
            scenario={error.status === 404 ? 'not-found' : 'network'}
            lang="ar"
            onRetry={load}
          />
        </main>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = getScoreColor(data.score);
  const ind    = data.indicators;
  const bd     = data.breakdown;
  const opp    = data.opportunity;
  const sra: SRAOpportunity | null = data.sra_opportunity ?? null;
  const isPro  = (data as any).is_pro ?? false;

  const trendStrength = adxToStrength(ind.adx, ind.rsi);
  const riskLevel     = atrToRisk(ind.atr_pct);

  return (
    <div className="flex flex-col min-h-screen" data-regime={regimeState}>
      <AppNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowRight size={14} />
            رجوع
          </button>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{symbol}</span>
          <span style={{ color: 'var(--text-disabled)' }}>—</span>
          <span style={{ color: 'var(--text-disabled)' }}>{data.name_ar}</span>
          {data.is_sharia && <Badge variant="success" className="mr-1">شريعة</Badge>}
        </div>

        {/* ── Stock Header ────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-black tracking-tight" style={{ fontSize: 'var(--text-3xl)' }}>
              {symbol}
            </h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>
              {data.name_ar}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-md"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {data.sector}
              </span>
              {data.price && (
                <PriceChangePill
                  change={data.change_amt ?? 0}
                  changePct={data.change_pct ?? 0}
                  size="md"
                />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
              title="تحديث"
            >
              <RefreshCw size={15} />
            </button>
            <Badge variant={data.data_quality === 'HIGH' ? 'success' : data.data_quality === 'MEDIUM' ? 'warning' : 'error'} dot>
              {data.data_quality === 'HIGH' ? 'بيانات عالية' : data.data_quality === 'MEDIUM' ? 'بيانات متوسطة' : 'بيانات قديمة'}
            </Badge>
          </div>
        </div>

        {/* ── Main Grid: Score + Explain ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Primary Score Panel */}
          <Card variant="financial" padding="lg" className="md:col-span-1 flex flex-col items-center gap-3" ref={gaugeRef}>
            {sra ? (
              <>
                {/* SRA is primary engine */}
                <ScoreGauge score={sra.score} size={160} animated showBrand />
                <RadarScoreDisplay score={sra.score} size="lg" lang="ar" animate />

                {/* Grade badge */}
                <span
                  className="text-sm font-black px-3 py-1 rounded-full"
                  style={{
                    background: sra.grade === 'A+' ? 'rgba(34,197,94,0.15)' : sra.grade === 'A' ? 'rgba(59,130,246,0.15)' : 'rgba(234,179,8,0.15)',
                    color:      sra.grade === 'A+' ? 'var(--success)'        : sra.grade === 'A' ? '#3b82f6'               : 'var(--accent-gold)',
                    border:     sra.grade === 'A+' ? '1px solid rgba(34,197,94,0.3)' : sra.grade === 'A' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(234,179,8,0.3)',
                  }}
                >
                  إشارة {sra.grade}
                </span>

                {/* System label */}
                <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  نظام الاسترداد الذكي SRA
                </p>

                {/* Knowledge Base Stats */}
                <div
                  className="w-full rounded-lg p-2.5 space-y-1.5"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {sra.pro_required ? (
                    <div className="flex items-center gap-1.5">
                      <Lock size={11} style={{ color: 'var(--text-disabled)' }} />
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}>إحصاءات متاحة في PRO</p>
                    </div>
                  ) : sra.similar_cases && sra.similar_cases > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>حالات مشابهة</span>
                        <span className="font-bold num" style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>
                          {sra.similar_cases}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>نسبة النجاح</span>
                        <span className="font-bold num" style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>
                          {sra.win_rate}%
                        </span>
                      </div>
                      {sra.avg_return != null && sra.avg_return !== 0 && (
                        <div className="flex justify-between items-center">
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>متوسط العائد</span>
                          <span className="num" style={{ fontSize: 'var(--text-xs)', color: sra.avg_return > 0 ? 'var(--success)' : 'var(--error)' }}>
                            {sra.avg_return > 0 ? '+' : ''}{sra.avg_return}%
                          </span>
                        </div>
                      )}
                      {sra.best_case != null && sra.best_case !== 0 && (
                        <div className="flex justify-between items-center">
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>أفضل / أسوأ</span>
                          <span className="num" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            +{sra.best_case}% / {sra.worst_case}%
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>إشارة جديدة</p>
                      <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}>
                        البيانات التاريخية تتراكم
                      </p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Old radar is primary (no SRA signal) */}
                <ScoreGauge score={data.score} size={160} animated showBrand />
                <RadarScoreDisplay score={data.score} size="lg" lang="ar" animate />
                <SignalQualityBadge
                  quality={opp?.signal_quality ?? 'MEDIUM'}
                  lang="ar"
                />
              </>
            )}
          </Card>

          {/* Explain Panel */}
          <Card padding="lg" className="md:col-span-2 space-y-5" ref={explainRef}>
            {sra ? (
              <>
                {/* SRA explanation */}
                <CardHeader className="p-0">
                  <CardTitle>لماذا هذه الإشارة؟</CardTitle>
                </CardHeader>
                <div
                  className="px-3 py-2 rounded-lg text-xs leading-relaxed"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--text-secondary)' }}
                >
                  نظام SRA يبحث عن نقاط استسلام الضغط البيعي ودخول السيولة الذكية — ليس زخماً بل تحوّل.
                </div>
                <div className="space-y-2">
                  {sra.signals?.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    السوق: {sra.regime === 'bull' ? '🟢 صاعد' : sra.regime === 'bear' ? '🔴 هابط' : '🟡 عرضي'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded num" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    اتساع السوق: {sra.market_breadth?.toFixed(0)}%
                  </span>
                  {sra.rvol_spike && (
                    <span className="text-xs px-2 py-1 rounded num" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      RVOL: {sra.rvol_spike}×
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Old radar explanation */}
                <CardHeader className="p-0">
                  <CardTitle>لماذا هذه النتيجة؟</CardTitle>
                </CardHeader>
                <div
                  className="px-3 py-2 rounded-lg text-xs leading-relaxed"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--text-secondary)' }}
                >
                  نظام الزخم يقيس قوة الاتجاه الحالي للسهم عبر ADX و RSI و MACD والسيولة.
                </div>
                <ExplainWidget text={data.explain.ar} />
                <div className="space-y-2.5 pt-2">
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    تفصيل النتيجة
                  </p>
                  <BreakdownBar label="الاتجاه"   value={bd.trend}       max={20} color={scoreColor} />
                  <BreakdownBar label="الزخم"     value={bd.momentum}    max={18} color={scoreColor} />
                  <BreakdownBar label="السيولة"   value={bd.liquidity}   max={16} color={scoreColor} />
                  <BreakdownBar label="الحجم"     value={bd.volume}      max={14} color={scoreColor} />
                  <BreakdownBar label="القطاع"    value={bd.sector}      max={12} color={scoreColor} />
                  <BreakdownBar label="الأساسيات" value={bd.fundamental} max={15} color={scoreColor} />
                </div>
              </>
            )}
          </Card>
        </div>


        {/* ── Market Context ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Trend + Risk */}
          <Card padding="lg" className="space-y-4">
            <CardTitle>الاتجاه والمخاطر</CardTitle>
            <TrendStrengthBar strength={trendStrength} adx={ind.adx} lang="ar" />
            <div className="h-px" style={{ background: 'var(--border-subtle)' }} />
            <RiskMeter level={riskLevel} atrPct={ind.atr_pct} lang="ar" />
          </Card>

          {/* Key Indicators */}
          <Card padding="lg" className="space-y-3">
            <CardTitle>مؤشرات رئيسية</CardTitle>
            <MetricGrid
              cols={2}
              metrics={[
                { label: 'ADX (قوة الاتجاه)', value: ind.adx.toFixed(1) },
                { label: 'RSI (الزخم)',        value: ind.rsi.toFixed(1) },
                { label: 'RVOL (حجم نسبي)',    value: `${ind.rvol.toFixed(1)}×` },
                { label: 'ATR% (تقلب يومي)',   value: `${ind.atr_pct.toFixed(1)}%` },
              ]}
            />
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                background: ind.obv_trend === 'UP' ? 'var(--success-bg)' : ind.obv_trend === 'DOWN' ? 'var(--error-bg)' : 'var(--bg-elevated)',
                color: ind.obv_trend === 'UP' ? 'var(--success)' : ind.obv_trend === 'DOWN' ? 'var(--error)' : 'var(--text-muted)',
              }}
            >
              <span>{ind.obv_trend === 'UP' ? '📈' : ind.obv_trend === 'DOWN' ? '📉' : '➖'}</span>
              <span>OBV: {ind.obv_trend === 'UP' ? 'تراكم (صاعد)' : ind.obv_trend === 'DOWN' ? 'توزيع (هابط)' : 'محايد'}</span>
            </div>
          </Card>
        </div>

        {/* ── Momentum Opportunity ────────────────────────────────── */}
        {opp && (
          <section className="space-y-3">
            <div ref={oppRef}>
              <div className="flex items-center gap-2">
                <Star size={16} style={{ color: 'var(--accent-gold)' }} />
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>الفرصة المكتشفة</h2>
              </div>
              <OpportunityCard
                symbol={symbol}
                nameAr={data.name_ar}
                score={data.score}
                entry={opp.levels.entry}
                tp1={opp.levels.tp1}
                tp2={opp.levels.tp2}
                sl={opp.levels.sl}
                currentPrice={data.price ?? opp.levels.entry}
                changeAmt={data.change_amt ?? 0}
                changePct={data.change_pct ?? 0}
                holdDays={opp.levels.max_hold_days}
                signalQuality={opp.signal_quality}
                type={opp.type}
                lang="ar"
                reason={opp.reason?.ar}
                signalHistory={[]}
              />
            </div>
          </section>
        )}

        {/* ── SRA Opportunity (Primary Engine) ────────────────────── */}
        {sra && (
          <section className="space-y-3" ref={oppRef}>
            <div className="flex items-center gap-2">
              <Star size={16} style={{ color: 'var(--accent-gold)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>فرصة SRA المكتشفة</h2>
            </div>

            {sra.pro_required ? (
              /* ── PRO Lock Card ──────────────────────────────────── */
              <Card padding="lg" className="space-y-4">
                {/* Header: grade visible to free users */}
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-black px-3 py-1 rounded-full"
                    style={{
                      background: sra.grade === 'A+' ? 'rgba(34,197,94,0.15)' : sra.grade === 'A' ? 'rgba(59,130,246,0.15)' : 'rgba(234,179,8,0.15)',
                      color:      sra.grade === 'A+' ? 'var(--success)'        : sra.grade === 'A' ? '#3b82f6'               : 'var(--accent-gold)',
                      border:     sra.grade === 'A+' ? '1px solid rgba(34,197,94,0.3)' : sra.grade === 'A' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(234,179,8,0.3)',
                    }}
                  >
                    إشارة {sra.grade}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    نظام SRA اكتشف فرصة — التفاصيل للمشتركين
                  </span>
                </div>

                {/* Signals list (visible — free users can see signals) */}
                {sra.signals?.length > 0 && (
                  <div className="space-y-1.5">
                    {sra.signals.map((s: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Blurred price levels */}
                <div style={{ position: 'relative' }}>
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      background: 'var(--bg-elevated)',
                      filter: 'blur(5px)',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {[
                      { label: 'سعر الدخول',   value: '██.█ جنيه' },
                      { label: 'الهدف السريع', value: '██.█ جنيه (+٧%)' },
                      { label: 'الهدف المتوازن', value: '███.█ جنيه (+١٥%)' },
                      { label: 'وقف الخسارة',  value: '██.█ جنيه (-٥%)' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{label}</span>
                        <span className="font-bold num" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Lock overlay */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{ width: 44, height: 44, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.35)' }}
                    >
                      <Lock size={20} style={{ color: 'var(--accent-gold)' }} />
                    </div>
                    <p className="font-bold text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      مستويات الدخول والخروج متاحة في PRO
                    </p>
                    <Link
                      href="/payments"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-opacity hover:opacity-90"
                      style={{ background: 'var(--accent-gold)', color: '#000', fontSize: 'var(--text-sm)' }}
                    >
                      ترقية إلى PRO — 299 جنيه/شهر
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              /* ── Full Card for PRO users ────────────────────────── */
              <OpportunityCard
                symbol={symbol}
                nameAr={data.name_ar}
                score={sra.score ?? data.score}
                grade={sra.grade}
                entry={sra.entry}
                tp1={sra.exit_profiles?.FAST?.tp ?? sra.entry}
                tp2={sra.exit_profiles?.BALANCED?.tp ?? sra.entry}
                sl={sra.sl ?? sra.entry}
                currentPrice={data.price ?? sra.entry}
                changeAmt={data.change_amt ?? 0}
                changePct={data.change_pct ?? 0}
                holdDays={sra.exit_profiles?.BALANCED?.max_bars ?? 10}
                signalQuality={sra.grade === 'A+' ? 'HIGH' : sra.grade === 'A' ? 'MEDIUM' : 'LOW'}
                type={sra.type}
                profiles={sra.exit_profiles ?? undefined}
                signals={sra.signals}
                lang="ar"
                signalHistory={[]}
              />
            )}
          </section>
        )}

        {/* ── No opportunity message (only when SRA also absent) ── */}
        {!sra && !opp && (
          <Card padding="lg" className="text-center space-y-2">
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
              لا توجد فرصة نشطة حالياً لهذا السهم
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              البوت يبحث عن إشارات SRA يومياً بعد إغلاق السوق
            </p>
          </Card>
        )}

        {/* ── Disclaimer ──────────────────────────────────────────── */}
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
