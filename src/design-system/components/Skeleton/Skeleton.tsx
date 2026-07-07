import * as React from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'sm',
  style,
  ...props
}: SkeletonProps) {
  const radiusMap = {
    sm:   'var(--radius-sm)',
    md:   'var(--radius-md)',
    lg:   'var(--radius-lg)',
    full: 'var(--radius-full)',
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn('skeleton', className)}
      style={{
        width:        width,
        height:       height,
        borderRadius: radiusMap[rounded],
        ...style,
      }}
      {...props}
    />
  );
}

/** Pre-built skeleton for a full widget card */
export function WidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3" role="status" aria-label="Loading widget...">
      <Skeleton height={16} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={14} width={`${70 + i * 5}%`} />
      ))}
    </div>
  );
}

/** Skeleton for score display (WGT-002) */
export function ScoreSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-label="Loading score...">
      <Skeleton width={80} height={64} rounded="md" />
      <Skeleton width={60} height={16} rounded="sm" />
      <Skeleton width={48} height={12} rounded="sm" />
    </div>
  );
}

/** Skeleton for metric row */
export function MetricRowSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-3`} role="status">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton height={10} width="60%" />
          <Skeleton height={20} width="80%" />
        </div>
      ))}
    </div>
  );
}
