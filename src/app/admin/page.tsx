'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity, TrendingUp, BookOpen, Cpu, AlertCircle, CheckCircle, Users, ShieldCheck, BarChart2, Eye, CreditCard, X, Check } from 'lucide-react';
import { AppNav } from '@/components';
import { api, ApiError } from '@/lib/api';
import type { User, PaymentRecord } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminHealth {
  as_of: string;
  users?: { total: number; pro: number; free: number };
  signals: {
    today:    number;
    sra_open: number;
    all_open: number;
    sra_7d?:  number;
    sra_30d?: number;
  };
  performance: {
    total_closed: number;
    wins:         number;
    losses:       number;
    expired:      number;
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

interface OwnerUser {
  id:         number;
  email:      string;
  name:       string;
  is_pro:     boolean;
  created_at: string | null;
  last_login: string | null;
}

interface OwnerDashboard {
  users: {
    total: number;
    pro:   number;
    free:  number;
    list:  OwnerUser[];
  };
  analytics: {
    period_days:     number;
    total_events:    number;
    page_views:      number;
    event_breakdown: { name: string; count: number }[];
    top_pages:       { path: string; views: number }[];
    top_stocks:      { symbol: string; views: number }[];
  };
}

const ADMIN_EMAIL = 'mosaab.osama.ewies1010@gmail.com';

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

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
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
  const [me,          setMe]          = useState<User | null>(null);
  const [isOwner,     setIsOwner]     = useState(false);
  const [data,        setData]        = useState<AdminHealth | null>(null);
  const [ownerData,   setOwnerData]   = useState<OwnerDashboard | null>(null);
  const [payments,    setPayments]    = useState<PaymentRecord[]>([]);
  const [payAction,   setPayAction]   = useState<Record<number, 'approving'|'rejecting'|null>>({});
  const [rejectNote,  setRejectNote]  = useState<Record<number, string>>({});
  const [showReject,  setShowReject]  = useState<Record<number, boolean>>({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null);

  // Grant PRO form
  const [apiKey,       setApiKey]       = useState('');
  const [grantEmail,   setGrantEmail]   = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMsg,     setGrantMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

  const loadHealth = useCallback(async () => {
    const res = await fetch(`${base}/api/admin/health`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<AdminHealth>;
  }, [base]);

  const loadOwnerDashboard = useCallback(async () => {
    const token = localStorage.getItem('egx_token');
    if (!token) return null;
    const res = await fetch(`${base}/api/admin/dashboard?days=7`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json() as Promise<OwnerDashboard>;
  }, [base]);

  const loadPayments = useCallback(async () => {
    const token = localStorage.getItem('egx_token');
    if (!token) return;
    const res = await fetch(`${base}/api/admin/payments?status=all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = await res.json();
    setPayments(json.payments ?? []);
  }, [base]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, owner] = await Promise.all([
        loadHealth(),
        loadOwnerDashboard(),
      ]);
      setData(health);
      if (owner) {
        setOwnerData(owner);
        await loadPayments();
      }
      setLastUpdate(new Date());
    } catch {
      setError('تعذّر الاتصال بالـ API');
    } finally {
      setLoading(false);
    }
  }, [loadHealth, loadOwnerDashboard, loadPayments]);

  const handleApprove = async (payId: number) => {
    setPayAction((p) => ({ ...p, [payId]: 'approving' }));
    const token = localStorage.getItem('egx_token');
    await fetch(`${base}/api/admin/payments/${payId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setPayAction((p) => ({ ...p, [payId]: null }));
    await loadPayments();
  };

  const handleReject = async (payId: number) => {
    setPayAction((p) => ({ ...p, [payId]: 'rejecting' }));
    const token = localStorage.getItem('egx_token');
    await fetch(`${base}/api/admin/payments/${payId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:   JSON.stringify({ note: rejectNote[payId] ?? '' }),
    });
    setPayAction((p) => ({ ...p, [payId]: null }));
    setShowReject((s) => ({ ...s, [payId]: false }));
    await loadPayments();
  };

  useEffect(() => {
    (async () => {
      try {
        const user = await api.getMe();
        setMe(user);
        setIsOwner(user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      } catch {
        // not logged in — still show public health
      }
      load();
    })();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const conf = data ? kbConfidence(data.knowledge_base.size) : null;

  const handleGrantPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !grantEmail) return;
    setGrantLoading(true);
    setGrantMsg(null);
    try {
      const res = await fetch(`${base}/api/admin/grant-pro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body:    JSON.stringify({ email: grantEmail }),
      });
      const json = await res.json();
      if (res.ok) {
        setGrantMsg({ ok: true, text: `✅ ${grantEmail} — تم تفعيل PRO` });
        setGrantEmail('');
        load();
      } else {
        setGrantMsg({ ok: false, text: json.error ?? `خطأ ${res.status}` });
      }
    } catch {
      setGrantMsg({ ok: false, text: 'تعذّر الاتصال بالـ API' });
    } finally {
      setGrantLoading(false);
    }
  };

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
              {isOwner && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)' }}
                >
                  OWNER
                </span>
              )}
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

        {/* ── Owner-only: Analytics section ───────────────────────────────── */}
        {isOwner && ownerData && (
          <>
            {/* Analytics overview */}
            <section className="space-y-3">
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                الزيارات والتحليلات — آخر 7 أيام
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="إجمالي الأحداث"
                  value={ownerData.analytics.total_events}
                  color="var(--accent-primary)"
                  icon={<BarChart2 size={13} />}
                />
                <StatCard
                  label="مشاهدات الصفحات"
                  value={ownerData.analytics.page_views}
                  color="#3b82f6"
                  icon={<Eye size={13} />}
                />
                <StatCard
                  label="إجمالي المستخدمين"
                  value={ownerData.users.total}
                  color="var(--text-primary)"
                  icon={<Users size={13} />}
                />
                <StatCard
                  label="مشتركو PRO"
                  value={ownerData.users.pro}
                  color="#f0b429"
                  icon={<ShieldCheck size={13} />}
                />
              </div>
            </section>

            {/* Top pages + Top stocks */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top pages */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    أكثر الصفحات زيارة
                  </span>
                </div>
                {ownerData.analytics.top_pages.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>لا توجد بيانات بعد</p>
                ) : (
                  <div className="space-y-2">
                    {ownerData.analytics.top_pages.slice(0, 7).map(({ path, views }) => {
                      const max = ownerData.analytics.top_pages[0]?.views || 1;
                      const pct = Math.round((views / max) * 100);
                      return (
                        <div key={path} className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)', maxWidth: '60%', direction: 'ltr' }}>
                              {path || '/'}
                            </span>
                            <span className="text-xs num font-bold" style={{ color: 'var(--accent-primary)' }}>
                              {views}
                            </span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: 'var(--accent-primary)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top stocks */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    أكثر الأسهم بحثاً
                  </span>
                </div>
                {ownerData.analytics.top_stocks.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>لا توجد بيانات بعد</p>
                ) : (
                  <div className="space-y-2">
                    {ownerData.analytics.top_stocks.slice(0, 7).map(({ symbol, views }) => {
                      const max = ownerData.analytics.top_stocks[0]?.views || 1;
                      const pct = Math.round((views / max) * 100);
                      return (
                        <div key={symbol} className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold num" style={{ color: '#22c55e' }}>
                              {symbol}
                            </span>
                            <span className="text-xs num font-bold" style={{ color: 'var(--text-secondary)' }}>
                              {views}
                            </span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: '#22c55e' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Event breakdown */}
            {ownerData.analytics.event_breakdown.length > 0 && (
              <section
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  توزيع الأحداث
                </span>
                <div className="flex flex-wrap gap-2">
                  {ownerData.analytics.event_breakdown.map(({ name, count }) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', direction: 'ltr' }}>
                        {name}
                      </span>
                      <span className="num font-bold" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)' }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Users table */}
            <section className="space-y-3">
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                جميع المستخدمين ({ownerData.users.total})
              </h2>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                        {['البريد', 'الاسم', 'PRO', 'تاريخ التسجيل', 'آخر دخول'].map(col => (
                          <th
                            key={col}
                            className="px-4 py-2.5 text-right font-semibold"
                            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ownerData.users.list.map((u) => (
                        <tr
                          key={u.id}
                          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
                        >
                          <td className="px-4 py-2.5 font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', direction: 'ltr' }}>
                            {u.email}
                          </td>
                          <td className="px-4 py-2.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                            {u.name || '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            {u.is_pro ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)' }}>
                                PRO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs" style={{ color: 'var(--text-muted)' }}>
                                مجاني
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {fmtDate(u.created_at)}
                          </td>
                          <td className="px-4 py-2.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {fmtDate(u.last_login)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Owner-only: Pending Payments ────────────────────────────────── */}
        {isOwner && payments.length > 0 && (
          <section className="space-y-3">
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              طلبات الاشتراك ({payments.filter(p => p.status === 'pending').length} في الانتظار)
            </h2>
            <div className="flex flex-col gap-3">
              {payments.map((pay) => {
                const isPending  = pay.status === 'pending';
                const statusColors: Record<string, string> = {
                  pending:   '#f59e0b',
                  completed: '#22c55e',
                  rejected:  '#ef4444',
                  failed:    '#ef4444',
                  refunded:  'var(--text-muted)',
                };
                const statusLabels: Record<string, string> = {
                  pending:   'في الانتظار',
                  completed: 'مُفعَّل ✅',
                  rejected:  'مرفوض',
                  failed:    'فشل',
                  refunded:  'مسترد',
                };
                const methodLabels: Record<string, string> = {
                  instapay:      'InstaPay',
                  vodafone_cash: 'Vodafone Cash',
                };
                return (
                  <div
                    key={pay.id}
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${isPending ? 'rgba(245,158,11,0.4)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {pay.user_email ?? `User #${pay.user_id}`}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: `${statusColors[pay.status]}20`, color: statusColors[pay.status], border: `1px solid ${statusColors[pay.status]}40` }}
                          >
                            {statusLabels[pay.status] ?? pay.status}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {pay.plan === 'pro_monthly' ? 'PRO شهري' : 'PRO سنوي'} · {methodLabels[pay.payment_method ?? ''] ?? pay.payment_method} · {pay.amount} {pay.currency}
                        </p>
                        <p className="text-xs num" style={{ color: 'var(--text-muted)' }}>
                          {new Date(pay.created_at).toLocaleString('ar-EG')} · ref: {pay.provider_ref}
                        </p>
                        {pay.admin_note && (
                          <p className="text-xs" style={{ color: '#ef4444' }}>ملاحظة: {pay.admin_note}</p>
                        )}
                      </div>
                      {/* Approve/Reject buttons */}
                      {isPending && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(pay.id)}
                            disabled={!!payAction[pay.id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                          >
                            {payAction[pay.id] === 'approving'
                              ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              : <Check size={12} />}
                            موافقة
                          </button>
                          <button
                            onClick={() => setShowReject((s) => ({ ...s, [pay.id]: !s[pay.id] }))}
                            disabled={!!payAction[pay.id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            <X size={12} />
                            رفض
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Receipt image */}
                    {pay.receipt_image && (
                      <details className="space-y-2">
                        <summary className="text-xs cursor-pointer" style={{ color: 'var(--accent-primary)' }}>
                          عرض صورة الإيصال
                        </summary>
                        <img
                          src={pay.receipt_image}
                          alt="receipt"
                          className="rounded-lg max-h-64 object-contain"
                          style={{ border: '1px solid var(--border-subtle)' }}
                        />
                      </details>
                    )}

                    {/* Reject note input */}
                    {isPending && showReject[pay.id] && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="سبب الرفض (اختياري)"
                          value={rejectNote[pay.id] ?? ''}
                          onChange={(e) => setRejectNote((n) => ({ ...n, [pay.id]: e.target.value }))}
                          className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                        />
                        <button
                          onClick={() => handleReject(pay.id)}
                          disabled={!!payAction[pay.id]}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                          style={{ background: '#ef4444', color: 'white' }}
                        >
                          {payAction[pay.id] === 'rejecting'
                            ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                            : 'تأكيد الرفض'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
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
                  value={data.signals.sra_7d ?? '—'}
                  icon={<Activity size={13} />}
                />
                <StatCard
                  label="SRA آخر 30 يوم"
                  value={data.signals.sra_30d ?? '—'}
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
                  label="Win Rate (WIN÷(WIN+LOSS))"
                  value={data.performance.win_rate != null ? `${fmt(data.performance.win_rate, 1)}%` : '—'}
                  sub={`${data.performance.wins + data.performance.losses} صفقة محسومة`}
                  color={
                    data.performance.win_rate == null ? undefined :
                    data.performance.win_rate >= 60 ? '#22c55e' :
                    data.performance.win_rate >= 45 ? '#f59e0b' : '#ef4444'
                  }
                />
                <StatCard
                  label="صفقات رابحة ✅"
                  value={data.performance.wins}
                  color="#22c55e"
                />
                <StatCard
                  label="صفقات خاسرة ❌"
                  value={data.performance.losses}
                  color="#ef4444"
                />
                <StatCard
                  label="منتهية المدة ⏱"
                  value={data.performance.expired ?? 0}
                  sub="لم تصل TP أو SL"
                  color="var(--text-muted)"
                />
              </div>
            </section>

            {/* ── Section 3: Grade Dist + KB ──────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GradeBar dist={data.sra.grade_dist} />

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

            {/* ── Section: Users (non-owner fallback) ─────────────────── */}
            {!isOwner && data.users && (
              <section className="space-y-3">
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  المستخدمون
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="إجمالي المستخدمين" value={data.users.total} icon={<Users size={13} />} color="var(--accent-primary)" />
                  <StatCard label="مشتركو PRO"         value={data.users.pro}   icon={<ShieldCheck size={13} />} color="#f0b429" />
                  <StatCard label="حسابات مجانية"      value={data.users.free}  icon={<Users size={13} />} />
                </div>
              </section>
            )}

            {/* ── Section: Grant PRO ──────────────────────────────────── */}
            <section
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: '#f0b429' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>منح / إلغاء PRO</h2>
              </div>

              <form onSubmit={handleGrantPro} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: 'var(--text-muted)' }}>BOT_API_KEY</label>
                    <input
                      type="password"
                      placeholder="المفتاح السري من Render"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', direction: 'ltr' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={grantEmail}
                      onChange={(e) => setGrantEmail(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', direction: 'ltr' }}
                    />
                  </div>
                </div>

                {grantMsg && (
                  <div
                    className="px-4 py-2.5 rounded-lg text-sm"
                    style={{
                      background: grantMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color:      grantMsg.ok ? '#22c55e' : '#ef4444',
                      border:     `1px solid ${grantMsg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {grantMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={grantLoading || !apiKey || !grantEmail}
                  className="w-fit px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                  style={{ background: '#f0b429', color: '#000' }}
                >
                  {grantLoading
                    ? <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    : <ShieldCheck size={14} />}
                  منح PRO
                </button>
              </form>
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
