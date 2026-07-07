/**
 * EGX Radar — Color Tokens
 * Single source of truth. CSS variables are defined in globals.css.
 * Use these constants in TypeScript logic (not for className/style).
 */

export const colors = {
  bg: {
    base:     'var(--bg-base)',
    surface:  'var(--bg-surface)',
    elevated: 'var(--bg-elevated)',
    overlay:  'var(--bg-overlay)',
    input:    'var(--bg-input)',
    hover:    'var(--bg-hover)',
  },

  border: {
    subtle:  'var(--border-subtle)',
    default: 'var(--border-default)',
    strong:  'var(--border-strong)',
    focus:   'var(--border-focus)',
  },

  text: {
    primary:   'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted:     'var(--text-muted)',
    disabled:  'var(--text-disabled)',
    inverse:   'var(--text-inverse)',
    link:      'var(--text-link)',
  },

  accent: {
    primary:   'var(--accent-primary)',
    primaryH:  'var(--accent-primary-h)',
    secondary: 'var(--accent-secondary)',
    gold:      'var(--accent-gold)',
  },

  score: {
    90: '#22C55E',
    75: '#00C9A7',
    60: '#3B82F6',
    45: '#F59E0B',
    30: '#EF4444',
    0:  '#991B1B',
  },

  regime: {
    bull:     { fg: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
    sideways: { fg: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
    bear:     { fg: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
    volatile: { fg: '#A855F7', bg: 'rgba(168,85,247,0.12)'  },
    lowliq:   { fg: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  },

  semantic: {
    success:    { fg: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
    warning:    { fg: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    error:      { fg: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
    info:       { fg: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  },

  chart: {
    up:     '#22C55E',
    down:   '#EF4444',
    volume: 'rgba(59,130,246,0.4)',
    ma20:   '#F59E0B',
    ma50:   '#A855F7',
    ma200:  '#06B6D4',
  },
} as const;

/** Returns score color hex based on score value (0–100) */
export function getScoreColor(score: number): string {
  if (score >= 90) return colors.score[90];
  if (score >= 75) return colors.score[75];
  if (score >= 60) return colors.score[60];
  if (score >= 45) return colors.score[45];
  if (score >= 30) return colors.score[30];
  return colors.score[0];
}

/** Returns Tailwind CSS class for score color */
export function getScoreColorClass(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-teal-400';
  if (score >= 60) return 'text-blue-500';
  if (score >= 45) return 'text-amber-500';
  if (score >= 30) return 'text-red-500';
  return 'text-red-900';
}

export type RegimeType = 'BULL' | 'SIDEWAYS' | 'BEAR' | 'VOLATILE' | 'LOW_LIQUIDITY';

export function getRegimeColors(regime: RegimeType) {
  const map: Record<RegimeType, { fg: string; bg: string }> = {
    BULL:          colors.regime.bull,
    SIDEWAYS:      colors.regime.sideways,
    BEAR:          colors.regime.bear,
    VOLATILE:      colors.regime.volatile,
    LOW_LIQUIDITY: colors.regime.lowliq,
  };
  return map[regime];
}
