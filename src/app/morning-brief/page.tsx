'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Minus, Target,
  BarChart3, Zap, Sun,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { MorningBrief } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardBody, ErrorState, WidgetSkeleton, MetricCard } from '@/design-system';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null, d = 2) {
  if (n == null) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function scoreColor(score: number) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

const REGIME_LABEL: Record<string, string> = {
  BULL:          'سوق صاعد',
  BEAR:          'سوق هابط',
  VOLATILE:      'تقلبات عالية',
  LOW_LIQUIDITY: 'سيولة منخفضة',
  SIDEWAYS:      'سوق متذبذب',
};

const REGIME_COLOR: Record<string, string> = {
  BULL:          '#22c55e',
  BEAR:          '#ef4444',
  VOLATILE:      '#a855f7',
  LOW_LIQUIDITY: '#6b7280',
  SIDEWAYS:      '#f59e0b',
};

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

// ── WGT-060: Regime banner ────────────────────────────────────────────────────

function RegimeBanner({ data }: { data: MorningBrief }) {
  const regime   = data.regime?.regime ?? 'SIDEWAYS';
  const color    = REGIME_COLOR[regime] ?? REGIME_COLOR.SIDEWAYS;
  const label    = REGIME_LABEL[regime]  ?? regime;
  const conf     = data.regime?.confidence ?? null;
  const reasonAr = data.regime?.reason?.ar ?? null;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, var(--bg-surface) 60%)`,
        border: `1px solid ${color}30`,
      }}
      data-widget-id="WGT-060"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Regime badge */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, border: `2px solid ${color}40` }}
        >
          <Sun size={28} style={{ color }} />
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {data.as_of ? `موجز يوم ${data.as_of}` : 'الموجز الصباحي'}
          </p>
          <h2 className="font-bold text-xl" style={{ color }}>
            {label}
          </h2>
          {reasonAr && (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {reasonAr}
            </p>
          )}
        </div>

        {/* Right-side metrics */}
        <div className="flex flex-wrap gap-4 shrink-0">
          {conf != null && (
            <div className="flex flex-col items-end">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ثقة</span>
              <span className="text-lg font-black num" style={{ color }}>
                {Math.round(conf)}%
              </span>
            </div>
          )}
          {data.egx30_close != null && (
            <div className="flex flex-col items-end">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>EGX30</span>
              <span className="text-lg font-black num" style={{ color: 'var(--text-primary)' }}>
                {fmt(data.egx30_close, 0)}
              </span>
              <ChangePill pct={data.egx30_change_pct} />
            </div>
          )}
        </div>
      </div>

      {/* Breadth bar */}
      {data.breadth && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${color}20` }}>
          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: 'var(--text-muted)' }}>السوق:</span>
            <span style={{ color: '#22c55e' }}>
              ▲ {data.breadth.advancing} صاعد
            </span>
            <span style={{ color: '#ef4444' }}>
              ▼ {data.breadth.declining} هابط
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              — {data.breadth.unchanged} ثابت
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WGT-061: Top stocks by Radar Score ───────────────────────────────────────

function TopScoresSection({ data }: { data: MorningBrief }) {
  return (
    <Card widgetId="WGT-061">
      <CardHeader>
        <CardTitle icon={<BarChart3 size={16} />}>
          أعلى درجات القوة اليوم
        </CardTitle>
      </CardHeader>
      <CardBody>
        {data.top_scores.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            لا توجد بيانات
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.top_scores.map((s) => {
              const color = scoreColor(s.score);
              return (
                <Link
                  key={s.symbol}
                  href={`/stocks/${s.symbol}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ border: '1px solid var(--border-subtle)' }}
                >
                  {/* Score circle */}
                  <div
                    className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <span className="text-sm font-black leading-none num" style={{ color }}>
                      {Math.round(s.score)}
                    </span>
                  </div>

                  {/* Stock info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold num" style={{ color: 'var(--accent-primary)' }}>
                        {s.symbol}
                      </span>
                      {s.is_sharia && (
                        <span
                          className="text-[9px] font-bold px-1 py-0.5 rounded"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                        >
                          شريعة
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {s.name_ar}
                    </p>
                  </div>

                  {/* Change */}
                  <ChangePill pct={s.last_change_pct} />
                </Link>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── WGT-062: New opportunities ────────────────────────────────────────────────

function NewOpportunitiesSection({ data }: { data: MorningBrief }) {
  return (
    <Card widgetId="WGT-062">
      <CardHeader>
        <CardTitle icon={<Target size={16} />}>
          فرص جديدة
          {data.opportunities_count > 0 && (
            <span
              className="mr-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}
            >
              {data.opportunities_count}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardBody>
        {data.new_opportunities.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            لا توجد فرص جديدة اليوم
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.new_opportunities.map((opp) => (
              <Link
                key={opp.symbol}
                href={`/stocks/${opp.symbol}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                {/* Type badge */}
                <div
                  className="px-2 py-1 rounded-lg text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  {opp.opp_type ?? 'فرصة'}
                </div>

                {/* Stock info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold num" style={{ color: 'var(--accent-primary)' }}>
                      {opp.symbol}
                    </span>
                    {opp.signal_quality === 'HIGH' && (
                      <Zap size={11} style={{ color: '#f59e0b' }} />
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    دخول {fmt(opp.entry_price)} — هدف {fmt(opp.tp1_price)} — وقف {fmt(opp.sl_price)}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span
                    className="text-sm font-black num"
                    style={{ color: scoreColor(opp.radar_score) }}
                  >
                    {Math.round(opp.radar_score)}
                  </span>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>قوة</p>
                </div>
              </Link>
            ))}

            <Link
              href="/"
              className="text-center text-xs mt-1 py-2"
              style={{ color: 'var(--accent-primary)' }}
            >
              عرض كل الفرص ←
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MorningBriefPage() {
  const [data,    setData]    = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [proLocked, setProLocked] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setProLocked(false);
    try {
      setData(await api.getMorningBrief());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setProLocked(true);
      } else {
        setError('تعذّر تحميل الموجز الصباحي');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
          الموجز الصباحي
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          ملخص السوق — النظام، أفضل الأسهم، والفرص الجديدة
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <WidgetSkeleton rows={3} />
          <WidgetSkeleton rows={5} />
          <WidgetSkeleton rows={4} />
        </div>
      ) : proLocked ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <span style={{ fontSize: 40 }}>🔒</span>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            الموجز الصباحي للمشتركين PRO فقط
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            احصل على ملخص يومي شامل — النظام، أفضل الأسهم، والفرص الجديدة
          </p>
          <a
            href="/payments"
            className="px-6 py-2 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-gold)', color: '#000' }}
          >
            ترقية إلى PRO
          </a>
        </div>
      ) : error ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : data ? (
        <>
          <RegimeBanner data={data} />

          {/* Summary metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              label="أسهم مصنّفة"
              value={String(data.scored_count)}
              sublabel="اليوم"
            />
            <MetricCard
              label="فرص نشطة"
              value={String(data.opportunities_count)}
              sublabel="إجمالي"
            />
            {data.breadth && (
              <MetricCard
                label="نسبة الصاعدين"
                value={`${Math.round(
                  (data.breadth.advancing /
                    Math.max(data.breadth.advancing + data.breadth.declining + data.breadth.unchanged, 1)) *
                    100
                )}%`}
                sublabel="من إجمالي الأسهم"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopScoresSection data={data} />
            <NewOpportunitiesSection data={data} />
          </div>
        </>
      ) : null}
    </main>
  );
}
