'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, Crown, Clock, AlertCircle, Gift, Upload, Smartphone, Wallet, CheckCircle, Copy, Link2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Plan, PaymentRecord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardBody, ErrorState, WidgetSkeleton } from '@/design-system';
import { useAppStore } from '@/lib/store';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function statusColor(status: PaymentRecord['status']): string {
  return status === 'completed' ? 'var(--success)'
       : status === 'pending'   ? '#f59e0b'
       : status === 'failed'    ? 'var(--error)'
       : status === 'rejected'  ? 'var(--error)'
       : 'var(--text-muted)';
}

function statusLabel(status: PaymentRecord['status']): string {
  return status === 'completed' ? 'مكتملة ✅'
       : status === 'pending'   ? 'في انتظار الموافقة ⏳'
       : status === 'failed'    ? 'فشلت'
       : status === 'rejected'  ? 'مرفوضة ❌'
       : 'مستردة';
}

type PaymentMethod = 'instapay' | 'vodafone_cash';

interface PlansResponse {
  plans:    Plan[];
  accounts: Record<PaymentMethod, string>;
  methods:  PaymentMethod[];
}

const METHOD_INFO: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
  instapay:      { label: 'InstaPay',      icon: <Smartphone size={20} />, color: '#6366f1' },
  vodafone_cash: { label: 'Vodafone Cash', icon: <Wallet      size={20} />, color: '#ef4444' },
};

// ── Billing history ───────────────────────────────────────────────────────────

