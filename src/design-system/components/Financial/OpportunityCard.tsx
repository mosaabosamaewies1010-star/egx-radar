import * as React from 'react';
import { Target, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getScoreColor } from '@/design-system/tokens';
import { PriceChangePill } from './PriceChangePill';
import { SignalQualityBadge } from './SignalQualityBadge';
import type { SignalQuality } from './SignalQualityBadge';

type SignalResult = 'WIN' | 'LOSS' | 'PENDING';

interface OpportunityCardProps {
  symbol:       string;
  nameAr:       string;
  score:        number;
  entry:        number;
  tp1:          number;
  tp2:          number;
  sl:           number;
  currentPrice: number;
  changeAmt:    number;
  changePct:    number;
  holdDays:     number;
  signalQuality: SignalQuality;
  type?:        string;
  /** One-line human reason for the opportunity */
  reason?:      string;
  /** Last N signal results for historical context */
  signalHistory?: SignalResult[];
  lang?:        'ar' | 'en';
  className?:   string;
  onClick?:     () => void;
}

const signalIcon: Record<SignalResult, { icon: string; color: string }> = {
  WIN:     { icon: '✅', color: 'var(--success)' },
  LOSS:    { icon: '❌', color: 'var(--error)'   },
  PENDING: { icon: '⏳', color: 'var(--text-muted)' },
};

export function OpportunityCard({
  symbol, nameAr, score, entry, tp1, tp2, sl,
  currentPrice, changeAmt, changePct,
  holdDays, signalQuality, type, reason, signalHistory,
  lang = 'ar', className, onClick,
}: OpportunityCardProps) {
  const scoreColor = getScoreColor(score);
  const rr1 = ((tp1 - entry) / (entry - sl)).toFixed(1);

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-default)]',
        'p-4 space-y-3',
        'transition-all duration-[var(--transition-normal)]',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-strong)]',
        onClick && 'cursor-pointer',
        className
      )}
      data-widget-id="WGT-016"
      onClick={onClick}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold num text-[var(--text-primary)]">{symbol}</span>
            {type && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)' }}
              >
                {type}
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{nameAr}</span>
        </div>

        {/* Radar Score */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-2xl font-black num leading-none" style={{ color: scoreColor }}>{score}</span>
          <span className="text-[10px] widget-label mt-0.5">Radar</span>
        </div>
      </div>

      {/* ── Reason (human-readable signal summary) ── */}
      {reason && (
        <p
          className="text-xs leading-relaxed px-2 py-1.5 rounded-[var(--radius-sm)]"
          style={{
            color:      'var(--text-secondary)',
            background: 'var(--bg-elevated)',
            borderInlineStart: `2px solid ${scoreColor}`,
          }}
        >
          {reason}
        </p>
      )}

      {/* ── Price row ── */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold num" style={{ color: 'var(--text-primary)' }}>
          {currentPrice.toFixed(2)}
          <span className="text-sm ms-1" style={{ color: 'var(--text-muted)' }}>ج</span>
        </span>
        <PriceChangePill change={changeAmt} changePct={changePct} size="sm" />
      </div>

      {/* ── Entry / TP / SL ── */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: lang === 'ar' ? 'دخول'       : 'Entry', val: entry, color: 'var(--text-primary)' },
          { label: lang === 'ar' ? 'هدف 1'       : 'TP1',   val: tp1,   color: 'var(--success)'      },
          { label: lang === 'ar' ? 'هدف 2'       : 'TP2',   val: tp2,   color: 'var(--success)'      },
          { label: lang === 'ar' ? 'وقف الخسارة' : 'SL',    val: sl,    color: 'var(--error)'        },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span className="text-xs font-bold num" style={{ color: item.color }}>{item.val.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <SignalQualityBadge quality={signalQuality} lang={lang} />

        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span className="num">R/R {rr1}x</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="num">{holdDays}d</span>
          </span>
        </div>
      </div>

      {/* ── Signal history (historical, not prediction) ── */}
      {signalHistory && signalHistory.length > 0 && (
        <div
          className="pt-2 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] widget-label">
              {lang === 'ar' ? 'آخر إشارات السهم' : 'Recent Signals'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {lang === 'ar' ? '⚠️ بيانات تاريخية فقط' : '⚠️ Historical only'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {signalHistory.slice(-5).map((r, i) => (
              <span
                key={i}
                className="text-sm"
                title={r === 'WIN' ? 'ربح' : r === 'LOSS' ? 'خسارة' : 'جارية'}
              >
                {signalIcon[r].icon}
              </span>
            ))}
            <span className="text-[10px] num ms-1" style={{ color: 'var(--text-muted)' }}>
              {(() => {
                const wins = signalHistory.filter(r => r === 'WIN').length;
                const total = signalHistory.filter(r => r !== 'PENDING').length;
                return total > 0 ? `${Math.round((wins/total)*100)}%` : '';
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
