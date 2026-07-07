import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PriceChangePillProps {
  change:     number;   // absolute change
  changePct:  number;   // % change
  currency?:  string;
  size?:      'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceChangePill({
  change,
  changePct,
  currency = 'ج',
  size = 'md',
  className,
}: PriceChangePillProps) {
  const isUp   = changePct > 0;
  const isDown = changePct < 0;
  const color  = isUp ? 'var(--success)' : isDown ? 'var(--error)' : 'var(--text-muted)';
  const bg     = isUp ? 'var(--success-bg)' : isDown ? 'var(--error-bg)' : 'var(--bg-overlay)';

  const sizeMap = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold num rounded-[var(--radius-full)]',
        sizeMap[size],
        className
      )}
      style={{ color, background: bg }}
    >
      {isUp   && <TrendingUp   className="w-3.5 h-3.5 shrink-0" />}
      {isDown && <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
      {!isUp && !isDown && <Minus className="w-3.5 h-3.5 shrink-0" />}
      {isUp ? '+' : ''}{change.toFixed(2)}{currency}
      <span className="opacity-75">({isUp ? '+' : ''}{changePct.toFixed(2)}%)</span>
    </span>
  );
}
