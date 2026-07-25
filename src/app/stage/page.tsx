'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Filter, Eye } from 'lucide-react';
import { AppNav } from '@/components';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { StageSignal } from '@/lib/types';
import {
  Card, CardBody,
  Badge,
  WidgetSkeleton, EmptyState, ErrorState,
} from '@/design-system';
import { track } from '@/lib/analytics';
import { usePageView } from '@/lib/useAnalytics';

function StageCard({ item, rank }: { item: StageSignal; rank: number }) {
  const isStrong = item.opp_type === 'STAGE_STRONG';
  const accent   = isStrong ? '#a78bfa' : '#8b5cf6';
  const rr       = item.rr_ratio;
  const ageWks   = (item.vol_age_bars / 5).toFixed(1);

  return (
    <Link
      href={`/stocks/${item.symbol}`}
      onClick={() => track('stage_detail_clicked', { symbol: item.symbol, type: item.opp_type, rank })}
      className="block rounded-2xl p-5 transition-colors"
      style={{ background: 'var(--bg-surface)', border: `1px solid color-mix(in srgb, ${accent} 25%, var(--border-subtle))` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-lg" style={{ color: accent }}>{item.symbol}</span>
            {item.is_sharia && <Badge variant="success">شريعة</Badge>}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: isStrong ? 'rgba(167,139,250,0.2)' : 'rgba(139,92,246,0.15)', color: accent }}
            >
              {isStrong ? '🚀 STRONG' : '📈 في التطور'}
            </span>
          </div>
          <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{item.name_ar}</p>
        </div>

        <div className="text-end shrink-0">
          <div className="text-2xl font-black" style={{ color: accent }}>{item.radar_score.toFixed(0)}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>نقطة</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>عمر الحجم</p>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{ageWks} أسبوع</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>R/R</p>
          <p className="font-bold text-sm" style={{ color: 'var(--success)' }}>{rr != null ? `${rr.toFixed(1)}:1` : '—'}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>دخول</p>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.entry_price?.toFixed(2) ?? '—'}</p>
        </div>
      </div>

      {(item.tp1_price || item.sl_price) && (
        <div className="flex items-center gap-4 mt-3 text-xs">
          {item.tp1_price && (
            <span style={{ color: 'var(--success)' }}>▲ هدف {item.tp1_price.toFixed(2)}</span>
          )}
          {item.tp2_price && (
            <span style={{ color: 'var(--success)' }}>▲▲ {item.tp2_price.toFixed(2)}</span>
          )}
          {item.sl_price && (
            <span style={{ color: 'var(--error)' }}>▼ وقف {item.sl_price.toFixed(2)}</span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function StagePage() {
  const { shariaFilter, setShariaFilter } = useAppStore();
  usePageView();

  const [items,      setItems]      = useState<StageSignal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (sharia = shariaFilter) => {
    try {
      setError(null);
      const data = await api.getStageBreakouts({ sharia, limit: 50 });
      setItems(data.items);
    } catch {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shariaFilter]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => { setRefreshing(true); load(); };

  const handleShariaToggle = () => {
    const next = !shariaFilter;
    setShariaFilter(next);
    setLoading(true);
    load(next);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🚀</span>
              <h1 className="font-black text-xl">Stage Breakout</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                ⭐⭐⭐⭐⭐
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              كسر اتجاه مع سبايك حجم سابق — PF 2.08 · {items.length} إشارة نشطة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShariaToggle}
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
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div
          className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
        >
          <Eye size={16} className="mt-0.5 shrink-0" style={{ color: '#a78bfa' }} />
          <div className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: '#a78bfa' }}>منطق Stage Breakout:</strong> كسر EMA20 فوق EMA50 اليوم، مع وجود سبايك حجم (RVOL ≥ 1.8) في آخر 60 شمعة (12 أسبوع).
            هذا يعني أن الحجم الكبير جاء أولاً ثم كسر الاتجاه — أعلى إشارة جودة في النظام.
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <WidgetSkeleton rows={3} />
              </div>
            ))}
          </div>
        ) : error ? (
          <Card padding="md">
            <ErrorState scenario="network" lang="ar" onRetry={handleRefresh} />
          </Card>
        ) : items.length === 0 ? (
          <Card padding="md">
            <CardBody>
              <EmptyState scenario="no-opportunities" lang="ar" />
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item, idx) => (
              <StageCard key={item.id} item={item} rank={idx + 1} />
            ))}
          </div>
        )}

        <p
          className="text-center mt-8 pb-4"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}
        >
          ⚠️ البيانات للأغراض التعليمية فقط — ليست نصيحة استثمارية
        </p>
      </main>
    </div>
  );
}
