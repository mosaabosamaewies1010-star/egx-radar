'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw, Filter, TrendingUp, BarChart2,
  Eye, Briefcase, Bookmark, Crown, Zap,
} from 'lucide-react';
import { AppNav } from '@/components';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { computePositionSize } from '@/lib/positionSizing';
import type {
  MarketRegime, StageSignal, TrendSignal, VolumeRadarSignal,
} from '@/lib/types';
import {
  MarketRegimeBanner,
  Card, CardHeader, CardTitle, CardBody,
  Badge,
  WidgetSkeleton, EmptyState, ErrorState,
} from '@/design-system';
import { track } from '@/lib/analytics';
import { usePageView } from '@/lib/useAnalytics';

// ── Confidence badge ───────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#3b82f6' :
    score >= 40 ? '#f59e0b' :
                  '#f59e0b';

  const label =
    score >= 80 ? 'عالي جداً' :
    score >= 60 ? 'عالي' :
    score >= 40 ? 'متوسط' :
                  'مراقبة';

  const circumference = 2 * Math.PI * 10; // r=10
  const dashOffset    = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0 w-14">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
          <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border-subtle)" strokeWidth="2.5" />
          <circle
            cx="12" cy="12" r="10" fill="none"
            stroke={color} strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-black"
          style={{ fontSize: '9px', color }}
        >
          {score}
        </span>
      </div>
      <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

// ── Portfolio size input ───────────────────────────────────────────────────────

function PortfolioInput() {
  const { portfolioEgp, setPortfolioEgp } = useAppStore();
  const [draft, setDraft] = useState(portfolioEgp);

  const commit = (val: number) => {
    if (val >= 5_000) setPortfolioEgp(val);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl flex-wrap"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        💼 محفظتي
      </span>
      <input
        type="number"
        value={draft}
        min={5000}
        step={5000}
        onChange={(e) => setDraft(Number(e.target.value))}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => e.key === 'Enter' && commit(draft)}
        className="w-28 text-sm font-bold text-center outline-none rounded-lg px-2 py-1.5"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
        onBlurCapture={(e) => (e.target.style.borderColor = 'var(--border-default)')}
      />
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ج.م</span>
      <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-disabled)' }}>
        · حجم المركز محسوب تلقائياً في كل سطر
      </span>
    </div>
  );
}

// ── Sizing chip (shown inside each row) ───────────────────────────────────────

function SizingChip({
  oppType, confidence, regime, entry, sl, tp1,
}: {
  oppType: string; confidence: number; regime: string;
  entry: number | null; sl: number | null; tp1?: number | null;
}) {
  const portfolioEgp = useAppStore((s) => s.portfolioEgp);

  if (!entry || !sl) return null;

  const r = computePositionSize(oppType, confidence, regime, entry, sl, portfolioEgp, tp1);
  if (!r) return null;

  if (r.shares === 0) {
    return (
      <div className="text-xs" style={{ color: 'var(--text-disabled)' }}>
        {r.warning ?? '—'}
      </div>
    );
  }

  const kEgp = r.positionEgp >= 1000
    ? `${(r.positionEgp / 1000).toFixed(0)}k`
    : `${r.positionEgp}`;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
        {r.shares.toLocaleString()} سهم
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {kEgp} ج.م · خطر {r.riskEgp.toLocaleString()}
      </span>
      {r.warning && (
        <span className="text-[10px]" style={{ color: '#f59e0b' }}>⚠ {r.warning}</span>
      )}
    </div>
  );
}

// ── Regime mini-pill ──────────────────────────────────────────────────────────

const REGIME_META: Record<string, { label: string; color: string }> = {
  BULL:          { label: 'سوق صاعد',     color: '#22c55e' },
  SIDEWAYS:      { label: 'متذبذب',       color: '#94a3b8' },
  VOLATILE:      { label: 'متقلب',        color: '#a78bfa' },
  BEAR:          { label: 'سوق هابط',     color: '#ef4444' },
  LOW_LIQUIDITY: { label: 'سيولة ضعيفة', color: '#f59e0b' },
};

