import * as React from 'react';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;      // 0–100
  max?: number;
  color?: string;     // CSS color value
  size?: 'xs' | 'sm' | 'md';
  animated?: boolean;
  className?: string;
  label?: string;
}

const heightMap = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' };

export function ProgressBar({
  value,
  max = 100,
  color,
  size = 'sm',
  animated = false,
  className,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn('w-full bg-[var(--bg-overlay)] rounded-[var(--radius-full)] overflow-hidden', heightMap[size], className)}
    >
      <div
        className={cn(
          'h-full rounded-[var(--radius-full)] transition-all duration-700 ease-out',
          animated && 'animate-pulse'
        )}
        style={{
          width:           `${pct}%`,
          backgroundColor: color ?? 'var(--accent-primary)',
        }}
      />
    </div>
  );
}

/** Progress bar that auto-colors based on a score value */
export function ScoreProgressBar({
  score,
  ...props
}: Omit<ProgressBarProps, 'value' | 'color'> & { score: number }) {
  function colorFor(s: number) {
    if (s >= 90) return '#22C55E';
    if (s >= 75) return '#00C9A7';
    if (s >= 60) return '#3B82F6';
    if (s >= 45) return '#F59E0B';
    if (s >= 30) return '#EF4444';
    return '#991B1B';
  }
  return <ProgressBar value={score} color={colorFor(score)} {...props} />;
}
