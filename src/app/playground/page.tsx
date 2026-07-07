'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import {
  Button, Card, CardHeader, CardTitle, CardBody,
  Badge, RegimeBadge,
  ScoreGauge, RadarScoreDisplay,
  ScoreProgressBar, ProgressBar,
  Sparkline, MetricCard,
  Skeleton, WidgetSkeleton, ScoreSkeleton,
  EmptyState, ErrorState,
  ProGate, Tabs, TabPanel, Tooltip, LangToggle, Input,
  Modal, ModalFooter,
  PriceChangePill, MarketRegimeBanner,
  TrendStrengthBar, RiskMeter, OpportunityCard,
  SignalQualityBadge,
} from '@/design-system';

// ── Playground primitives ───────────────────────────────────────────

function PG({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex items-center gap-3 pt-8 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xl)' }} className="font-bold">{title}</h2>
        <code className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>{id}</code>
      </div>
      {children}
    </section>
  );
}

function StateGrid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="widget-label">{label}</p>
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="widget-label">{label}</p>
      <div className="flex flex-wrap gap-3 items-center">{children}</div>
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'button',    label: 'Button'    },
  { id: 'badge',     label: 'Badge'     },
  { id: 'card',      label: 'Card'      },
  { id: 'score',     label: 'Score'     },
  { id: 'gauge',     label: 'Gauge'     },
  { id: 'financial', label: 'Financial' },
  { id: 'inputs',    label: 'Input'     },
  { id: 'states',    label: 'States'    },
  { id: 'modal',     label: 'Modal'     },
];

const SPARKLINE = [44, 48, 52, 50, 55, 60, 58, 65, 62, 68, 71, 75, 72, 79, 82, 80, 85, 88];

// ── Page ─────────────────────────────────────────────────────────────

