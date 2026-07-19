'use client';
import { useState, useEffect } from 'react';
import { Check, Crown, Clock, AlertCircle, Gift } from 'lucide-react';
import { api } from '@/lib/api';
import type { Plan, PaymentRecord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardBody, ErrorState, WidgetSkeleton } from '@/design-system';
import { useAppStore } from '@/lib/store';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function statusColor(status: PaymentRecord['status']): string {
  return status === 'completed' ? 'var(--success)'
       : status === 'pending'   ? '#f59e0b'
       : status === 'failed'    ? 'var(--error)'
       : 'var(--text-muted)';
}

function statusLabel(status: PaymentRecord['status']): string {
  return status === 'completed' ? 'مكتملة'
       : status === 'pending'   ? 'في الانتظار'
       : status === 'failed'    ? 'فشلت'
       : 'مستردة';
}

// ── WGT-080: Plan cards ───────────────────────────────────────────────────────

function PlanCard({
  plan,
  onSelect,
  loading,
}: {
  plan: Plan;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const isAnnual = plan.period === 'annual';
  const accent   = isAnnual ? '#f59e0b' : 'var(--accent-primary)';

  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4"
      style={{
        background: 'var(--bg-surface)',
        border: `2px solid ${isAnnual ? '#f59e0b40' : 'var(--border-subtle)'}`,
      }}
      data-widget-id="WGT-080"
    >
      {isAnnual && (
        <span
          className="absolute top-4 left-4 text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: '#f59e0b', color: '#000' }}
        >
          وفّر {plan.savings}
        </span>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown size={18} style={{ color: accent }} />
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {plan.name_ar}
          </h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black num" style={{ color: accent }}>
            {fmt(plan.price, 0)}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {plan.currency} / {plan.period === 'weekly' ? 'أسبوع' : plan.period === 'monthly' ? 'شهر' : 'سنة'}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Check size={12} style={{ color: accent, flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        disabled={loading}
        className="mt-auto w-full py-2.5 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
        style={{ background: accent, color: isAnnual ? '#000' : 'white' }}
      >
        {loading ? 'جارٍ المعالجة...' : 'اشترك الآن'}
      </button>
    </div>
  );
}

// ── WGT-081: Billing history ──────────────────────────────────────────────────

function BillingHistory({ items }: { items: PaymentRecord[] }) {
  if (items.length === 0) {
    return (
      <Card widgetId="WGT-081">
        <CardHeader>
          <CardTitle icon={<Clock size={16} />}>سجل الفواتير</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            لا توجد مدفوعات سابقة
          </p>
        </CardBody>
      </Card>
    );
  }

  const PLAN_LABEL: Record<string, string> = {
    pro_weekly:  'PRO أسبوعي',
    pro_monthly: 'PRO شهري',
    pro_annual:  'PRO سنوي',
  };

  return (
    <Card widgetId="WGT-081">
      <CardHeader>
        <CardTitle icon={<Clock size={16} />}>سجل الفواتير</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {PLAN_LABEL[p.plan] ?? p.plan}
                </p>
                <p className="text-xs num" style={{ color: 'var(--text-muted)' }}>
                  {p.provider_ref ?? '—'} · {new Date(p.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold num" style={{ color: 'var(--text-primary)' }}>
                  {fmt(p.amount, 0)} {p.currency}
                </p>
                <p className="text-xs font-medium" style={{ color: statusColor(p.status) }}>
                  {statusLabel(p.status)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Subscribe confirmation banner ─────────────────────────────────────────────

function PendingBanner({
  providerRef,
  instructions,
  onConfirm,
  paymentId,
  loading,
}: {
  providerRef: string;
  instructions: string;
  onConfirm: (id: number) => void;
  paymentId: number;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
      data-testid="pending-banner"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: '#f59e0b' }}>
            في انتظار التأكيد
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {instructions}
          </p>
          <p className="text-xs mt-2 font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
            رقم المرجع: {providerRef}
          </p>
        </div>
      </div>
      <button
        onClick={() => onConfirm(paymentId)}
        disabled={loading}
        className="self-start px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
        style={{ background: '#f59e0b', color: '#000' }}
      >
        {loading ? 'جارٍ التأكيد...' : 'تأكيد الدفع'}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { user } = useAppStore();

  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [history,     setHistory]     = useState<PaymentRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [pending,     setPending]     = useState<{
    paymentId: number; providerRef: string; instructions: string;
  } | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansData, histData] = await Promise.all([
        api.getPlans(),
        user ? api.getPaymentHistory() : Promise.resolve({ total: 0, items: [] }),
      ]);
      setPlans(plansData.plans);
      setHistory(histData.items);
    } catch {
      setError('تعذّر تحميل بيانات الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }
    setSubscribing(true);
    setError(null);
    try {
      const res = await api.subscribe(planId as 'pro_weekly' | 'pro_monthly' | 'pro_annual');
      setPending({
        paymentId:    res.payment.id,
        providerRef:  res.provider_ref,
        instructions: res.instructions,
      });
      setHistory((h) => [res.payment, ...h]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg || 'تعذّر إنشاء طلب الاشتراك');
    } finally {
      setSubscribing(false);
    }
  };

  const handleConfirm = async (paymentId: number) => {
    setConfirming(true);
    setError(null);
    try {
      const res = await api.confirmPayment(paymentId);
      setPending(null);
      setSuccessMsg('تم تفعيل اشتراكك PRO بنجاح 🎉');
      setHistory((h) =>
        h.map((p) => (p.id === paymentId ? res.payment : p))
      );
    } catch {
      setError('تعذّر تأكيد الدفع');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6" style={{ minHeight: '100vh' }}>
      <div>
        <h1 className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
          الاشتراك في PRO
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          احصل على كامل مزايا EGX Radar
        </p>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div
          className="rounded-xl p-4 text-sm font-medium"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)' }}
          role="status"
        >
          {successMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)' }}
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <WidgetSkeleton rows={6} />
          <WidgetSkeleton rows={3} />
        </div>
      ) : error && plans.length === 0 ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : (
        <>
          {/* Pending banner */}
          {pending && (
            <PendingBanner
              providerRef={pending.providerRef}
              instructions={pending.instructions}
              onConfirm={handleConfirm}
              paymentId={pending.paymentId}
              loading={confirming}
            />
          )}

          {/* Already PRO */}
          {user?.is_pro && !pending && !successMsg && (
            <div
              className="rounded-xl p-4 text-sm font-medium flex items-center gap-2"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
            >
              <Crown size={16} />
              {user.pro_expires_at
                ? `أنت مشترك في خطة PRO — ينتهي اشتراكك في ${new Date(user.pro_expires_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'أنت مشترك بالفعل في خطة PRO — شكراً لدعمك!'}
            </div>
          )}

          {/* Plan cards */}
          {!user?.is_pro && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSubscribe}
                  loading={subscribing}
                />
              ))}
            </div>
          )}

          {/* Referral promo banner */}
          <div
            className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)' }}
            >
              <Gift size={20} style={{ color: 'var(--success)' }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: 'var(--success)' }}>
                ادعُ أصدقائك واحصل على خصم 20%
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                شارك EGX Radar مع صديق — لما يشترك، هتاخد خصم 20% من الشهر الجاي تلقائياً.
              </p>
            </div>
          </div>

          {/* Billing history */}
          {user && <BillingHistory items={history} />}
        </>
      )}
    </main>
  );
}
