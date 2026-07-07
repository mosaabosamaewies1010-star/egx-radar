'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getScoreStars, getScoreLabelAr, getScoreLabelEn, getScoreColor } from '@/design-system/tokens';

interface StarsRatingProps {
  stars?:    number;
  score?:    number;
  size?:     'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap   = { sm: 'text-sm gap-0.5', md: 'text-base gap-0.5', lg: 'text-xl gap-1' };
const starColor = '#F59E0B';

export function StarsRating({ stars, score, size = 'md', className }: StarsRatingProps) {
  const resolved = stars ?? (score !== undefined ? getScoreStars(score) : 0);
  return (
    <span
      className={cn('inline-flex items-center', sizeMap[size], className)}
      aria-label={`${resolved} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = resolved >= i + 1;
        const half   = !filled && resolved >= i + 0.5;
        return (
          <span key={i} aria-hidden="true" style={{ color: filled || half ? starColor : 'var(--text-disabled)' }}>
            {filled ? '★' : half ? '⯨' : '☆'}
          </span>
        );
      })}
    </span>
  );
}

export type TrendDirection = 'UP' | 'DOWN' | 'FLAT';

interface RadarScoreDisplayProps {
  score:         number;
  size?:         'sm' | 'md' | 'lg';
  lang?:         'ar' | 'en';
  animate?:      boolean;
  trend?:        TrendDirection;
  trendLabel?:   string;
  /** Change in score since yesterday (e.g. +3 or -2) */
  delta?:        number;
  className?:    string;
}

const scoreFontMap  = { sm: 40, md: 56, lg: 72 };
const labelSizeMap  = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function RadarScoreDisplay({
  score,
  size        = 'md',
  lang        = 'ar',
  animate     = false,
  trend,
  trendLabel,
  delta,
  className,
}: RadarScoreDisplayProps) {
  const [display, setDisplay] = React.useState(animate ? 0 : score);
  const color = getScoreColor(score);
  const label = lang === 'ar' ? getScoreLabelAr(score) : getScoreLabelEn(score);

  React.useEffect(() => {
    if (!animate) { setDisplay(score); return; }
    let step = 0;
    const steps = 40;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setDisplay(Math.round(ease * score));
      if (step >= steps) clearInterval(timer);
    }, 700 / steps);
    return () => clearInterval(timer);
  }, [score, animate]);

  const trendColor = trend === 'UP' ? 'var(--success)' : trend === 'DOWN' ? 'var(--error)' : 'var(--text-muted)';

  const defaultTrendLabel = trend === 'UP'
    ? (lang === 'ar' ? '↑ صاعد'  : '↑ Bullish')
    : trend === 'DOWN'
    ? (lang === 'ar' ? '↓ هابط'  : '↓ Bearish')
    : (lang === 'ar' ? '→ عرضي'  : '→ Sideways');

  const deltaColor = delta && delta > 0 ? 'var(--success)' : delta && delta < 0 ? 'var(--error)' : 'var(--text-muted)';
  const deltaStr   = delta !== undefined
    ? `${delta > 0 ? '+' : ''}${delta} ${lang === 'ar' ? 'منذ أمس' : 'since yesterday'}`
    : null;

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)} data-widget-id="WGT-002">

      {/* Score number */}
      <span className="font-black num tabular-nums" style={{ color, fontSize: scoreFontMap[size], lineHeight: 1 }}>
        {display}
      </span>

      {/* Stars */}
      <StarsRating score={score} size={size === 'lg' ? 'lg' : 'md'} />

      {/* Label */}
      <span className={cn('font-bold', labelSizeMap[size])} style={{ color }}>
        {label}
      </span>

      {/* Trend */}
      {trend && (
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: trendColor }}>
          {trend === 'UP'   && <TrendingUp   className="w-3.5 h-3.5" />}
          {trend === 'DOWN' && <TrendingDown className="w-3.5 h-3.5" />}
          {trend === 'FLAT' && <Minus         className="w-3.5 h-3.5" />}
          {trendLabel ?? defaultTrendLabel}
        </span>
      )}

      {/* Delta since yesterday */}
      {deltaStr && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            color:      deltaColor,
            background: delta && delta > 0
              ? 'rgba(22,163,74,0.1)'
              : delta && delta < 0
              ? 'rgba(220,38,38,0.1)'
              : 'var(--bg-overlay)',
          }}
        >
          {deltaStr}
        </span>
      )}
    </div>
  );
}
