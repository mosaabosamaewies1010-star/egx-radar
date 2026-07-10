'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity, TrendingUp, BookOpen, Cpu, AlertCircle, CheckCircle } from 'lucide-react';
import { AppNav } from '@/components';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminHealth {
  as_of: string;
  signals: {
    today:    number;
    sra_open: number;
    all_open: number;
    sra_7d:   number;
    sra_30d:  number;
  };
  performance: {
    total_closed: number;
    wins:         number;
    losses:       number;
    win_rate:     number | null;
  };
  sra: {
    avg_score:  number | null;
    grade_dist: { 'A+': number; A: number; B: number };
  };
  knowledge_base: {
    size:        number;
    growth_7d:   number;
    growth_30d:  number;
  };
  scanner: {
    scored_today: number;
    scan_days_7d: number;
  };
  regime: {
    regime:     string;
    confidence: number;
    run_date:   string;
  } | null;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, d = 1): string {
  if (n == null) return '—';
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function kbConfidence(size: number): { label: string; color: string } {
  if (size >= 100) return { label: 'عالية جداً',  color: '#22c55e' };
  if (size >= 30)  return { label: 'عالية',       color: '#22c55e' };
  if (size >= 10)  return { label: 'متوسطة',      color: '#f59e0b' };
  return               { label: 'منخفضة',         color: '#ef4444' };
}

function regimeAr(r: string): string {
  if (r === 'BULL')          return 'صاعد 🟢';
  if (r === 'BEAR')          return 'هابط 🔴';
  if (r === 'SIDEWAYS')      return 'عرضي 🟡';
  if (r === 'VOLATILE')      return 'متقلب 🟠';
  if (r === 'LOW_LIQUIDITY') return 'سيولة منخفضة 🔵';
  return r;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon,
}: {
  label:  string;
  value:  string | number;
  sub?:   string;
  color?: string;
  icon?:  React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 space-y-1.5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: 'var(--text-xs)' }}>{label}</span>
      </div>
      <div
        className="font-black num"
        style={{ fontSize: 'var(--text-3xl)', color: color ?? 'var(--text-primary)' }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{sub}</div>
      )}
    </div>
  );
}

// ── Grade bar ─────────────────────────────────────────────────────────────────

