/**
 * EGX Radar — Typography Tokens
 */

export const typography = {
  fontFamily: {
    arabic: "'Noto Sans Arabic', sans-serif",
    latin:  "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono:   "'JetBrains Mono', 'Courier New', monospace",
  },

  fontSize: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
    '4xl':'2.25rem',   // 36px
    score:'3.5rem',    // 56px — Score number display
  },

  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    extrabold:'800',
  },

  lineHeight: {
    tight:  '1.25',
    normal: '1.5',
    relaxed:'1.75',
  },
} as const;

/** Score text label by score range (Arabic) */
export function getScoreLabelAr(score: number): string {
  if (score >= 90) return 'استثنائي';
  if (score >= 75) return 'ممتاز';
  if (score >= 60) return 'جيد';
  if (score >= 45) return 'متوسط';
  if (score >= 30) return 'ضعيف';
  return 'احذر';
}

/** Score text label by score range (English) */
export function getScoreLabelEn(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Average';
  if (score >= 30) return 'Weak';
  return 'Caution';
}

/** Score → Stars count (0.0 – 5.0, in 0.5 steps) */
export function getScoreStars(score: number): number {
  const raw = score / 20;
  return Math.round(raw * 2) / 2; // round to nearest 0.5
}
