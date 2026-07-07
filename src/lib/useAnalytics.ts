'use client';
/**
 * React hooks for analytics — widget visibility + page tracking.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from './analytics';

/** Fire page_view on route change. Place once in layout or per page. */
export function usePageView(): void {
  const pathname = usePathname();
  useEffect(() => {
    track('page_view', { path: pathname, referrer: document.referrer || undefined });
  }, [pathname]);
}

/**
 * Observe when a widget enters the viewport.
 * Fires 'widget_viewed' once per mount when ≥50% visible for ≥500ms.
 */
export function useWidgetView(
  widgetId: string,
  extra?: { symbol?: string },
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  const entryTime = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          entryTime.current = Date.now();
        } else if (!entry.isIntersecting && entryTime.current && !fired.current) {
          const duration = Date.now() - entryTime.current;
          if (duration >= 500) {
            fired.current = true;
            track('widget_viewed', { widget_id: widgetId, ...extra, duration_ms: duration });
          }
          entryTime.current = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [widgetId, extra?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

/** Fire once when component mounts — for above-the-fold widgets. */
export function useTrackOnMount<N extends Parameters<typeof track>[0]>(
  name: N,
  props: Parameters<typeof track<N>>[1],
  deps: unknown[] = [],
): void {
  useEffect(() => {
    track(name, props);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
