'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?:  string;
  error?: string;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
  widgetId?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, hint, error, leftIcon, rightIcon, widgetId, id, ...props },
    ref
  ) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute start-3 text-[var(--text-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            data-widget-id={widgetId}
            className={cn(
              'w-full h-10 rounded-[var(--radius-md)]',
              'bg-[var(--bg-input)] border border-[var(--border-default)]',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'px-3',
              leftIcon  && 'ps-9',
              rightIcon && 'pe-9',
              'transition-colors duration-[var(--transition-fast)]',
              'focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error && 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20',
              className
            )}
            aria-describedby={hint ? `${inputId}-hint` : error ? `${inputId}-error` : undefined}
            aria-invalid={!!error}
            {...props}
          />

          {rightIcon && (
            <span className="absolute end-3 text-[var(--text-muted)]">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
