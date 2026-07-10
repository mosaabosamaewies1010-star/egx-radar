import * as React from 'react';
import { Target, Clock, Zap, Scale } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getScoreColor } from '@/design-system/tokens';
import { PriceChangePill } from './PriceChangePill';
import { SignalQualityBadge } from './SignalQualityBadge';
import type { SignalQuality } from './SignalQualityBadge';

type SignalResult = 'WIN' | 'LOSS' | 'PENDING';

interface ExitProfile {
  tp:       number;
  sl:       number;
  max_bars: number;
  tp_pct?:  number;
}

interface SRAProfiles {
  FAST:     ExitProfile;
  BALANCED: ExitProfile;
}

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
  grade?:       string;
  /** SRA exit profiles — when present replaces tp1/tp2 with FAST/BALANCED rows */
  profiles?:    SRAProfiles;
  /** SRA signal bullets */
  signals?:     string[];
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

const gradeColors: Record<string, string> = {
  'A+': 'var(--success)',
  'A':  '#3b82f6',
  'B':  'var(--accent-gold)',
};

export function OpportunityCard({
  symbol, nameAr, score, entry, tp1, tp2, sl,
  currentPrice, changeAmt, changePct,
  holdDays, signalQuality, type, grade, profiles, signals, reason, signalHistory,
  lang = 'ar', className, onClick,
}: OpportunityCardProps) {
  const scoreColor  = getScoreColor(score);
  const gradeColor  = grade ? (gradeColors[grade] ?? scoreColor) : scoreColor;
  const isSRA       = !!profiles;
  const rr1 = !isSRA ? ((tp1 - entry) / (entry - sl)).toFixed(1) : null;

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
            {grade && (
              <span
                className="text-[11px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${gradeColor}22`, color: gradeColor, border: `1px solid ${gradeColor}44` }}
              >
                {grade}
              </span>
            )}
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

        {/* Score */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-2xl font-black num leading-none" style={{ color: scoreColor }}>{score}</span>
          <span className="text-[10px] widget-label mt-0.5">{isSRA ? 'SRA' : 'Radar'}</span>
        </div>
      </div>

      {/* ── SRA Signals ── */}
      {isSRA && signals && signals.length > 0 && (
        <div className="space-y-1">
          {signals.slice(0, 4).map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: gradeColor }}>✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Reason (momentum) ── */}
      {!isSRA && reason && (
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

      {/* ── SRA: FAST / BALANCED exit profiles ── */}
      {isSRA && profiles && (
        <div className="space-y-2">
          {/* FAST */}
          <div
            className="rounded-[var(--radius-md)] p-2.5 space-y-1.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" style={{ color: 'var(--success)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>
                {lang === 'ar' ? 'سريع — مضاربة' : 'FAST — Scalp'}
              </span>
              <span className="text-[10px] ms-auto flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-2.5 h-2.5" />
                {lang === 'ar' ? `تقريباً ${profiles.FAST.max_bars} جلسات` : `~${profiles.FAST.max_bars} bars`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: lang === 'ar' ? 'دخول'  : 'Entry', val: entry,           color: 'var(--text-primary)' },
                { label: lang === 'ar' ? 'هدف +٧٪' : 'TP +7%', val: profiles.FAST.tp, color: 'var(--success)'  },
                { label: lang === 'ar' ? 'وقف'   : 'SL',    val: profiles.FAST.sl, color: 'var(--error)'      },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className="text-xs font-bold num" style={{ color: item.color }}>{item.val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BALANCED */}
          <div
            className="rounded-[var(--radius-md)] p-2.5 space-y-1.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="flex items-center gap-1.5">
              <Scale className="w-3 h-3" style={{ color: '#3b82f6' }} />
              <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>
                {lang === 'ar' ? 'معتدل — تأرجح' : 'BALANCED — Swing'}
              </span>
              <span className="text-[10px] ms-auto flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-2.5 h-2.5" />
                {lang === 'ar' ? `تقريباً ${profiles.BALANCED.max_bars} جلسات` : `~${profiles.BALANCED.max_bars} bars`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: lang === 'ar' ? 'دخول'   : 'Entry', val: entry,               color: 'var(--text-primary)' },
                { label: lang === 'ar' ? 'هدف +١٥٪' : 'TP +15%', val: profiles.BALANCED.tp, color: '#3b82f6'      },
                { label: lang === 'ar' ? 'وقف'    : 'SL',    val: profiles.BALANCED.sl, color: 'var(--error)'      },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className="text-xs font-bold num" style={{ color: item.color }}>{item.val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Momentum: Entry / TP1 / TP2 / SL (only when no SRA profiles) ── */}
      {!isSRA && (
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
      )}

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <SignalQualityBadge quality={signalQuality} lang={lang} />

        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {!isSRA && rr1 && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span className="num">R/R {rr1}x</span>
            </span>
          )}
          {!isSRA && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="num">{holdDays}d</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Signal history ── */}
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
              <span key={i} className="text-sm" title={r === 'WIN' ? 'ربح' : r === 'LOSS' ? 'خسارة' : 'جارية'}>
                {signalIcon[r].icon}
              </span>
            ))}
            <span className="text-[10px] num ms-1" style={{ color: 'var(--text-muted)' }}>
              {(() => {
                const wins  = signalHistory.filter(r => r === 'WIN').length;
                const total = signalHistory.filter(r => r !== 'PENDING').length;
                return total > 0 ? `${Math.round((wins / total) * 100)}%` : '';
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
