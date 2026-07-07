'use client';

import * as React from 'react';
import { Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ProGateProps {
  children:   React.ReactNode;
  locked?:    boolean;
  reason?:    string;
  onUpgrade?: () => void;
  className?: string;
  lang?:      'ar' | 'en';
}

export function ProGate({
  children,
  locked = true,
  reason,
  onUpgrade,
  className,
  lang = 'ar',
}: ProGateProps) {
  if (!locked) return <>{children}</>;

  const headingAr = 'هذا المحتوى للمشتركين PRO';
  const headingEn = 'PRO Subscribers Only';
  const subAr     = reason ?? 'اشترك بـ 299 جنيه/شهر للوصول الكامل.';
  const subEn     = reason ?? 'Subscribe for 299 EGP/month for full access.';
  const btnAr     = 'ترقية إلى PRO';
  const btnEn     = 'Upgrade to PRO';

  const heading = lang === 'ar' ? headingAr : headingEn;
  const sub     = lang === 'ar' ? subAr     : subEn;
  const btn     = lang === 'ar' ? btnAr     : btnEn;

  return (
    <div className={cn('relative rounded-[var(--radius-lg)] overflow-hidden', className)}>
      {/* Blurred content */}
      <div className="select-none pointer-events-none" aria-hidden="true">
        <div className="blur-sm opacity-40 saturate-0">{children}</div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-base)]/70 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 text-amber-400">
            <Lock className="w-5 h-5" />
          </span>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{heading}</p>
          <p className="text-xs text-[var(--text-muted)] max-w-[200px]">{sub}</p>
        </div>

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)]',
              'bg-gradient-to-r from-amber-500 to-amber-400',
              'text-xs font-bold text-black',
              'hover:opacity-90 active:scale-[0.98] transition-all',
              'shadow-[0_0_16px_rgba(245,158,11,0.3)]'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            {btn}
          </button>
        )}
      </div>
    </div>
  );
}
