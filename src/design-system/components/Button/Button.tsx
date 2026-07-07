'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-[var(--radius-md)]',
    'transition-all duration-[var(--transition-fast)]',
    'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--accent-primary)] text-white',
          'hover:bg-[var(--accent-primary-h)]',
          'active:scale-[0.98]',
        ],
        secondary: [
          'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
          'border border-[var(--border-default)]',
          'hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)]',
        ],
        ghost: [
          'bg-transparent text-[var(--text-secondary)]',
          'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
        ],
        danger: [
          'bg-[var(--error)] text-white',
          'hover:opacity-90',
          'active:scale-[0.98]',
        ],
        success: [
          'bg-[var(--success)] text-white',
          'hover:opacity-90',
          'active:scale-[0.98]',
        ],
        link: [
          'bg-transparent text-[var(--text-link)] underline-offset-4',
          'hover:underline',
          'p-0 h-auto',
        ],
      },
      size: {
        sm: 'h-8  px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true:  'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant:   'primary',
      size:      'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  /** data-widget-id for analytics tracking */
  widgetId?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      children,
      widgetId,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        data-widget-id={widgetId}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        ) : leftIcon}

        {children && <span>{children}</span>}

        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
