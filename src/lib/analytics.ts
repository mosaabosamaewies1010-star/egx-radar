/**
 * EGX Radar Analytics — Phase 4
 * Lightweight event tracking. Widget-ID based (WGT/LYT/UI registry).
 * In V1: fires to Flask API + mirrors to localStorage for debugging.
 */

export type AnalyticsEvent =
  // Navigation
  | { name: 'page_view';          props: { path: string; referrer?: string } }
  // Search
  | { name: 'search_performed';   props: { query: string } }
  // Dashboard
  | { name: 'opportunity_clicked'; props: { symbol: string; score: number; type: string; rank: number } }
  | { name: 'regime_viewed';      props: { regime: string; confidence: number } }
  | { name: 'sharia_filter_toggled'; props: { enabled: boolean } }
  // Stock page
  | { name: 'stock_page_viewed';  props: { symbol: string; score: number; data_quality: string } }
  | { name: 'score_gauge_viewed'; props: { symbol: string; score: number; widget_id: string } }
  | { name: 'explain_viewed';     props: { symbol: string; score: number } }
  | { name: 'opportunity_card_viewed'; props: { symbol: string; type: string; signal_quality: string } }
  // Errors
  | { name: 'error_shown';        props: { scenario: string; path: string } }
  | { name: 'retry_clicked';      props: { scenario: string; path: string } }
  // Widget visibility (IntersectionObserver)
  | { name: 'widget_viewed';      props: { widget_id: string; symbol?: string; duration_ms?: number } }
  // Beta telemetry
  | { name: 'pro_upgrade_clicked'; props: { symbol: string; source: string } }
  | { name: 'discover_opened';    props: { section?: string } }
  | { name: 'watchlist_added';    props: { symbol: string } }
  | { name: 'morning_brief_opened'; props: Record<string, never> }
  | { name: 'stock_searched';     props: { query: string } };

type EventName = AnalyticsEvent['name'];
type EventProps<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['props'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
const IS_BROWSER = typeof window !== 'undefined';
const MAX_QUEUE = 20;

let queue: Array<{ name: string; props: Record<string, unknown>; ts: number }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Fire an analytics event — non-blocking, batched, never throws. */
export function track<N extends EventName>(name: N, props: EventProps<N>): void {
  if (!IS_BROWSER) return;

  const event = { name, props: props as Record<string, unknown>, ts: Date.now() };

  // Dev: log to console
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[analytics] ${name}`, props);
  }

  // Mirror to localStorage (ring buffer, last 100)
  try {
    const stored = JSON.parse(localStorage.getItem('egx_analytics') ?? '[]');
    stored.push(event);
    if (stored.length > 100) stored.splice(0, stored.length - 100);
    localStorage.setItem('egx_analytics', JSON.stringify(stored));
  } catch { /* quota or private mode */ }

  queue.push(event);

  // Flush immediately if queue is full, else debounce 2s
  if (queue.length >= MAX_QUEUE) {
    flush();
  } else {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 2000);
  }
}

function flush(): void {
  if (!queue.length) return;
  const batch = queue.splice(0);
  flushTimer = null;

  // Fire-and-forget — never blocks the UI
  fetch(`${API_BASE}/api/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: batch }),
    keepalive: true,  // survives page unload
  }).catch(() => { /* silently drop if API unreachable */ });
}

/** Flush remaining events on page unload */
if (IS_BROWSER) {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
