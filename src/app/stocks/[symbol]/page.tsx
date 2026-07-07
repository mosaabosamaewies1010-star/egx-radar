'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, ExternalLink, Star } from 'lucide-react';
import { AppNav } from '@/components';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import { usePageView, useWidgetView } from '@/lib/useAnalytics';
import { useAppStore } from '@/lib/store';
import type { StockData } from '@/lib/types';
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
  const ind = data.indicators;
  const bd  = data.breakdown;
  const opp = data.opportunity;

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

          {/* Radar Score Widget */}
          <Card variant="financial" padding="lg" className="md:col-span-1 flex flex-col items-center gap-4" ref={gaugeRef}>
            <ScoreGauge score={data.score} size={160} animated showBrand />
            <RadarScoreDisplay score={data.score} size="lg" lang="ar" animate />
            <SignalQualityBadge
              quality={opp?.signal_quality ?? 'MEDIUM'}
              score={data.score}
              lang="ar"
            />
          </Card>

          {/* Explain + Breakdown */}
          <Card padding="lg" className="md:col-span-2 space-y-5" ref={explainRef}>
            <CardHeader className="p-0">
              <CardTitle>لماذا هذه النتيجة؟</CardTitle>
            </CardHeader>

            <ExplainWidget text={data.explain.ar} />

            {/* Score Breakdown */}
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

        {/* ── Opportunity ─────────────────────────────────────────── */}
        {opp ? (
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
        ) : (
          <Card padding="lg" className="text-center space-y-2">
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
              لا توجد فرصة نشطة حالياً لهذا السهم
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              الحد الأدنى لنتيجة الرادار لتوليد فرصة هو 60 نقطة
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
