'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open:       boolean;
  onClose:    () => void;
  title?:     string;
  size?:      'sm' | 'md' | 'lg' | 'xl';
  children:   React.ReactNode;
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, size = 'md', children, className }: ModalProps) {
  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full rounded-[var(--radius-xl)]',
          'bg-[var(--bg-surface)] border border-[var(--border-default)]',
          'shadow-[var(--shadow-lg)] fade-in',
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-sm)] p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn('px-6 py-5', !title && 'pt-5')}>
          {!title && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 end-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'pt-4 mt-4 border-t border-[var(--border-subtle)]',
        className
      )}
      {...props}
    />
  );
}
