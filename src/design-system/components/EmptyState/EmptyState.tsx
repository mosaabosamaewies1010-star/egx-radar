import * as React from 'react';
import {
  SearchX, TrendingUp, FileQuestion, WifiOff, RefreshCw,
  BarChart2, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/cn';

export type EmptyStateScenario =
  | 'no-data'
  | 'no-results'
  | 'no-watchlist'
  | 'no-portfolio'
  | 'no-journal'
  | 'no-opportunities'
  | 'offline';

interface EmptyStateProps {
  scenario?: EmptyStateScenario;
  title?:    string;
  message?:  string;
  action?:   { label: string; onClick: () => void };
  className?: string;
  lang?: 'ar' | 'en';
}

const defaults: Record<EmptyStateScenario, {
  icon: React.ReactNode;
  titleAr: string;
  titleEn: string;
  msgAr: string;
  msgEn: string;
}> = {
  'no-data': {
    icon:    <BarChart2 className="w-10 h-10" />,
    titleAr: 'لا توجد بيانات',
    titleEn: 'No Data Available',
    msgAr:   'لم تتوفر بيانات لهذا السهم في الوقت الحالي.',
    msgEn:   'No data is available for this stock right now.',
  },
  'no-results': {
    icon:    <SearchX className="w-10 h-10" />,
    titleAr: 'لا نتائج',
    titleEn: 'No Results',
    msgAr:   'لم يتطابق بحثك مع أي سهم. جرّب مصطلحًا مختلفًا.',
    msgEn:   'No stocks match your search. Try a different term.',
  },
  'no-watchlist': {
    icon:    <TrendingUp className="w-10 h-10" />,
    titleAr: 'قائمة المتابعة فارغة',
    titleEn: 'Empty Watchlist',
    msgAr:   'أضف أسهمًا لمتابعتها وتلقّي تنبيهات ذكية.',
    msgEn:   'Add stocks to follow them and receive smart alerts.',
  },
  'no-portfolio': {
    icon:    <BarChart2 className="w-10 h-10" />,
    titleAr: 'محفظتك فارغة',
    titleEn: 'Empty Portfolio',
    msgAr:   'أضف صفقاتك الحالية لتحليل أداء محفظتك.',
    msgEn:   'Add your current positions to analyse portfolio performance.',
  },
  'no-journal': {
    icon:    <BookOpen className="w-10 h-10" />,
    titleAr: 'لا توجد قرارات مسجّلة',
    titleEn: 'No Journal Entries',
    msgAr:   'سجّل قراراتك وتعلّم من تجاربك السابقة.',
    msgEn:   'Record your decisions and learn from past trades.',
  },
  'no-opportunities': {
    icon:    <FileQuestion className="w-10 h-10" />,
    titleAr: 'لا توجد فرص حاليًا',
    titleEn: 'No Opportunities',
    msgAr:   'لم تتطابق أي أسهم مع معايير البوت اليوم. تحقق لاحقًا.',
    msgEn:   'No stocks matched the bot criteria today. Check back later.',
  },
  offline: {
    icon:    <WifiOff className="w-10 h-10" />,
    titleAr: 'لا يوجد اتصال',
    titleEn: 'You\'re Offline',
    msgAr:   'تحقق من اتصالك بالإنترنت وحاول مجددًا.',
    msgEn:   'Check your internet connection and try again.',
  },
};

export function EmptyState({
  scenario = 'no-data',
  title,
  message,
  action,
  className,
  lang = 'ar',
}: EmptyStateProps) {
  const d       = defaults[scenario];
  const t       = title   ?? (lang === 'ar' ? d.titleAr : d.titleEn);
  const m       = message ?? (lang === 'ar' ? d.msgAr   : d.msgEn);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 gap-4',
        className
      )}
      role="status"
    >
      <span className="text-[var(--text-muted)]" aria-hidden="true">{d.icon}</span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-[var(--text-secondary)]">{t}</p>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">{m}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--accent-primary)] hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