function RegimePill({ regime }: { regime: string }) {
  const meta = REGIME_META[regime] ?? REGIME_META.SIDEWAYS;
  return (
    <span
      className="text-[10px] px-1.5 py-px rounded font-medium"
      style={{ background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

// ── Explain drawer ─────────────────────────────────────────────────────────────

function ExplainDrawer({ bullets, accent }: { bullets: string[]; accent: string }) {
  const [open, setOpen] = useState(false);

  if (!bullets || bullets.length === 0) return null;

  return (
    <div style={{ borderTop: open ? '1px solid var(--border-subtle)' : undefined }}>
      <button
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="flex items-center gap-1 text-[11px] px-5 py-1.5 w-full transition-opacity hover:opacity-80"
        style={{ color: accent }}
      >
        <span>{open ? '▲' : '▼'}</span>
        <span>{open ? 'إخفاء التفاصيل' : 'لماذا هذه الإشارة؟'}</span>
      </button>

      {open && (
        <ul
          className="px-5 pb-3 space-y-1.5"
          onClick={(e) => e.preventDefault()}
        >
          {bullets.map((b, i) => (
            <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tier header ────────────────────────────────────────────────────────────────

function TierHeader({
  stars, title, subtitle, accent,
}: {
  stars: string; title: string; subtitle: string; accent: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{stars}</span>
        <span className="font-bold text-sm" style={{ color: accent }}>{title}</span>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>
        {subtitle}
      </span>
    </div>
  );
}

// ── Stage row ──────────────────────────────────────────────────────────────────

function StageRow({ item, rank }: { item: StageSignal; rank: number }) {
  const isStrong = item.opp_type === 'STAGE_STRONG';
  const accent   = isStrong ? '#a78bfa' : '#8b5cf6';
  const rr       = item.rr_ratio;
  const ageWks   = (item.vol_age_bars / 5).toFixed(1);
  const tp       = item.balanced_tp ?? item.fast_tp ?? item.tp1_price;
  const sl       = item.balanced_sl ?? item.fast_sl ?? item.sl_price;

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <Link
        href={`/stocks/${item.symbol}`}
        onClick={() => track('stage_clicked', { symbol: item.symbol, type: item.opp_type, rank })}
        className="flex items-center gap-3 px-5 py-4 transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        <ConfidenceBadge score={item.confidence ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{item.symbol}</span>
            {item.is_sharia && <Badge variant="success" className="text-xs">شريعة</Badge>}
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: isStrong ? 'rgba(167,139,250,0.2)' : 'rgba(139,92,246,0.15)', color: accent }}
            >
              {isStrong ? 'STRONG' : 'في التطور'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.name_ar}
            </span>
            <RegimePill regime={item.regime ?? 'SIDEWAYS'} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>حجم {ageWks}أسبوع</span>
          </div>
        </div>

        {rr != null && (
          <div className="text-end shrink-0 w-14">
            <div className="font-bold text-sm" style={{ color: 'var(--success)' }}>{rr.toFixed(1)}:1</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>R/R</div>
          </div>
        )}

        <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 w-24 text-xs">
          {item.entry_price && <span style={{ color: 'var(--text-secondary)' }}>دخول {item.entry_price.toFixed(2)}</span>}
          {tp               && <span style={{ color: 'var(--success)' }}>هدف {tp.toFixed(2)}</span>}
          {sl               && <span style={{ color: 'var(--error)' }}>وقف {sl.toFixed(2)}</span>}
        </div>

        <div className="hidden lg:flex items-center shrink-0 w-28 border-r pr-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <SizingChip
            oppType={item.opp_type}
            confidence={item.confidence ?? 0}
            regime={item.regime ?? 'SIDEWAYS'}
            entry={item.entry_price}
            sl={sl ?? item.sl_price}
            tp1={tp ?? item.tp1_price}
          />
        </div>
      </Link>
      <ExplainDrawer bullets={item.explain ?? []} accent={accent} />
    </div>
  );
}

// ── Trend row ──────────────────────────────────────────────────────────────────

function TrendRow({ item, rank }: { item: TrendSignal; rank: number }) {
  const isAPlus = item.grade === 'A+';
  const accent  = isAPlus ? '#22c55e' : '#3b82f6';
  const tp      = item.balanced_tp ?? item.fast_tp;
  const sl      = item.balanced_sl ?? item.fast_sl;

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <Link
        href={`/stocks/${item.symbol}`}
        onClick={() => track('trend_clicked', { symbol: item.symbol, grade: item.grade, rank })}
        className="flex items-center gap-3 px-5 py-4 transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        <ConfidenceBadge score={item.confidence ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{item.symbol}</span>
            {item.is_sharia && <Badge variant="success" className="text-xs">شريعة</Badge>}
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
            >
              {item.grade}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.name_ar}
            </span>
            <RegimePill regime={item.regime ?? 'SIDEWAYS'} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ADX {item.adx.toFixed(0)} · RSI {item.rsi.toFixed(0)}</span>
          </div>
        </div>

        {item.rr_ratio != null && (
          <div className="text-end shrink-0 w-14">
            <div className="font-bold text-sm" style={{ color: 'var(--success)' }}>{item.rr_ratio.toFixed(1)}:1</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>R/R</div>
          </div>
        )}

        <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 w-24 text-xs">
          {item.entry_price && <span style={{ color: 'var(--text-secondary)' }}>دخول {item.entry_price.toFixed(2)}</span>}
          {tp               && <span style={{ color: 'var(--success)' }}>هدف {tp.toFixed(2)}</span>}
          {sl               && <span style={{ color: 'var(--error)' }}>وقف {sl.toFixed(2)}</span>}
        </div>

        <div className="hidden lg:flex items-center shrink-0 w-28 border-r pr-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <SizingChip
            oppType={item.opp_type}
            confidence={item.confidence ?? 0}
            regime={item.regime ?? 'SIDEWAYS'}
            entry={item.entry_price}
            sl={sl ?? null}
            tp1={tp ?? null}
          />
        </div>
      </Link>
      <ExplainDrawer bullets={item.explain ?? []} accent={accent} />
    </div>
  );
}

// ── Volume Radar row ───────────────────────────────────────────────────────────

function VolRadarRow({ item, rank }: { item: VolumeRadarSignal; rank: number }) {
  const accent  = '#f59e0b';
  const ageWks  = (item.vol_age_bars / 5).toFixed(1);

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <Link
        href={`/stocks/${item.symbol}`}
        onClick={() => track('vol_radar_clicked', { symbol: item.symbol, rvol: item.vol_rvol, rank })}
        className="flex items-center gap-3 px-5 py-4 transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        <ConfidenceBadge score={item.confidence ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{item.symbol}</span>
            {item.is_sharia && <Badge variant="success" className="text-xs">شريعة</Badge>}
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(245,158,11,0.15)', color: accent }}
            >
              👁️ راقب
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.name_ar}
            </span>
            <RegimePill regime={item.regime ?? 'SIDEWAYS'} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>RVOL {item.vol_rvol.toFixed(1)}x · EMA {item.ema_gap_pct.toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-end shrink-0 w-16">
          <div className="font-bold text-sm" style={{ color: accent }}>{item.vol_rvol.toFixed(1)}x</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ageWks} أسبوع</div>
        </div>
      </Link>
      <ExplainDrawer bullets={item.explain ?? []} accent={accent} />
    </div>
  );
}

// ── Controls ───────────────────────────────────────────────────────────────────

function Controls({
  shariaFilter, onShariaToggle, refreshing, onRefresh,
}: {
  shariaFilter: boolean;
  onShariaToggle: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onShariaToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
        style={{
          background: shariaFilter ? 'var(--success-bg)' : 'var(--bg-elevated)',
          color:      shariaFilter ? 'var(--success)'    : 'var(--text-muted)',
          border: `1px solid ${shariaFilter ? 'var(--success)' : 'var(--border-default)'}`,
        }}
      >
        <Filter size={11} />
        شريعة
      </button>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="p-1.5 rounded-lg transition-colors"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
      >
        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}

// ── Quick Actions ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: '/discover',  icon: BarChart2, label: 'اكتشف',   accent: 'var(--accent-primary)' },
  { href: '/stage',     icon: Zap,       label: 'مراحل',   accent: '#a78bfa' },
  { href: '/portfolio', icon: Briefcase, label: 'محفظتي',  accent: '#22c55e' },
  { href: '/watchlist', icon: Bookmark,  label: 'متابعة',  accent: '#06b6d4' },
  { href: '/payments',  icon: Crown,     label: 'PRO ⭐',   accent: '#f59e0b' },
] as const;

function QuickActions({ isProUser }: { isProUser: boolean }) {
  const actions = isProUser
    ? QUICK_ACTIONS.filter((a) => a.href !== '/payments')
    : QUICK_ACTIONS;

  return (
    <div className="grid gap-3 md:hidden" style={{ gridTemplateColumns: `repeat(${actions.length}, 1fr)` }}>
      {actions.map(({ href, icon: Icon, label, accent }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}
          >
            <Icon size={18} style={{ color: accent }} />
          </div>
          <span className="text-xs font-medium text-center" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Homepage ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { setRegime, shariaFilter, setShariaFilter, user } = useAppStore();
  usePageView();

  const [regimeData,   setRegimeData]   = useState<MarketRegime | null>(null);
  const [stageItems,   setStageItems]   = useState<StageSignal[]>([]);
  const [trendItems,   setTrendItems]   = useState<TrendSignal[]>([]);
  const [volItems,     setVolItems]     = useState<VolumeRadarSignal[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = useCallback(async (sharia = shariaFilter) => {
    try {
      setError(null);
      const [regData, stageData, trendData, volData] = await Promise.all([
        api.getRegime(),
        api.getStageBreakouts({ sharia, limit: 20 }),
        api.getTrendSignals({ sharia, limit: 20 }),
        api.getVolumeRadar({ sharia, limit: 20 }),
      ]);
      setRegimeData(regData);
      setRegime(regData);
      setStageItems(stageData.items);
      setTrendItems(trendData.items);
      setVolItems(volData.items);
      track('homepage_loaded', {
        regime: regData.regime,
        stage: stageData.total,
        trend: trendData.total,
        vol: volData.total,
      });
    } catch {
      setError('تعذّر الاتصال بالخادم. تأكد من تشغيل API على المنفذ 5001.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shariaFilter, setRegime]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => { setRefreshing(true); load(); };

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

        {/* Quick actions — mobile only */}
        <QuickActions isProUser={!!user?.is_pro} />

        {/* Market regime banner */}
        {loading && !regimeData ? (
          <div className="h-20 rounded-2xl shimmer" style={{ background: 'var(--bg-surface)' }} />
        ) : regimeData ? (
          <MarketRegimeBanner
            regime={regimeData.regime}
            confidence={regimeData.confidence}
            reason={regimeData.reason?.ar}
            lastUpdated={regimeData.run_date
              ? `آخر تحديث ${new Date(regimeData.run_date).toLocaleDateString('ar-EG')}`
              : undefined}
            lang="ar"
          />
        ) : null}

        {/* Controls strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
            <span className="font-bold text-sm">الفرص اليومية</span>
          </div>
          <Controls
            shariaFilter={shariaFilter}
            onShariaToggle={handleShariaToggle}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Portfolio size input */}
        <PortfolioInput />

        {error ? (
          <Card padding="md">
            <ErrorState scenario="network" lang="ar" onRetry={handleRefresh} />
          </Card>
        ) : loading ? (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <WidgetSkeleton rows={3} />
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <WidgetSkeleton rows={3} />
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <WidgetSkeleton rows={3} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── Tier 1: Stage Breakout ⭐⭐⭐⭐⭐ ── */}
            <Card padding="none">
              <TierHeader
                stars="⭐⭐⭐⭐⭐"
                title="Stage Breakout"
                subtitle="PF 2.08 · أعلى أولوية"
                accent="#a78bfa"
              />
              <CardBody className="p-0">
                {stageItems.length === 0 ? (
                  <div className="px-5 pb-5">
                    <EmptyState scenario="no-opportunities" lang="ar" />
                  </div>
                ) : (
                  stageItems.map((item, idx) => (
                    <StageRow key={item.id} item={item} rank={idx + 1} />
                  ))
                )}
              </CardBody>
            </Card>

            {/* ── Tier 2: Trend Initiation ⭐⭐⭐⭐ ── */}
            <Card padding="none">
              <TierHeader
                stars="⭐⭐⭐⭐"
                title="Trend Initiation"
                subtitle="PF 1.64 · A+ و A فقط"
                accent="#22c55e"
              />
              <CardBody className="p-0">
                {trendItems.length === 0 ? (
                  <div className="px-5 pb-5">
                    <EmptyState scenario="no-opportunities" lang="ar" />
                  </div>
                ) : (
                  trendItems.map((item, idx) => (
                    <TrendRow key={item.id} item={item} rank={idx + 1} />
                  ))
                )}
              </CardBody>
            </Card>

            {/* ── Tier 3: Volume Radar ⭐⭐⭐ ── */}
            <Card padding="none">
              <TierHeader
                stars="⭐⭐⭐"
                title="Volume Radar"
                subtitle="راقب فقط — لا توصية شراء"
                accent="#f59e0b"
              />
              <CardBody className="p-0">
                {volItems.length === 0 ? (
                  <div className="px-5 pb-5">
                    <EmptyState scenario="no-opportunities" lang="ar" />
                  </div>
                ) : (
                  volItems.map((item, idx) => (
                    <VolRadarRow key={item.id} item={item} rank={idx + 1} />
                  ))
                )}
              </CardBody>
            </Card>

          </div>
        )}

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
