import * as React from 'react';
import { Shield, AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

interface RiskMeterProps {
  level:       RiskLevel;
  atrPct?:     number;    // shown as secondary technical detail
  lang?:       'ar' | 'en';
  size?:       'sm' | 'md';
  className?:  string;
}

const riskConfig: Record<RiskLevel, {
  labelAr: string;     labelEn: string;
  descAr:  string;     descEn:  string;
  color: string; bg: string;
  icon: React.ReactNode;
  segments: number;
}> = {
  LOW: {
    labelAr: 'مخاطر منخفضة',  labelEn: 'Low Risk',
    descAr:  'السهم مستقر نسبياً',  descEn: 'Stock is relatively stable',
    color: 'var(--success)',  bg: 'var(--success-bg)',
    icon: <Shield className="w-4 h-4" />, segments: 1,
  },
  MEDIUM: {
    labelAr: 'مخاطر متوسطة',  labelEn: 'Medium Risk',
    descAr:  'تقلب طبيعي — ضع وقف خسارة',  descEn: 'Normal volatility — use stop loss',
    color: 'var(--warning)',  bg: 'var(--warning-bg)',
    icon: <AlertTriangle className="w-4 h-4" />, segments: 2,
  },
  HIGH: {
    labelAr: 'مخاطر مرتفعة',  labelEn: 'High Risk',
    descAr:  'تقلب أعلى من المعتاد — احذر',  descEn: 'Above-average volatility — caution',
    color: 'var(--error)',    bg: 'var(--error-bg)',
    icon: <ShieldAlert className="w-4 h-4" />, segments: 3,
  },
  VERY_HIGH: {
    labelAr: 'مخاطر عالية جداً',  labelEn: 'Very High Risk',
    descAr:  'تقلب شديد — مخصص للخبراء فقط',  descEn: 'Extreme volatility — experts only',
    color: '#B91C1C',  bg: 'rgba(185,28,28,0.12)',
    icon: <AlertOctagon className="w-4 h-4" />, segments: 4,
  },
};

export function RiskMeter({ level, atrPct, lang = 'ar', size = 'md', className }: RiskMeterProps) {
  const c     = riskConfig[level];
  const label = lang === 'ar' ? c.labelAr : c.labelEn;
  const desc  = lang === 'ar' ? c.descAr  : c.descEn;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-md)]',
        size === 'md' ? 'px-4 py-3' : 'px-3 py-2',
        className
      )}
      style={{ background: c.bg }}
      data-widget-id="WGT-005"
    >
      {/* Icon */}
      <span style={{ color: c.color }} className="shrink-0">{c.icon}</span>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span
          className={cn('font-bold leading-tight', size === 'md' ? 'text-sm' : 'text-xs')}
          style={{ color: c.color }}
        >
          {label}
        </span>
        <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {desc}
          {atrPct !== undefined && (
            <span className="num opacity-60 ms-1">(ATR {atrPct.toFixed(1)}%)</span>
          )}
        </span>
      </div>

      {/* Segment meter */}
      <div className="flex gap-0.5 ms-auto shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-5 rounded-sm transition-all duration-300"
            style={{
              background: i < c.segments ? c.color : 'var(--bg-overlay)',
              opacity:    i < c.segments ? (0.5 + i * 0.17) : 0.25,
            }}
          />
        ))}
      </div>
    </div>
  );
}
