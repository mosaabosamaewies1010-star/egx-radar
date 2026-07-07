'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface Tab {
  id:    string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs:         Tab[];
  activeTab:    string;
  onChange:     (id: string) => void;
  variant?:     'underline' | 'pills';
  className?:   string;
  widgetId?:    string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
  widgetId,
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1',
        variant === 'underline' && 'border-b border-[var(--border-subtle)]',
        className
      )}
      data-widget-id={widgetId}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium px-3 py-2',
              'transition-all duration-[var(--transition-fast)]',
              'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              variant === 'underline' && [
                'border-b-2 -mb-px',
                isActive
                  ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ],
              variant === 'pills' && [
                'rounded-[var(--radius-md)]',
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]',
              ]
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[var(--bg-overlay)] text-[var(--text-muted)]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id:       string;
  activeId: string;
}

export function TabPanel({ id, activeId, children, className, ...props }: TabPanelProps) {
  if (id !== activeId) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      className={cn('fade-in', className)}
      {...props}
    >
      {children}
    </div>
  );
}
