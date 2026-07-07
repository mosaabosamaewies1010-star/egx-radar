'use client';

import * as React from 'react';
import { getScoreColor } from '@/design-system/tokens';
import { cn } from '@/lib/cn';

interface ScoreGaugeProps {
  score:      number;
  size?:      number;
  thickness?: number;
  className?: string;
  showLabel?: boolean;
  animated?:  boolean;
  widgetId?:  string;
  /** Brand mark: show subtle "R" watermark inside */
  showBrand?: boolean;
}

export function ScoreGauge({
  score,
  size      = 150,
  thickness = 15,
  className,
  showLabel = true,
  animated  = true,
  widgetId  = 'WGT-002',
  showBrand = true,
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = React.useState(animated ? 0 : score);
  const [dashFill,     setDashFill]     = React.useState(0);
  const clampedScore = Math.min(100, Math.max(0, score));
  const color        = getScoreColor(clampedScore);

  const cx  = size / 2;
  const cy  = size / 2;
  const r   = (size - thickness * 2) / 2 - 4;
  const r2  = r - thickness - 6;   // inner tick ring radius
  const circumference = 2 * Math.PI * r;
  const totalArc   = 270;
  const startAngle = 135;
  const rotation   = startAngle - 90;
  const targetFill = (clampedScore / 100) * totalArc;
  const trackDash  = (totalArc / 360) * circumference;

  // Count-up animation
  React.useEffect(() => {
    if (!animated) { setDisplayScore(clampedScore); setDashFill(targetFill); return; }
    const duration = 900;
    const steps    = 50;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const t = step / steps;
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayScore(Math.round(ease * clampedScore));
      setDashFill(ease * targetFill);
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [clampedScore, targetFill, animated]);

  const fillDash = (dashFill / 360) * circumference;

  // Gradient IDs (unique per instance)
  const gradId = `gg-${widgetId}-${size}`;
  const glowId = `gf-${widgetId}-${size}`;

  // Second color for gradient
  const gradEnd = clampedScore >= 60 ? '#00D4B4' : '#991B1B';

  // Tick mark positions (every 10 units = 27°)
  const tickAngles = Array.from({ length: 11 }, (_, i) => {
    const deg = startAngle + i * (totalArc / 10);
    const rad = (deg * Math.PI) / 180;
    return { rad, isActive: i <= Math.round(clampedScore / 10) };
  });

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      data-widget-id={widgetId}
      role="img"
      aria-label={`Radar Score: ${clampedScore}`}
    >
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={gradEnd}   />
            <stop offset="100%" stopColor={color}      />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--bg-overlay)"
          strokeWidth={thickness}
          strokeDasharray={`${trackDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />

        {/* Glow layer */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness + 6}
          strokeDasharray={`${fillDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
          opacity="0.18"
          filter={`url(#${glowId})`}
        />

        {/* Main fill arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          strokeDasharray={`${fillDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />

        {/* Tick marks — EGX Radar brand signature */}
        {tickAngles.map(({ rad, isActive }, i) => {
          const inner = r2 - 3;
          const outer = r2 + 3;
          const x1 = cx + inner * Math.cos(rad);
          const y1 = cy + inner * Math.sin(rad);
          const x2 = cx + outer * Math.cos(rad);
          const y2 = cy + outer * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isActive ? color : 'var(--border-default)'}
              strokeWidth={i % 5 === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
              opacity={isActive ? 0.9 : 0.35}
            />
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.6} />

        {/* Brand watermark "R" */}
        {showBrand && (
          <text
            x={cx} y={cy + r2 - 10}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill={color}
            opacity={0.25}
            fontFamily="Inter, sans-serif"
          >
            RADAR
          </text>
        )}
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span
            className="font-black num tabular-nums"
            style={{ color, fontSize: size * 0.27, lineHeight: 1 }}
          >
            {displayScore}
          </span>
        </div>
      )}
    </div>
  );
}
