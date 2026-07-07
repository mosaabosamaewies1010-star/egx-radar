'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content:    React.ReactNode;
  children:   React.ReactNode;
  placement?: TooltipPlacement;
  delay?:     number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 300,
  className,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  const posMap: Record<TooltipPlacement, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 me-2',
    right:  'left-full  top-1/2 -translate-y-1/2 ms-2',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-[var(--z-tooltip)] pointer-events-none whitespace-nowrap',
            'bg-[var(--bg-overlay)] border border-[var(--border-default)]',
            'text-xs text-[var(--text-primary)] rounded-[var(--radius-sm)] px-2.5 py-1.5',
            'shadow-[var(--shadow-md)] fade-in',
            posMap[placement],
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
