import * as React from 'react';
import { Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { RegimeType } from '@/design-system/tokens';

interface MarketRegimeBannerProps {
  regime:      RegimeType;
  confidence:  number;         // 0-100
  reason?:     string;         // "مدعوم باتساع السوق وارتفاع السيولة"
  lastUpdated?: string;        // "منذ 20 دقيقة"
  trend?:      string;
  volatility?: string;
  breadth?:    string;
  lang?:       'ar' | 'en';
  className?:  string;
}

const regimeConfig: Record<RegimeType, {
  labelAr: string; labelEn: string;
  color: string; bg: string; borderColor: string;
}> = {
  BULL:          { labelAr: '↑ سوق ثوري',      labelEn: '↑ Bull Market',     color: 'var(--regime-bull)',     bg: 'var(--regime-bull-bg)',     borderColor: 'var(--regime-bull)'     },
  SIDEWAYS:      { labelAr: '→ سوق عرضي',       labelEn: '→ Sideways',        color: 'var(--regime-side)',     bg: 'var(--regime-side-bg)',     borderColor: 'var(--regime-side)'     },
  BEAR:          { labelAr: '↓ سوق هابط',       labelEn: '↓ Bear Market',     color: 'var(--regime-bear)',     bg: 'var(--regime-bear-bg)',     borderColor: 'var(--regime-bear)'     },
  VOLATILE:      { labelAr: '⚡ سوق متقلب',      labelEn: '⚡ Volatile',        color: 'var(--regime-volatile)', bg: 'var(--regime-vol-bg)',      borderColor: 'var(--regime-volatile)' },
  LOW_LIQUIDITY: { labelAr: '⬇ سيولة منخفضة',  labelEn: '⬇ Low Liquidity',   color: 'var(--regime-lowliq)',   bg: 'var(--regime-lowliq-bg)',   borderColor: 'var(--regime-lowliq)'   },
};

export function MarketRegimeBanner({
  regime, confidence, reason, lastUpdated,
  trend, volatility, breadth,
  lang = 'ar', className,
}: MarketRegimeBannerProps) {
  const c = regimeConfig[regime];
  const label = lang === 'ar' ? c.labelAr : c.labelEn;
  const subMetrics = [trend, volatility, breadth].filter(Boolean).join(' · ');
  const confidenceLabel = lang === 'ar' ? 'الثقة' : 'Confidence';

  return (
    <div
      className={cn('rounded-[var(--radius-lg)] px-5 py-4 border-s-4 space-y-3', className)}
      style={{ background: c.bg, borderColor: c.borderColor }}
      data-widget-id="WGT-004"
      data-regime={regime}
    >
      {/* Top row: label + confidence */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 shrink-0" style={{ color: c.color }} />
          <div>
            <p className="text-base font-bold" style={{ color: c.color }}>{label}</p>
            {subMetrics && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subMetrics}</p>
            )}
          </div>
        </div>

        {/* Confidence */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-xs widget-label">{confidenceLabel}</span>
          <span className="text-xl font-black num" style={{ color: c.color }}>{confidence}%</span>
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${confidence}%`, background: c.color }}
            />
          </div>
        </div>
      </div>

      {/* Reason */}
      {reason && (
        <p
          className="text-sm border-t pt-3"
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {reason}
        </p>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Clock className="w-3 h-3" />
          <span className="text-xs">{lastUpdated}</span>
        </div>
      )}
    </div>
  );
}