function BillingHistory({ items }: { items: PaymentRecord[] }) {
  if (items.length === 0) return null;

  const PLAN_LABEL: Record<string, string> = {
    pro_monthly: 'PRO شهري',
    pro_annual:  'PRO سنوي',
  };
  const METHOD_LABEL: Record<string, string> = {
    instapay:      'InstaPay',
    vodafone_cash: 'Vodafone Cash',
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
                  {p.provider_ref ?? '—'} · {METHOD_LABEL[p.payment_method ?? ''] ?? ''} · {new Date(p.created_at).toLocaleDateString('ar-EG')}
                </p>
                {p.admin_note && (
                  <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
                    ملاحظة: {p.admin_note}
                  </p>
                )}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { user } = useAppStore();

  const [plansData,    setPlansData]    = useState<PlansResponse | null>(null);
  const [history,      setHistory]      = useState<PaymentRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // checkout state
  const [selectedPlan,   setSelectedPlan]   = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [receiptImage,   setReceiptImage]   = useState<string | null>(null);
  const [receiptName,    setReceiptName]    = useState<string>('');
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [submitError,    setSubmitError]    = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
      const [plansRes, histData] = await Promise.all([
        fetch(`${base}/api/payments/plans`).then((r) => r.json()),
        user ? api.getPaymentHistory() : Promise.resolve({ total: 0, items: [] }),
      ]);
      setPlansData(plansRes);
      setHistory(histData.items);
    } catch {
      setError('تعذّر تحميل بيانات الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('حجم الصورة يجب أن يكون أقل من 5 ميجا');
      return;
    }
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) { setSubmitError('يجب تسجيل الدخول أولاً'); return; }
    if (!selectedPlan || !selectedMethod || !receiptImage) {
      setSubmitError('يرجى اختيار الخطة وطريقة الدفع ورفع صورة الإيصال');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
      const token = localStorage.getItem('egx_token');
      const res = await fetch(`${base}/api/payments/subscribe`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan:           selectedPlan,
          payment_method: selectedMethod,
          receipt_image:  receiptImage,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? `خطأ ${res.status}`);
        return;
      }
      setSubmitted(true);
      setHistory((h) => [json.payment, ...h]);
    } catch {
      setSubmitError('تعذّر إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlanObj = plansData?.plans.find((p) => p.id === selectedPlan);
  const accountNumber   = selectedMethod ? plansData?.accounts[selectedMethod] : null;
  const hasDiscount     = user?.has_referral_discount || (user?.discount_credits ?? 0) > 0;
  const referralLink    = user?.referral_code
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://egxradar.com'}/register?ref=${user.referral_code}`
    : null;

  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {loading ? (
        <div className="flex flex-col gap-4">
          <WidgetSkeleton rows={6} />
          <WidgetSkeleton rows={3} />
        </div>
      ) : error ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : (
        <>
          {/* Already PRO */}
          {user?.is_pro && !submitted && (
            <div
              className="rounded-xl p-4 text-sm font-medium flex items-center gap-2"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
            >
              <Crown size={16} />
              أنت مشترك بالفعل في خطة PRO — شكراً لدعمك!
            </div>
          )}

          {/* Success state */}
          {submitted && (
            <div
              className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <CheckCircle size={40} style={{ color: '#22c55e' }} />
              <p className="font-bold text-base" style={{ color: '#22c55e' }}>
                تم استلام طلبك بنجاح!
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                جارٍ مراجعة إيصال الدفع — سيتم تفعيل اشتراكك خلال ساعات قليلة بعد موافقة الادمن.
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                يمكنك متابعة حالة طلبك في سجل الفواتير أدناه.
              </p>
            </div>
          )}

          {/* Checkout form — not PRO, not submitted */}
          {!user?.is_pro && !submitted && (
            <div className="flex flex-col gap-6">

              {/* Step 1: Choose plan */}
              <div className="space-y-3">
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  الخطوة 1 — اختر الخطة
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plansData?.plans.map((plan) => {
                    const isAnnual   = plan.period === 'annual';
                    const accent     = isAnnual ? '#f59e0b' : 'var(--accent-primary)';
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className="relative rounded-2xl p-5 flex flex-col gap-3 text-right transition-all"
                        style={{
                          background: 'var(--bg-surface)',
                          border: `2px solid ${isSelected ? accent : isAnnual ? '#f59e0b40' : 'var(--border-subtle)'}`,
                          boxShadow: isSelected ? `0 0 0 1px ${accent}` : 'none',
                        }}
                      >
                        {isAnnual && (
                          <span
                            className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: '#f59e0b', color: '#000' }}
                          >
                            وفّر {plan.savings}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <Crown size={16} style={{ color: accent }} />
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {plan.name_ar}
                          </span>
                          {isSelected && <CheckCircle size={14} style={{ color: accent, marginRight: 'auto' }} />}
                        </div>
                        <div className="flex items-baseline gap-1 flex-wrap">
                          {hasDiscount ? (
                            <>
                              <span className="text-2xl font-black num" style={{ color: '#22c55e' }}>
                                {fmt(plan.price * 0.8, 0)}
                              </span>
                              <span className="text-sm line-through num" style={{ color: 'var(--text-muted)' }}>
                                {fmt(plan.price, 0)}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {plan.currency} / {plan.period === 'monthly' ? 'شهر' : 'سنة'}
                              </span>
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e', color: '#000' }}>
                                خصم 20%
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl font-black num" style={{ color: accent }}>
                                {fmt(plan.price, 0)}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {plan.currency} / {plan.period === 'monthly' ? 'شهر' : 'سنة'}
                              </span>
                            </>
                          )}
                        </div>
                        <ul className="flex flex-col gap-1">
                          {plan.features.slice(0, 3).map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <Check size={10} style={{ color: accent, flexShrink: 0 }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Choose payment method */}
              {selectedPlan && (
                <div className="space-y-3">
                  <h2 className="font-bold text-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    الخطوة 2 — اختر طريقة الدفع
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(plansData?.methods ?? []).map((method) => {
                      const info       = METHOD_INFO[method];
                      const isSelected = selectedMethod === method;
                      return (
                        <button
                          key={method}
                          onClick={() => setSelectedMethod(method)}
                          className="rounded-xl p-4 flex flex-col items-center gap-2 transition-all"
                          style={{
                            background: 'var(--bg-surface)',
                            border: `2px solid ${isSelected ? info.color : 'var(--border-subtle)'}`,
                            boxShadow: isSelected ? `0 0 0 1px ${info.color}` : 'none',
                            color: isSelected ? info.color : 'var(--text-muted)',
                          }}
                        >
                          {info.icon}
                          <span className="text-sm font-bold">{info.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Payment instructions + upload */}
              {selectedPlan && selectedMethod && (
                <div className="space-y-3">
                  <h2 className="font-bold text-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    الخطوة 3 — ادفع وارفع الإيصال
                  </h2>

                  {/* Instructions box */}
                  <div
                    className="rounded-xl p-4 space-y-2"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)' }}
                  >
                    <p className="text-sm font-bold" style={{ color: '#818cf8' }}>
                      تعليمات الدفع عبر {METHOD_INFO[selectedMethod].label}
                    </p>
                    <ol className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <li>
                        <span className="font-bold">1.</span> افتح تطبيق {METHOD_INFO[selectedMethod].label} وابعت المبلغ إلى:
                      </li>
                      <div
                        className="font-black text-xl num text-center py-2 rounded-lg my-1"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', letterSpacing: '0.1em' }}
                      >
                        {accountNumber}
                      </div>
                      <li>
                        <span className="font-bold">2.</span> المبلغ:{' '}
                        <span className="font-black num" style={{ color: 'var(--accent-primary)' }}>
                          {fmt(selectedPlanObj?.price ?? 0, 0)} {selectedPlanObj?.currency}
                        </span>
                      </li>
                      <li>
                        <span className="font-bold">3.</span> خد screenshot للإيصال وارفعه أدناه.
                      </li>
                    </ol>
                  </div>

                  {/* Upload */}
                  <div className="space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full rounded-xl py-4 flex flex-col items-center gap-2 transition-colors"
                      style={{
                        background: receiptImage ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)',
                        border: `2px dashed ${receiptImage ? '#22c55e' : 'var(--border-default)'}`,
                        color: receiptImage ? '#22c55e' : 'var(--text-muted)',
                      }}
                    >
                      {receiptImage ? (
                        <>
                          <CheckCircle size={24} />
                          <span className="text-sm font-bold">{receiptName}</span>
                          <span className="text-xs">اضغط لتغيير الصورة</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} />
                          <span className="text-sm font-bold">ارفع صورة الإيصال</span>
                          <span className="text-xs">PNG · JPG · حتى 5 ميجا</span>
                        </>
                      )}
                    </button>

                    {receiptImage && (
                      <img
                        src={receiptImage}
                        alt="receipt preview"
                        className="rounded-xl max-h-48 mx-auto object-contain"
                        style={{ border: '1px solid var(--border-subtle)' }}
                      />
                    )}
                  </div>

                  {submitError && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg text-sm"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)' }}
                    >
                      <AlertCircle size={14} />
                      {submitError}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !receiptImage}
                    className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    {submitting
                      ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <Crown size={16} />}
                    {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب للمراجعة'}
                  </button>

                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    سيتم مراجعة إيصالك وتفعيل الاشتراك خلال ساعات قليلة
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && !user?.is_pro && (
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)' }}
            >
              <Gift size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#22c55e' }}>
                  لديك خصم 20% جاهز!
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  سيُطبَّق تلقائياً على اشتراكك — عدد الخصومات المتاحة: {user?.discount_credits}
                </p>
              </div>
            </div>
          )}

          {/* Referral link */}
          {user && referralLink && (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <Gift size={18} style={{ color: 'var(--success)' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--success)' }}>
                  ادعُ أصدقائك واحصل على خصم 20%
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                شارك الرابط ده — أي حد يسجّل بيه هياخد خصم 20% على أول اشتراك، وإنت هتاخد خصم 20% على تجديدك الجاي.
              </p>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <Link2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span className="flex-1 text-xs font-mono truncate" style={{ color: 'var(--text-secondary)', direction: 'ltr' }}>
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-colors"
                  style={{
                    background: copied ? 'rgba(34,197,94,0.2)' : 'var(--bg-surface)',
                    color:      copied ? '#22c55e' : 'var(--text-muted)',
                    border:     '1px solid var(--border-default)',
                  }}
                >
                  <Copy size={11} />
                  {copied ? 'تم!' : 'نسخ'}
                </button>
              </div>
            </div>
          )}

          {/* Billing history */}
          {user && <BillingHistory items={history} />}
        </>
      )}
    </main>
  );
}