export default function Playground() {
  const [lang,       setLang]       = React.useState<'ar' | 'en'>('ar');
  const [activeTab,  setActiveTab]  = React.useState('default');
  const [modalOpen,  setModalOpen]  = React.useState(false);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen market-bg-pattern" style={{ color: 'var(--text-primary)' }}>

      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-50 px-8 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,13,24,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
            ← Showcase
          </a>
          <span className="font-bold">Component Playground</span>
          <Badge variant="new">Storybook-style</Badge>
        </div>
        <LangToggle lang={lang} onChange={setLang} />
      </div>

      <div className="flex">

        {/* ── Sidebar nav ── */}
        <nav
          className="sticky top-14 h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto p-4 space-y-1"
          style={{ borderInlineEnd: '1px solid var(--border-subtle)' }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block px-3 py-2 rounded-lg text-sm transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ── Content ── */}
        <main className="flex-1 max-w-4xl px-10 py-6 space-y-2">

          {/* ══ BUTTON ══ */}
          <PG title="Button" id="button">
            <StateGrid label="Variants">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </StateGrid>
            <StateGrid label="States">
              <Button variant="primary">Default</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </StateGrid>
            <StateGrid label="Sizes">
              <Button variant="secondary" size="sm">Small</Button>
              <Button variant="secondary" size="md">Medium</Button>
              <Button variant="secondary" size="lg">Large</Button>
            </StateGrid>
            <StateGrid label="Full Width">
              <Button variant="primary" fullWidth>اشترك الآن</Button>
            </StateGrid>
          </PG>

          {/* ══ BADGE ══ */}
          <PG title="Badge" id="badge">
            <StateGrid label="Regime Badges">
              <RegimeBadge regime="BULL" />
              <RegimeBadge regime="SIDEWAYS" />
              <RegimeBadge regime="BEAR" />
              <RegimeBadge regime="VOLATILE" />
              <RegimeBadge regime="LOW_LIQUIDITY" />
            </StateGrid>
            <StateGrid label="Semantic">
              <Badge variant="success" dot>High Quality</Badge>
              <Badge variant="warning" dot>Medium</Badge>
              <Badge variant="error"   dot>Stale Data</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="pro">PRO</Badge>
              <Badge variant="community">Community</Badge>
              <Badge variant="new">جديد</Badge>
            </StateGrid>
          </PG>

          {/* ══ CARD ══ */}
          <PG title="Card" id="card">
            <StateGrid label="Variants">
              <Card variant="default"  padding="md" className="w-48"><CardHeader><CardTitle>Default</CardTitle></CardHeader><CardBody><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Card body content</p></CardBody></Card>
              <Card variant="elevated" padding="md" className="w-48"><CardHeader><CardTitle>Elevated</CardTitle></CardHeader><CardBody><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Card body content</p></CardBody></Card>
              <Card variant="financial" padding="md" className="w-48"><CardHeader><CardTitle>Financial</CardTitle></CardHeader><CardBody><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gradient border</p></CardBody></Card>
            </StateGrid>
            <StateGrid label="Interactive (hover for lift)">
              <Card variant="default" padding="md" interactive className="w-48">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hover me → lift + shadow</p>
              </Card>
            </StateGrid>
          </PG>

          {/* ══ SCORE ══ */}
          <PG title="Radar Score" id="score">
            <StateGrid label="All Score Ranges">
              {[92, 80, 65, 50, 35, 18].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <RadarScoreDisplay score={s} size="sm" lang={lang} />
                </div>
              ))}
            </StateGrid>
            <StateGrid label="Full Hero — Score + Stars + Trend + Delta">
              <RadarScoreDisplay score={87} size="lg" lang={lang} animate trend="UP" delta={3} />
              <RadarScoreDisplay score={42} size="lg" lang={lang} animate trend="DOWN" delta={-5} />
            </StateGrid>
            <StateGrid label="Progress Bars">
              {[90, 75, 60, 45, 30].map((s) => (
                <div key={s} className="flex items-center gap-3 w-full">
                  <ScoreProgressBar score={s} size="sm" className="w-36" />
                  <span className="text-xs num" style={{ color: 'var(--text-muted)' }}>{s}</span>
                </div>
              ))}
            </StateGrid>
          </PG>

          {/* ══ GAUGE ══ */}
          <PG title="Score Gauge" id="gauge">
            <StateGrid label="Animated — Brand Signature">
              {[92, 75, 55, 30].map((s) => (
                <ScoreGauge key={s} score={s} size={130} animated showBrand />
              ))}
            </StateGrid>
            <StateGrid label="Sizes">
              <ScoreGauge score={87} size={80}  animated={false} showBrand={false} />
              <ScoreGauge score={87} size={120} animated={false} showBrand />
              <ScoreGauge score={87} size={160} animated={false} showBrand />
            </StateGrid>
          </PG>

          {/* ══ FINANCIAL ══ */}
          <PG title="Financial Components" id="financial">
            <Row label="Market Regime Banner — Bull">
              <div className="w-full">
                <MarketRegimeBanner
                  regime="BULL" confidence={78}
                  reason="مدعوم باتساع السوق وارتفاع أحجام التداول."
                  lastUpdated="منذ 18 دقيقة"
                  trend="الاتجاه: صاعد" volatility="التقلب: منخفض" breadth="الاتساع: 68%"
                  lang={lang}
                />
              </div>
            </Row>
            <Row label="Market Regime Banner — Bear">
              <div className="w-full">
                <MarketRegimeBanner
                  regime="BEAR" confidence={62}
                  reason="ضعف الاتساع وهبوط 70% من الأسهم أدنى MA50."
                  lastUpdated="منذ 22 دقيقة"
                  trend="الاتجاه: هابط" volatility="التقلب: مرتفع"
                  lang={lang}
                />
              </div>
            </Row>
            <Row label="Trend Strength Bar">
              <TrendStrengthBar strength="STRONG_UP"     adx={38} lang={lang} />
              <TrendStrengthBar strength="MODERATE_UP"   adx={26} lang={lang} />
              <TrendStrengthBar strength="FLAT"          adx={14} lang={lang} />
              <TrendStrengthBar strength="MODERATE_DOWN" adx={22} lang={lang} />
              <TrendStrengthBar strength="STRONG_DOWN"   adx={41} lang={lang} />
            </Row>
            <Row label="Risk Meter — Human Description">
              <RiskMeter level="LOW"       atrPct={1.2} lang={lang} />
              <RiskMeter level="MEDIUM"    atrPct={2.4} lang={lang} />
              <RiskMeter level="HIGH"      atrPct={3.8} lang={lang} />
              <RiskMeter level="VERY_HIGH" atrPct={5.1} lang={lang} />
            </Row>
            <Row label="Price Change Pill">
              <PriceChangePill change={2.35}  changePct={2.76}  size="sm" />
              <PriceChangePill change={2.35}  changePct={2.76}  size="md" />
              <PriceChangePill change={-1.80} changePct={-2.10} size="md" />
              <PriceChangePill change={0}     changePct={0}     size="md" />
            </Row>
            <Row label="Signal Quality Badge">
              <SignalQualityBadge quality="HIGH"   score={91} lang={lang} />
              <SignalQualityBadge quality="MEDIUM" score={64} lang={lang} />
              <SignalQualityBadge quality="LOW"    score={38} lang={lang} />
            </Row>
            <Row label="Opportunity Card — Reason + Signal History">
              <div className="grid grid-cols-2 gap-4 w-full">
                <OpportunityCard
                  symbol="COMI" nameAr="بنك القاهرة"
                  score={87} entry={87.50} tp1={92.80} tp2={97.50} sl={84.20}
                  currentPrice={88.20} changeAmt={2.35} changePct={2.73}
                  holdDays={8} signalQuality="HIGH" type="Breakout" lang={lang}
                  reason="اختراق مقاومة 87.20 مع حجم تداول أعلى من المعتاد بنسبة 2.4×"
                  signalHistory={['WIN','WIN','LOSS','WIN','WIN']}
                />
                <OpportunityCard
                  symbol="EFIH" nameAr="إي فاينانس"
                  score={52} entry={24.30} tp1={26.10} tp2={27.80} sl={23.10}
                  currentPrice={24.85} changeAmt={-0.45} changePct={-1.78}
                  holdDays={10} signalQuality="LOW" type="Momentum" lang={lang}
                  reason="زخم متراجع — انتبه لمستوى الدعم 23.50"
                  signalHistory={['WIN','LOSS','LOSS','WIN','PENDING']}
                />
              </div>
            </Row>
            <Row label="Sparklines">
              <Sparkline data={SPARKLINE} width={120} height={48} />
              <Sparkline data={[...SPARKLINE].reverse()} width={120} height={48} />
            </Row>
          </PG>

          {/* ══ INPUTS ══ */}
          <PG title="Input" id="inputs">
            <StateGrid label="States">
              <Input label="بحث عن سهم" placeholder="مثلاً: COMI أو البنك التجاري" className="w-64" />
              <Input label="مع خطأ" placeholder="اكتب هنا" error="هذا الحقل مطلوب" className="w-64" />
              <Input label="مع تلميح" placeholder="اكتب هنا" hint="يمكنك البحث بالاسم أو الكود" className="w-64" />
              <Input label="Disabled" placeholder="غير متاح" disabled className="w-64" />
            </StateGrid>
            <StateGrid label="Tabs">
              <div className="w-full space-y-4">
                <Tabs
                  tabs={[
                    { id: 'default', label: 'الملخص' },
                    { id: 'chart',   label: 'الرسم البياني', badge: 'PRO' },
                    { id: 'news',    label: 'الأخبار', badge: 3 },
                  ]}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />
                <TabPanel id="default" activeId={activeTab}>
                  <p className="text-sm p-2" style={{ color: 'var(--text-muted)' }}>محتوى تبويب الملخص</p>
                </TabPanel>
                <TabPanel id="chart" activeId={activeTab}>
                  <p className="text-sm p-2" style={{ color: 'var(--text-muted)' }}>الرسم البياني — PRO</p>
                </TabPanel>
                <TabPanel id="news" activeId={activeTab}>
                  <p className="text-sm p-2" style={{ color: 'var(--text-muted)' }}>آخر 3 أخبار</p>
                </TabPanel>
              </div>
            </StateGrid>
            <StateGrid label="Tooltip">
              <Tooltip content="درجة Radar = مجموع 6 عوامل مرجحة" placement="top">
                <Button variant="secondary" size="sm">ما هي درجة Radar؟</Button>
              </Tooltip>
              <Tooltip content="ATR = متوسط المدى الحقيقي — مقياس التقلب" placement="bottom">
                <Badge variant="warning">ATR 2.4%</Badge>
              </Tooltip>
            </StateGrid>
          </PG>

          {/* ══ STATES ══ */}
          <PG title="Loading, Empty & Error States" id="states">
            <StateGrid label="Skeletons — Shimmer">
              <WidgetSkeleton rows={3} />
              <ScoreSkeleton />
              <div className="space-y-2 w-48">
                <Skeleton height={16} width="60%" />
                <Skeleton height={40} />
                <Skeleton height={12} width="80%" />
              </div>
            </StateGrid>
            <StateGrid label="Empty States">
              <EmptyState scenario="no-opportunities" lang={lang} action={{ label: lang === 'ar' ? 'عرض الكل' : 'View All', onClick: () => {} }} className="w-72" />
              <EmptyState scenario="no-watchlist" lang={lang} action={{ label: lang === 'ar' ? 'إضافة سهم' : 'Add Stock', onClick: () => {} }} className="w-72" />
            </StateGrid>
            <StateGrid label="Error States">
              <ErrorState scenario="network" lang={lang} onRetry={() => {}} className="w-72" />
              <ErrorState scenario="stale-data" lang={lang} onRetry={() => {}} className="w-72" />
            </StateGrid>
            <StateGrid label="Pro Gate">
              <ProGate locked onUpgrade={() => {}} className="w-80">
                <Card padding="md">
                  <RiskMeter level="LOW" atrPct={1.2} lang={lang} />
                </Card>
              </ProGate>
            </StateGrid>
          </PG>

          {/* ══ MODAL ══ */}
          <PG title="Modal" id="modal">
            <StateGrid label="Dialog">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>فتح نافذة تأكيد</Button>
            </StateGrid>
          </PG>

          <div className="pb-20" />
        </main>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="تأكيد الإجراء" size="sm">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          هل تريد حذف هذه الصفقة من محفظتك؟
        </p>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>إلغاء</Button>
          <Button variant="danger" size="sm" onClick={() => setModalOpen(false)}>حذف</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
