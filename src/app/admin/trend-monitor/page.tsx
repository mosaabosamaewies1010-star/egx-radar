'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Rocket, ShieldAlert, BarChart3, Calendar, FlaskConical,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, ArrowRight,
} from 'lucide-react';
import { AppNav } from '@/components';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sig {
  symbol: string | null; opp_type: string; grade: string;
  score: number | null; quality: string | null;
  entry: number | null; sl: number | null; tp1: number | null; tp2: number | null;
  rr: number | null; outcome: string;
  adx: number | null; rsi: number | null; ema_fast: number | null; ema_slow: number | null;
  atr: number | null; adt: number | null; reasons: string[];
}
interface PoolItem { symbol: string; score: number | null; adx: number | null; rsi: number | null; }
interface DailyStats {
  trend: number; sra: number; radar: number;
  overlap_trend_sra: number; trend_only: number; sra_only: number; radar_only: number;
}
interface DayRow { date: string; trend: number; sra: number; radar: number; overlap: number; }
interface Outcome {
  pending: number; closed: number; wins: number; losses: number;
  win_rate: number | null; avg_return: number | null; pf: number | null;
  avg_hold_days: number | null; max_dd: number | null;
}
interface Validation {
  expected: Record<string, number>;
  actual: { signals_per_day: number | null; win_rate: number | null; pf: number | null; avg_return: number | null };
  sample_closed: number; status: 'collecting' | 'drift' | 'match'; drift_fields: string[];
}
interface GateItem { criterion: string; status: 'pass' | 'wait' | 'fail'; detail?: string; }
interface ResearchStatus {
  current_engine: string; trend_version: string; research_version: string;
  last_scan: string | null; last_outcome_update: string | null; stocks_analyzed: number | null;
}
interface Overlap { trend_only: string[]; both: string[]; sra_only: string[]; }
interface ScanLog {
  run_date: string | null; status: string; stocks_scanned: number | null;
  trend: number; sra: number | null; momentum: number | null;
  started_at: string | null; finished_at: string | null; duration_seconds: number | null;
}
interface MonitorData {
  as_of: string; date: string; is_replay: boolean;
  research_status: ResearchStatus; research_gate: GateItem[];
  today: { trend: Sig[]; sra: Sig[]; radar_pool: PoolItem[] };
  daily_stats: DailyStats; overlap: Overlap; last_30_days: DayRow[];
  outcomes: { trend: Outcome; sra: Outcome };
  validation: Validation; scan_logs: ScanLog[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
function fmt(n: number | null | undefined, d = 1): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
const CARD = { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' } as const;
const MUTED = { color: 'var(--text-muted)' } as const;
const BLUE = '#3b82f6', AMBER = '#f59e0b', GREEN = '#22c55e', RED = '#ef4444';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </h2>
  );
}
function Stat({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-4 space-y-1.5" style={CARD}>
      <div style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{label}</div>
      <div className="font-black num" style={{ fontSize: 'var(--text-2xl)', color: color ?? 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{sub}</div>}
    </div>
  );
}

// ── Research Gate card ────────────────────────────────────────────────────────
function GateCard({ gate }: { gate: GateItem[] }) {
  const ready = gate[gate.length - 1]?.status === 'pass';
  const ic = (s: string) => s === 'pass'
    ? <CheckCircle size={16} style={{ color: GREEN, flexShrink: 0 }} />
    : s === 'fail'
      ? <AlertCircle size={16} style={{ color: RED, flexShrink: 0 }} />
      : <Clock size={16} style={{ color: AMBER, flexShrink: 0 }} />;
  return (
    <div className="rounded-xl p-5 space-y-3" style={{ background: ready ? `${GREEN}0f` : 'var(--bg-surface)', border: `1px solid ${ready ? GREEN + '40' : 'var(--border-subtle)'}` }}>
      <div className="flex items-center gap-2">
        <FlaskConical size={18} style={{ color: 'var(--accent-primary)' }} />
        <h2 className="font-bold" style={{ fontSize: 'var(--text-lg)' }}>Research Gate — شروط التحويل لـ Trend-first</h2>
      </div>
      <div className="space-y-1.5">
        {gate.map((g, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            {ic(g.status)}
            <span style={{ fontSize: 'var(--text-sm)', color: g.status === 'pass' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{g.criterion}</span>
            {g.detail && <span className="num" style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{g.detail}</span>}
            <span className="mr-auto text-[11px] font-bold" style={{ color: g.status === 'pass' ? GREEN : g.status === 'fail' ? RED : AMBER }}>
              {g.status === 'pass' ? '✅' : g.status === 'fail' ? '❌' : '⏳'}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', ...MUTED }}>
        القرار مبني على معايير واضحة — مش انطباعات. لا يتحوّل Trend لمحرك أساسي إلا لما كل الشروط تبقى ✅.
      </p>
    </div>
  );
}

// ── Compare card (Trend vs SRA, with difference) ──────────────────────────────
function CompareCard({ label, t, s, unit = '', better = 'high', digits = 2 }: {
  label: string; t: number | null; s: number | null; unit?: string; better?: 'high' | 'low'; digits?: number;
}) {
  const diff = (t != null && s != null) ? t - s : null;
  const good = diff == null ? null : (better === 'high' ? diff > 0 : diff < 0);
  return (
    <div className="rounded-xl p-4 space-y-2" style={CARD}>
      <div style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-center">
          <div className="num font-black" style={{ fontSize: 'var(--text-xl)', color: BLUE }}>{t == null ? '—' : fmt(t, digits)}{unit}</div>
          <div style={{ fontSize: '10px', ...MUTED }}>Trend</div>
        </div>
        <ArrowRight size={14} style={MUTED} />
        <div className="text-center">
          <div className="num font-black" style={{ fontSize: 'var(--text-xl)', color: AMBER }}>{s == null ? '—' : fmt(s, digits)}{unit}</div>
          <div style={{ fontSize: '10px', ...MUTED }}>SRA</div>
        </div>
      </div>
      {diff != null && (
        <div className="text-center num" style={{ fontSize: 'var(--text-xs)', color: good ? GREEN : good === false ? RED : 'var(--text-muted)' }}>
          الفرق: {diff > 0 ? '+' : ''}{fmt(diff, digits)}{unit}
        </div>
      )}
    </div>
  );
}

// ── Signal card (expandable) ──────────────────────────────────────────────────
function SignalCard({ s }: { s: Sig }) {
  const [open, setOpen] = useState(false);
  const oc = s.outcome === 'WIN' ? GREEN : s.outcome === 'LOSS' ? RED : s.outcome === 'EXPIRED' ? 'var(--text-muted)' : BLUE;
  return (
    <div className="rounded-lg overflow-hidden" style={CARD}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 p-3 text-right hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-2">
          <span className="font-black num" style={{ fontSize: 'var(--text-base)' }}>{s.symbol}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded num" style={{ color: BLUE, background: `${BLUE}18`, border: `1px solid ${BLUE}30` }}>{s.grade}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: oc, background: `${oc}18` }}>{s.outcome}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs num" style={MUTED}>دخول {fmt(s.entry, 2)}</span>
          {open ? <ChevronUp size={14} style={MUTED} /> : <ChevronDown size={14} style={MUTED} />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            {[
              ['ADX', fmt(s.adx, 0)], ['RSI', fmt(s.rsi, 0)], ['ATR', fmt(s.atr, 2)],
              ['EMA20', fmt(s.ema_fast, 2)], ['EMA50', fmt(s.ema_slow, 2)], ['R/R', s.rr != null ? `${fmt(s.rr, 2)}x` : '—'],
              ['Stop', fmt(s.sl, 2)], ['هدف 1', fmt(s.tp1, 2)], ['هدف 2', fmt(s.tp2, 2)],
              ['السيولة', s.adt != null ? `${fmt(s.adt / 1e6, 1)}M` : '—'], ['Score', fmt(s.score, 0)], ['الجودة', s.quality ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded p-1.5" style={{ background: 'var(--bg-elevated)' }}>
                <div style={{ fontSize: '10px', ...MUTED }}>{k}</div>
                <div className="num font-bold" style={{ fontSize: 'var(--text-xs)' }}>{v}</div>
              </div>
            ))}
          </div>
          {s.reasons?.length > 0 && (
            <ul className="space-y-1 pt-1">
              {s.reasons.map((r, i) => <li key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{r}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Performance table (Trend vs SRA) ──────────────────────────────────────────
function PerfTable({ t, s }: { t: Outcome; s: Outcome }) {
  const rows: [string, keyof Outcome, (v: any) => string][] = [
    ['قيد الانتظار', 'pending', v => `${v}`],
    ['مغلقة', 'closed', v => `${v}`],
    ['رابحة', 'wins', v => `${v}`],
    ['خاسرة', 'losses', v => `${v}`],
    ['نسبة الفوز', 'win_rate', v => v == null ? '—' : `${fmt(v, 1)}%`],
    ['متوسط العائد', 'avg_return', v => v == null ? '—' : `${fmt(v, 2)}%`],
    ['PF', 'pf', v => v == null ? '—' : fmt(v, 2)],
    ['Max DD', 'max_dd', v => v == null ? '—' : `${fmt(v, 1)}`],
    ['متوسط أيام الاحتفاظ', 'avg_hold_days', v => v == null ? '—' : fmt(v, 1)],
  ];
  return (
    <div className="rounded-xl overflow-hidden" style={CARD}>
      <div className="grid grid-cols-3 gap-2 p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 'var(--text-xs)', ...MUTED }}>المقياس</span>
        <span className="text-center font-bold" style={{ fontSize: 'var(--text-xs)', color: BLUE }}>🚀 Trend</span>
        <span className="text-center font-bold" style={{ fontSize: 'var(--text-xs)', color: AMBER }}>⚠ SRA</span>
      </div>
      {rows.map(([label, key, f]) => (
        <div key={key} className="grid grid-cols-3 gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
          <span className="text-center num font-bold" style={{ fontSize: 'var(--text-xs)' }}>{f(t[key])}</span>
          <span className="text-center num font-bold" style={{ fontSize: 'var(--text-xs)' }}>{f(s[key])}</span>
        </div>
      ))}
    </div>
  );
}

// ── Overlap columns ───────────────────────────────────────────────────────────
function Chips({ syms, color }: { syms: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {syms.length === 0
        ? <span style={{ fontSize: 'var(--text-xs)', ...MUTED }}>—</span>
        : syms.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded num" style={{ background: `${color}14`, color }}>{s}</span>)}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrendMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replayDate, setReplayDate] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = replayDate ? `?date=${replayDate}` : '';
      const res = await fetch(`${API}/api/admin/trend-monitor${qs}`, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch {
      setError('تعذّر الاتصال بالـ API — تأكد إن الـ backend شغّال ومنشور');
    } finally { setLoading(false); }
  }, [replayDate]);

  useEffect(() => { load(); }, [load]);

  const v = data?.validation;
  const vColor = v?.status === 'match' ? GREEN : v?.status === 'drift' ? RED : BLUE;
  const vLabel = v?.status === 'match' ? '✅ Research Matches Production'
    : v?.status === 'drift' ? '⚠ Drift Detected — كود البحث ≠ كود الإنتاج'
    : '⏳ Collecting Data (نحتاج نتائج مغلقة أكثر)';
  const rs = data?.research_status;
  const to = data?.outcomes.trend, so = data?.outcomes.sra;

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={20} style={{ color: 'var(--accent-primary)' }} />
              <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)' }}>Research Dashboard — مختبر حي</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: RED, border: '1px solid rgba(239,68,68,0.3)' }}>ADMIN</span>
              {data?.is_replay && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(59,130,246,0.15)', color: BLUE }}>REPLAY</span>}
            </div>
            <p style={{ fontSize: 'var(--text-sm)', ...MUTED }}>Trend مقابل SRA على بيانات الإنتاج · اليوم: {data?.date ?? '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <Calendar size={14} style={MUTED} />
              <input type="date" value={replayDate} onChange={e => setReplayDate(e.target.value)} className="bg-transparent text-xs outline-none num" style={{ color: 'var(--text-secondary)' }} />
              {replayDate && <button onClick={() => setReplayDate('')} className="text-xs px-1" style={MUTED} title="رجوع لليوم">✕</button>}
            </div>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:opacity-80" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', ...MUTED }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> تحديث
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={16} style={{ color: RED }} />
            <span style={{ fontSize: 'var(--text-sm)', color: RED }}>{error}</span>
          </div>
        )}

        {data && (
          <>
            {/* 1) Research Gate */}
            <GateCard gate={data.research_gate} />

            {/* 2) Drift Detector */}
            <section className="space-y-3">
              <H2>Drift Detector — البحث مقابل الإنتاج</H2>
              <div className="rounded-xl p-4 space-y-4" style={{ background: `${vColor}0f`, border: `1px solid ${vColor}40` }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: 'var(--text-lg)', color: vColor }}>{vLabel}</span>
                  <span className="text-xs mr-auto num" style={MUTED}>عيّنة مغلقة: {v?.sample_closed ?? 0}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['إشارات/يوم', v?.actual.signals_per_day, `متوقع ${v?.expected.signals_per_day_min}–${v?.expected.signals_per_day_max}`, 'signals_per_day'],
                    ['نسبة الفوز', v?.actual.win_rate, `متوقع ~${v?.expected.win_rate}%`, 'win_rate'],
                    ['PF', v?.actual.pf, `متوقع ~${v?.expected.pf}`, 'pf'],
                    ['متوسط العائد', v?.actual.avg_return, `متوقع ~${v?.expected.avg_return}%`, 'avg_return'],
                  ].map(([label, actual, exp, key]) => {
                    const drifted = v?.drift_fields.includes(key as string);
                    return (
                      <div key={label as string} className="rounded-lg p-3" style={CARD}>
                        <div style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{label as string}</div>
                        <div className="num font-black" style={{ fontSize: 'var(--text-xl)', color: drifted ? RED : 'var(--text-primary)' }}>
                          {actual == null ? '—' : fmt(actual as number, key === 'pf' ? 2 : key === 'signals_per_day' ? 2 : 1)}
                        </div>
                        <div style={{ fontSize: '10px', ...MUTED }}>{exp as string}</div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '11px', ...MUTED }}>نتائج الإنتاج gross (بدون تكاليف)، فالمتوقع نطاق مرجعي لكشف انحراف كبير — مش تطابق دقيق.</p>
              </div>
            </section>

            {/* 3) Research Status */}
            <section className="space-y-3">
              <H2>Research Status</H2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="المحرك الحالي" value={<span style={{ fontSize: 'var(--text-sm)' }}>{rs?.current_engine}</span>} />
                <Stat label="نسخة Trend" value={rs?.trend_version ?? '—'} />
                <Stat label="نسخة البحث" value={rs?.research_version ?? '—'} />
                <Stat label="آخر مسح" value={<span className="num" style={{ fontSize: 'var(--text-base)' }}>{rs?.last_scan ?? '—'}</span>} />
                <Stat label="آخر تحديث نتائج" value={<span className="num" style={{ fontSize: 'var(--text-base)' }}>{rs?.last_outcome_update ?? '—'}</span>} />
                <Stat label="أسهم تم تحليلها" value={rs?.stocks_analyzed ?? '—'} />
              </div>
            </section>

            {/* 4) Daily Statistics */}
            <section className="space-y-3">
              <H2>إحصائيات اليوم</H2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <Stat label="🚀 Trend" value={data.daily_stats.trend} color={BLUE} />
                <Stat label="⚠ SRA" value={data.daily_stats.sra} color={AMBER} />
                <Stat label="📊 Radar≥60" value={data.daily_stats.radar} />
                <Stat label="تقاطع Trend/SRA" value={data.daily_stats.overlap_trend_sra} />
                <Stat label="Trend فقط" value={data.daily_stats.trend_only} />
                <Stat label="SRA فقط" value={data.daily_stats.sra_only} />
              </div>
            </section>

            {/* 5) Today's Signals */}
            <section className="space-y-3">
              <H2>إشارات اليوم</H2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><Rocket size={15} style={{ color: BLUE }} /><span className="font-bold" style={{ fontSize: 'var(--text-sm)' }}>Trend Initiation ({data.today.trend.length})</span></div>
                  {data.today.trend.length === 0
                    ? <p className="rounded-lg p-3" style={{ ...CARD, fontSize: 'var(--text-xs)', ...MUTED }}>لا توجد إشارات ترند (طبيعي — 1–2 يومياً)</p>
                    : data.today.trend.map((s, i) => <SignalCard key={i} s={s} />)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><ShieldAlert size={15} style={{ color: AMBER }} /><span className="font-bold" style={{ fontSize: 'var(--text-sm)' }}>Crisis SRA ({data.today.sra.length})</span></div>
                  {data.today.sra.length === 0
                    ? <p className="rounded-lg p-3" style={{ ...CARD, fontSize: 'var(--text-xs)', ...MUTED }}>لا توجد إشارات SRA</p>
                    : data.today.sra.map((s, i) => <SignalCard key={i} s={s} />)}
                </div>
              </div>
              <div className="rounded-xl p-3 space-y-2" style={CARD}>
                <div className="flex items-center gap-2"><BarChart3 size={15} style={MUTED} /><span className="font-bold" style={{ fontSize: 'var(--text-sm)' }}>Radar Score Pool ≥ 60 ({data.today.radar_pool.length})</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {data.today.radar_pool.length === 0
                    ? <span style={{ fontSize: 'var(--text-xs)', ...MUTED }}>لا يوجد</span>
                    : data.today.radar_pool.map((p, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded num" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{p.symbol} <span style={MUTED}>{fmt(p.score, 0)}</span></span>
                    ))}
                </div>
              </div>
            </section>

            {/* 6) Overlap with symbols */}
            <section className="space-y-3">
              <H2>Overlap — المحرك الجديد بيضيف إيه؟</H2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl p-4 space-y-2" style={CARD}>
                  <div className="font-bold" style={{ fontSize: 'var(--text-sm)', color: BLUE }}>Trend فقط ({data.overlap.trend_only.length})</div>
                  <Chips syms={data.overlap.trend_only} color={BLUE} />
                </div>
                <div className="rounded-xl p-4 space-y-2" style={CARD}>
                  <div className="font-bold" style={{ fontSize: 'var(--text-sm)', color: GREEN }}>الاثنين ({data.overlap.both.length})</div>
                  <Chips syms={data.overlap.both} color={GREEN} />
                </div>
                <div className="rounded-xl p-4 space-y-2" style={CARD}>
                  <div className="font-bold" style={{ fontSize: 'var(--text-sm)', color: AMBER }}>SRA فقط ({data.overlap.sra_only.length})</div>
                  <Chips syms={data.overlap.sra_only} color={AMBER} />
                </div>
              </div>
            </section>

            {/* 7) Side by Side */}
            <section className="space-y-3">
              <H2>Side by Side — Trend مقابل SRA</H2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CompareCard label="Profit Factor" t={to?.pf ?? null} s={so?.pf ?? null} better="high" digits={2} />
                <CompareCard label="Win Rate" t={to?.win_rate ?? null} s={so?.win_rate ?? null} unit="%" better="high" digits={1} />
                <CompareCard label="متوسط العائد" t={to?.avg_return ?? null} s={so?.avg_return ?? null} unit="%" better="high" digits={2} />
                <CompareCard label="Max DD" t={to?.max_dd ?? null} s={so?.max_dd ?? null} better="low" digits={1} />
              </div>
            </section>

            {/* 8) Performance table */}
            <section className="space-y-3">
              <H2>الأداء التفصيلي</H2>
              {to && so && <PerfTable t={to} s={so} />}
            </section>

            {/* 9) Last 30 days */}
            <section className="space-y-3">
              <H2>آخر 30 يوم</H2>
              <div className="rounded-xl overflow-hidden" style={CARD}>
                <div className="grid grid-cols-5 gap-2 p-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['التاريخ', 'Trend', 'SRA', 'Radar', 'تقاطع'].map(h => <span key={h} className="text-center" style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{h}</span>)}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {data.last_30_days.length === 0
                    ? <p className="p-3 text-center" style={{ fontSize: 'var(--text-xs)', ...MUTED }}>لا توجد بيانات بعد</p>
                    : data.last_30_days.map(r => (
                      <div key={r.date} className="grid grid-cols-5 gap-2 px-2.5 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <span className="text-center num" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{r.date.slice(5)}</span>
                        <span className="text-center num font-bold" style={{ fontSize: 'var(--text-xs)', color: BLUE }}>{r.trend}</span>
                        <span className="text-center num" style={{ fontSize: 'var(--text-xs)', color: AMBER }}>{r.sra}</span>
                        <span className="text-center num" style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{r.radar}</span>
                        <span className="text-center num" style={{ fontSize: 'var(--text-xs)', ...MUTED }}>{r.overlap}</span>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* 10) Scan Log */}
            <section className="space-y-3">
              <H2>سجل عمليات المسح</H2>
              <div className="space-y-1.5">
                {data.scan_logs.length === 0
                  ? <p className="rounded-lg p-3" style={{ ...CARD, fontSize: 'var(--text-xs)', ...MUTED }}>لا توجد سجلات</p>
                  : data.scan_logs.map((lg, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={CARD}>
                      {lg.status === 'success' ? <CheckCircle size={14} style={{ color: GREEN, flexShrink: 0 }} />
                        : lg.status === 'failed' ? <AlertCircle size={14} style={{ color: RED, flexShrink: 0 }} />
                          : <Clock size={14} style={{ color: AMBER, flexShrink: 0 }} />}
                      <span className="num" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{lg.run_date}</span>
                      <span className="num" style={{ fontSize: 'var(--text-xs)', ...MUTED }}>مسح {lg.stocks_scanned ?? '—'}</span>
                      <div className="flex items-center gap-2 mr-auto">
                        <span className="text-[11px] num" style={{ color: BLUE }}>T:{lg.trend}</span>
                        <span className="text-[11px] num" style={{ color: AMBER }}>S:{lg.sra ?? '—'}</span>
                        <span className="text-[11px] num" style={MUTED}>M:{lg.momentum ?? '—'}</span>
                        {lg.duration_seconds != null && <span className="text-[11px] num" style={MUTED}>{lg.duration_seconds}s</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-3 text-center">
              <RefreshCw size={32} className="animate-spin mx-auto" style={MUTED} />
              <p style={{ fontSize: 'var(--text-sm)', ...MUTED }}>جارٍ تحميل بيانات المراقبة...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
