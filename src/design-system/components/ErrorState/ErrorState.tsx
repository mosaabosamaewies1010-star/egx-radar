import * as React from 'react';
import { AlertCircle, Lock, ServerCrash, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ErrorScenario = 'network' | 'auth' | 'server' | 'not-found' | 'stale-data';

interface ErrorStateProps {
  scenario?:   ErrorScenario;
  title?:      string;
  message?:    string;
  onRetry?:    () => void;
  className?:  string;
  lang?:       'ar' | 'en';
}

const defaults: Record<ErrorScenario, {
  icon: React.ReactNode;
  titleAr: string;
  titleEn: string;
  msgAr: string;
  msgEn: string;
  retryAr: string;
  retryEn: string;
}> = {
  network: {
    icon:    <WifiOff className="w-10 h-10" />,
    titleAr: 'فشل الاتصال',
    titleEn: 'Connection Failed',
    msgAr:   'تعذّر الوصول إلى الخادم. تحقق من اتصالك.',
    msgEn:   'Could not reach the server. Check your connection.',
    retryAr: 'إعادة المحاولة',
    retryEn: 'Try Again',
  },
  auth: {
    icon:    <Lock className="w-10 h-10" />,
    titleAr: 'غير مصرح',
    titleEn: 'Unauthorized',
    msgAr:   'يجب تسجيل الدخول للوصول إلى هذا المحتوى.',
    msgEn:   'You need to log in to access this content.',
    retryAr: 'تسجيل الدخول',
    retryEn: 'Log In',
  },
  server: {
    icon:    <ServerCrash className="w-10 h-10" />,
    titleAr: 'خطأ في الخادم',
    titleEn: 'Server Error',
    msgAr:   'حدث خطأ من جانبنا. نحن نعمل على حلّه.',
    msgEn:   'Something went wrong on our end. We\'re working on it.',
    retryAr: 'إعادة المحاولة',
    retryEn: 'Retry',
  },
  'not-found': {
    icon:    <AlertCircle className="w-10 h-10" />,
    titleAr: 'لم يُعثر على البيانات',
    titleEn: 'Not Found',
    msgAr:   'هذا السهم غير موجود أو لم تتوفر بياناته.',
    msgEn:   'This stock was not found or has no data.',
    retryAr: 'رجوع',
    retryEn: 'Go Back',
  },
  'stale-data': {
    icon:    <AlertCircle className="w-10 h-10" />,
    titleAr: 'بيانات قديمة',
    titleEn: 'Stale Data',
    msgAr:   'البيانات المعروضة قديمة. قد لا تعكس السعر الحالي.',
    msgEn:   'Displayed data is stale and may not reflect the current price.',
    retryAr: 'تحديث',
    retryEn: 'Refresh',
  },
};

export function ErrorState({
  scenario = 'server',
  title,
  message,
  onRetry,
  className,
  lang = 'ar',
}: ErrorStateProps) {
  const d      = defaults[scenario];
  const t      = title   ?? (lang === 'ar' ? d.titleAr : d.titleEn);
  const m      = message ?? (lang === 'ar' ? d.msgAr   : d.msgEn);
  const retryL = lang === 'ar' ? d.retryAr : d.retryEn;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 gap-4',
        className
      )}
      role="alert"
    >
      <span className="text-[var(--error)]" aria-hidden="true">{d.icon}</span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-[var(--text-primary)]">{t}</p>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">{m}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--accent-primary)] hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          {retryL}
        </button>
      )}
    </div>
  );
}
