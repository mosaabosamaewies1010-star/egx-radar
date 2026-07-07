import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MetricCardProps {
  label:     string;
  value:     string | number;
  change?:   number;       // % change (positive = up, negative = down)
  prefix?:   string;
  suffix?:   string;
  sublabel?: string;
  size?:     'sm' | 'md';
  className?: string;
  widgetId?: string;
}

export function MetricCard({
  label,
  value,
  change,
  prefix,
  suffix,
  sublabel,
  size = 'md',
  className,
  widgetId,
}: MetricCardProps) {
  const isUp   = change !== undefined && change > 0;
  const isDown = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        size === 'md' ? 'p-3' : 'p-2',
        className
      )}
      data-widget-id={widgetId}
    >
      <span className={cn(
        'text-[var(--text-muted)] font-medium truncate',
        size === 'md' ? 'text-xs' : 'text-[10px]'
      )}>
        {label}
      </span>

      <span className={cn(
        'font-bold tabular-nums num text-[var(--text-primary)]',
        size === 'md' ? 'text-xl' : 'text-base'
      )}>
        {prefix}{value}{suffix}
      </span>

      {sublabel && (
        <span className="text-[10px] text-[var(--text-muted)] truncate">{sublabel}</span>
      )}

      {change !== undefined && (
        <span className={cn(
          'flex items-center gap-0.5 text-xs font-medium num',
          isUp   && 'text-[var(--success)]',
          isDown && 'text-[var(--error)]',
          !isUp && !isDown && 'text-[var(--text-muted)]'
        )}>
          {isUp   && <TrendingUp   className="w-3 h-3" />}
          {isDown && <TrendingDown className="w-3 h-3" />}
          {!isUp && !isDown && <Minus className="w-3 h-3" />}
          {Math.abs(change).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

/** Grid of metric cards — commonly used in StockSnapshot */
export function MetricGrid({
  metrics,
  cols = 3,
  className,
}: {
  metrics: MetricCardProps[];
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const colsMap = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5' };
  return (
    <div className={cn('grid gap-1 divide-x divide-[var(--border-subtle)]', colsMap[cols], className)}>
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} size="sm" />
      ))}
    </div>
  );
}
