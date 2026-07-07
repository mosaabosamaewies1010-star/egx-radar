import * as React from 'react';
import { cn } from '@/lib/cn';

type TrendStrength = 'STRONG_UP' | 'MODERATE_UP' | 'FLAT' | 'MODERATE_DOWN' | 'STRONG_DOWN';

interface TrendStrengthBarProps {
  strength:   TrendStrength;
  adx?:       number;
  lang?:      'ar' | 'en';
  className?: string;
}

const strengthConfig: Record<TrendStrength, {
  labelAr: string; labelEn: string;
  color: string; bars: number; direction: 'up' | 'down' | 'flat';
}> = {
  STRONG_UP:     { labelAr: 'صاعد قوي',    labelEn: 'Strong Uptrend',    color: 'var(--success)', bars: 5, direction: 'up'   },
  MODERATE_UP:   { labelAr: 'صاعد',         labelEn: 'Uptrend',           color: '#4ADE80',        bars: 3, direction: 'up'   },
  FLAT:          { labelAr: 'عرضي',         labelEn: 'Flat / Sideways',   color: 'var(--warning)', bars: 1, direction: 'flat' },
  MODERATE_DOWN: { labelAr: 'هابط',         labelEn: 'Downtrend',         color: '#F87171',        bars: 3, direction: 'down' },
  STRONG_DOWN:   { labelAr: 'هابط قوي',     labelEn: 'Strong Downtrend',  color: 'var(--error)',   bars: 5, direction: 'down' },
};

export function TrendStrengthBar({
  strength,
  adx,
  lang = 'ar',
  className,
}: TrendStrengthBarProps) {
  const c = strengthConfig[strength];
  const label = lang === 'ar' ? c.labelAr : c.labelEn;
  const totalBars = 5;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Bar indicator */}
      <div className="flex items-end gap-0.5 h-5">
        {Array.from({ length: totalBars }).map((_, i) => {
          const active = i < c.bars;
          const height = 8 + i * 4; // staircase: 8,12,16,20,24px
          return (
            <div
              key={i}
              className="w-2 rounded-sm transition-all duration-300"
              style={{
                height,
                background: active ? c.color : 'var(--bg-overlay)',
                opacity:    active ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-semibold" style={{ color: c.color }}>{label}</span>
        {adx !== undefined && (
          <span className="text-xs text-[var(--text-muted)] num">ADX {adx}</span>
        )}
      </div>
    </div>
  );
}
