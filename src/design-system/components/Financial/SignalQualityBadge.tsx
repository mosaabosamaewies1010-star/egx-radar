import * as React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SignalQuality = 'HIGH' | 'MEDIUM' | 'LOW';

interface SignalQualityBadgeProps {
  quality:    SignalQuality;
  score?:     number;    // 0-100 data quality score
  lang?:      'ar' | 'en';
  className?: string;
}

const qualityConfig: Record<SignalQuality, {
  labelAr: string; labelEn: string;
  color: string; bg: string; border: string;
}> = {
  HIGH:   { labelAr: 'إشارة قوية',     labelEn: 'Strong Signal',  color: 'var(--success)', bg: 'var(--success-bg)', border: 'rgba(22,163,74,0.3)'   },
  MEDIUM: { labelAr: 'إشارة متوسطة',   labelEn: 'Fair Signal',    color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(217,119,6,0.3)'   },
  LOW:    { labelAr: 'إشارة ضعيفة',    labelEn: 'Weak Signal',    color: 'var(--error)',   bg: 'var(--error-bg)',   border: 'rgba(220,38,38,0.3)'   },
};

export function SignalQualityBadge({ quality, score, lang = 'ar', className }: SignalQualityBadgeProps) {
  const c     = qualityConfig[quality];
  const label = lang === 'ar' ? c.labelAr : c.labelEn;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)]',
        'text-xs font-semibold border',
        className
      )}
      style={{ color: c.color, background: c.bg, borderColor: c.border }}
    >
      <Zap className="w-3 h-3" />
      {label}
      {score !== undefined && (
        <span className="opacity-70 num">({score}%)</span>
      )}
    </span>
  );
}