function GradeBar({ dist }: { dist: { 'A+': number; A: number; B: number } }) {
  const total = dist['A+'] + dist.A + dist.B || 1;
  const items = [
    { label: 'A+', count: dist['A+'], color: '#22c55e' },
    { label: 'A',  count: dist.A,     color: '#3b82f6' },
    { label: 'B',  count: dist.B,     color: '#f59e0b' },
  ];
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        توزيع الـ Grades (مفتوحة)
      </span>
      {items.map(({ label, count, color }) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={label} className="space-y-1">
            <div className="flex justify-between items-center">
              <span
                className="text-xs font-black px-1.5 py-0.5 rounded num"
                style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
              >
                {label}
              </span>
              <span className="text-xs num" style={{ color: 'var(--text-secondary)' }}>
                {count} إشارة ({pct}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [data,    setData]    = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'}/api/admin/health`,
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AdminHealth = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (e) {
      setError('تعذّر الاتصال بالـ API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const conf = data ? kbConfidence(data.knowledge_base.size) : null;

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      <main className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
              <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)' }}>
                لوحة المراقبة الداخلية
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                ADMIN
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              EGX Radar v1.0 Beta — {lastUpdate ? `آخر تحديث ${lastUpdate.toLocaleTimeString('ar-EG')}` : 'جارٍ التحميل...'}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>

        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <AlertCircle size={16} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: '#ef4444' }}>{error}</span>
          </div>
        )}

        {data && (
          <>
            {/* ── Section 1: Signals ──────────────────────────────────── */}
            <section className="space-y-3">
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                الإشارات والصفقات
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="إشارات اليوم"
                  value={data.signals.today}
                  color="var(--accent-primary)"
                  icon={<Cpu size={13} />}
                />
                <StatCard
                  label="SRA مفتوحة"
                  value={data.signals.sra_open}
                  sub={`إجمالي مفتوحة: ${data.signals.all_open}`}
                  color="#22c55e"
                  icon={<TrendingUp size={13} />}
                />
                <StatCard
                  label="SRA آخر 7 أيام"
                  value={data.signals.sra_7d}
                  icon={<Activity size={13} />}
                />
                <StatCard
                  label="SRA آخر 30 يوم"
                  value={data.signals.sra_30d}
                  icon={<Activity size={13} />}
                />
              </div>
            </section>

            {/* ── Section 2: Performance ──────────────────────────────── */}
            <section className="space-y-3">
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                الأداء التراكمي
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Win Rate"
                  value={data.performance.win_rate != null ? `${fmt(data.performance.win_rate, 1)}%` : '—'}
                  sub={`${data.performance.total_closed} صفقة مغلقة`}
                  color={
                    data.performance.win_rate == null ? undefined :
                    data.performance.win_rate >= 60 ? '#22c55e' :
                    data.performance.win_rate >= 45 ? '#f59e0b' : '#ef4444'
                  }
                />
                <StatCard
                  label="صفقات رابحة"
                  value={data.performance.wins}
                  color="#22c55e"
                />
                <StatCard
                  label="صفقات خاسرة"
                  value={data.performance.losses}
                  color="#ef4444"
                />
                <StatCard
                  label="متوسط SRA Score"
                  value={data.sra.avg_score != null ? fmt(data.sra.avg_score, 1) : '—'}
                  sub="للإشارات المفتوحة"
                />
              </div>
            </section>

            {/* ── Section 3: Grade Dist + SRA ─────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GradeBar dist={data.sra.grade_dist} />

              {/* KB Stats */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Knowledge Base
                  </span>
                  {conf && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-auto"
                      style={{ color: conf.color, background: `${conf.color}18`, border: `1px solid ${conf.color}30` }}
                    >
                      ثقة {conf.label}
                    </span>
                  )}
                </div>
                <div
                  className="font-black num"
                  style={{ fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}
                >
                  {data.knowledge_base.size}
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 400, color: 'var(--text-muted)', marginRight: 8 }}>
                    حالة مرجعية
                  </span>
                </div>
                <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>نمو 7 أيام</span>
                    <span className="num font-bold" style={{ fontSize: 'var(--text-xs)', color: data.knowledge_base.growth_7d > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                      +{data.knowledge_base.growth_7d} حالة
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>نمو 30 يوم</span>
                    <span className="num font-bold" style={{ fontSize: 'var(--text-xs)', color: data.knowledge_base.growth_30d > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                      +{data.knowledge_base.growth_30d} حالة
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Section 4: Scanner + Regime ─────────────────────────── */}
            <section className="space-y-3">
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                المسح اليومي والسوق
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard
                  label="أسهم مصنّفة اليوم"
                  value={data.scanner.scored_today}
                  sub={`أيام مسح هذا الأسبوع: ${data.scanner.scan_days_7d}`}
                  color={data.scanner.scored_today > 0 ? '#22c55e' : '#ef4444'}
                  icon={data.scanner.scored_today > 0 ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                />
                <div
                  className="rounded-xl p-4 space-y-2 md:col-span-2"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    وضع السوق الحالي
                  </span>
                  {data.regime ? (
                    <>
                      <div
                        className="font-bold"
                        style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}
                      >
                        {regimeAr(data.regime.regime)}
                      </div>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          ثقة: <span className="num font-bold" style={{ color: 'var(--text-secondary)' }}>
                            {fmt(data.regime.confidence * 100, 0)}%
                          </span>
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          آخر تحديث: <span style={{ color: 'var(--text-secondary)' }}>
                            {data.regime.run_date}
                          </span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      لا توجد بيانات — شغّل daily_scan.py أولاً
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Checklist ───────────────────────────────────────────── */}
            <section
              className="rounded-xl p-5 space-y-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                EGX Radar v1.0 Beta — حالة الإطلاق
              </h2>
              {[
                { label: 'SRA Engine',       ok: true },
                { label: 'Knowledge Base',   ok: data.knowledge_base.size > 0 },
                { label: 'Similarity Engine',ok: data.knowledge_base.size >= 5 },
                { label: 'Self-Learning',    ok: data.knowledge_base.growth_7d > 0 || data.knowledge_base.size > 0 },
                { label: 'Morning Brief',    ok: true },
                { label: 'Discover',         ok: true },
                { label: 'PRO Gating',       ok: true },
                { label: 'Watchlist',        ok: true },
                { label: 'Monitoring',       ok: true },
                { label: 'Scanner يعمل',     ok: data.scanner.scored_today > 0 },
                { label: 'Regime محسوب',     ok: data.regime != null },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-3">
                  {ok
                    ? <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                    : <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 'var(--text-sm)', color: ok ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                  {!ok && (
                    <span style={{ fontSize: 'var(--text-xs)', color: '#f59e0b', marginRight: 'auto' }}>
                      يحتاج بيانات حقيقية
                    </span>
                  )}
                </div>
              ))}
            </section>
          </>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-3 text-center">
              <RefreshCw size={32} className="animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>جارٍ تحميل بيانات المراقبة...</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
