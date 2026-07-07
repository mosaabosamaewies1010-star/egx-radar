import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva(
  'rounded-[var(--radius-lg)] overflow-hidden transition-all duration-[var(--transition-normal)]',
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--bg-surface)]',
          'border border-[var(--border-subtle)]',
          'shadow-[var(--shadow-sm)]',
        ],
        elevated: [
          'bg-[var(--bg-elevated)]',
          'border border-[var(--border-default)]',
          'shadow-[var(--shadow-md)]',
        ],
        glass: [
          'bg-[var(--bg-surface)]/70 backdrop-blur-md',
          'border border-[var(--border-subtle)]',
        ],
        flat: [
          'bg-transparent',
          'border border-[var(--border-subtle)]',
        ],
        financial: [
          'bg-[var(--bg-surface)]',
          'border border-[var(--border-default)]',
          'shadow-[var(--shadow-md)]',
          'gradient-border',
        ],
      },
      padding: {
        none: '',
        sm:   'p-3',
        md:   'p-5',
        lg:   'p-6',
        xl:   'p-8',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:-translate-y-0.5',
          'hover:shadow-[var(--shadow-card-hover)]',
          'hover:border-[var(--border-strong)]',
          'active:translate-y-0 active:scale-[0.995]',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant:     'default',
      padding:     'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  widgetId?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, widgetId, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      data-widget-id={widgetId}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'pb-4 mb-4 border-b border-[var(--border-subtle)]',
        className
      )}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode;
}

export function CardTitle({ className, icon, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('widget-label', icon ? 'flex items-center gap-2' : '', className)}
      {...props}
    >
      {icon}
      {children}
    </h3>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'pt-4 mt-4 border-t border-[var(--border-subtle)]',
        'text-xs text-[var(--text-muted)]',
        className
      )}
      {...props}
    />
  );
}
