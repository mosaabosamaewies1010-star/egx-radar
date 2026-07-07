'use client';

import * as React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id:       string;
  type:     ToastType;
  message:  string;
  duration?: number;
}

interface ToastProps extends ToastItem {
  onDismiss: (id: string) => void;
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle  className="w-4 h-4 shrink-0" />,
  error:   <AlertCircle  className="w-4 h-4 shrink-0" />,
  info:    <Info         className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
};

const colorMap: Record<ToastType, string> = {
  success: 'border-s-[var(--success)] text-[var(--success)]',
  error:   'border-s-[var(--error)]   text-[var(--error)]',
  info:    'border-s-[var(--info)]    text-[var(--info)]',
  warning: 'border-s-[var(--warning)] text-[var(--warning)]',
};

export function Toast({ id, type, message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-center gap-3 min-w-[280px] max-w-sm',
        'bg-[var(--bg-elevated)] border border-[var(--border-default)]',
        'border-s-4 rounded-[var(--radius-md)] px-4 py-3',
        'shadow-[var(--shadow-lg)] fade-in',
        colorMap[type]
      )}
    >
      <span aria-hidden="true">{iconMap[type]}</span>
      <p className="flex-1 text-sm text-[var(--text-primary)]">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Toast Context + Provider ── */

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 end-4 z-[var(--z-toast)] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}
