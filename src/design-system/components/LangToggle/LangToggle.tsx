'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface LangToggleProps {
  lang:      'ar' | 'en';
  onChange:  (lang: 'ar' | 'en') => void;
  className?: string;
}

export function LangToggle({ lang, onChange, className }: LangToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius-md)] p-0.5',
        'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      {(['ar', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)]',
            'transition-all duration-[var(--transition-fast)]',
            lang === l
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          {l === 'ar' ? 'عربي' : 'EN'}
        </button>
      ))}
    </div>
  );
}
