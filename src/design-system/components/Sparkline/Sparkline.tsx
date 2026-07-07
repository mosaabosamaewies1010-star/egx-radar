import * as React from 'react';
import { cn } from '@/lib/cn';

interface SparklineProps {
  data:        number[];
  width?:      number;
  height?:     number;
  strokeWidth?: number;
  className?:  string;
}

export function Sparkline({
  data,
  width  = 80,
  height = 32,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075;
    return `${x},${y}`;
  });

  const pathD   = `M ${points.join(' L ')}`;
  const areaD   = `M ${points[0]} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;
  const isUp    = data[data.length - 1] >= data[0];
  const color   = isUp ? 'var(--chart-up)' : 'var(--chart-down)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-grad-${width}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0"  />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${width})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
