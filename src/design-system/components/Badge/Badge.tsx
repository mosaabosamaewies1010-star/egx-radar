import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { RegimeType } from '@/design-system/tokens';
import { getScoreColorClass } from '@/design-system/tokens';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold rounded-[var(--radius-full)] select-none',
  {
    variants: {
      variant: {
        default:   'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] px-3 py-1 text-xs',
        bull:      'bg-[var(--regime-bull-bg)]     text-[var(--regime-bull)]     px-3 py-1 text-xs',
        sideways:  'bg-[var(--regime-side-bg)]     text-[var(--regime-side)]     px-3 py-1 text-xs',
        bear:      'bg-[var(--regime-bear-bg)]     text-[var(--regime-bear)]     px-3 py-1 text-xs',
        volatile:  'bg-[var(--regime-vol-bg)]      text-[var(--regime-volatile)] px-3 py-1 text-xs',
        lowliq:    'bg-[var(--regime-lowliq-bg)]   text-[var(--regime-lowliq)]   px-3 py-1 text-xs',
        success:   'bg-[var(--success-bg)] text-[var(--success)] px-3 py-1 text-xs',
        warning:   'bg-[var(--warning-bg)] text-[var(--warning)] px-3 py-1 text-xs',
        error:     'bg-[var(--error-bg)]   text-[var(--error)]   px-3 py-1 text-xs',
        info:      'bg-[var(--info-bg)]    text-[var(--info)]    px-3 py-1 text-xs',
        // PRO — prominent gold gradient
        pro: [
          'bg-gradient-to-r from-amber-500/25 to-amber-400/15',
          'text-amber-400 border border-amber-500/40',
          'px-3.5 py-1.5 text-[11px] tracking-wide uppercase',
          'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        ],
        // Community — subtle blue
        community: [
          'bg-blue-500/10 text-blue-400 border border-blue-500/25',
          'px-3 py-1 text-xs',
        ],
        visitor:   'bg-[var(--bg-overlay)] text-[var(--text-muted)] px-3 py-1 text-xs',
        new:       'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-current live-pulse"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export function RegimeBadge({ regime }: { regime: RegimeType }) {
  const map: Record<RegimeType, { labelAr: string; variant: BadgeProps['variant'] }> = {
    BULL:          { labelAr: '↑ ثوري',          variant: 'bull'     },
    SIDEWAYS:      { labelAr: '→ عرضي',           variant: 'sideways' },
    BEAR:          { labelAr: '↓ هابط',          variant: 'bear'     },
    VOLATILE:      { labelAr: '⚡ متقلب',          variant: 'volatile' },
    LOW_LIQUIDITY: { labelAr: '⬇ سيولة منخفضة',  variant: 'lowliq'   },
  };
  const { labelAr, variant } = map[regime];
  return <Badge variant={variant} dot>{labelAr}</Badge>;
}

export function ScoreBadge({ score }: { score: number }) {
  const colorClass = getScoreColorClass(score);
  return (
    <span className={cn('inline-flex items-center font-bold text-sm tabular-nums num', colorClass)}>
      {score}
    </span>
  );
}
