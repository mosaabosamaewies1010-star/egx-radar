/**
 * Tests for the analytics module.
 * fetch is mocked; localStorage is provided by jsdom.
 */
import { track } from '@/lib/analytics';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true });
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
});

describe('track()', () => {
  it('writes event to localStorage', () => {
    track('page_view', { path: '/stocks/COMI' });
    const stored = JSON.parse(localStorage.getItem('egx_analytics') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('page_view');
    expect(stored[0].props.path).toBe('/stocks/COMI');
  });

  it('accumulates multiple events in localStorage', () => {
    track('page_view', { path: '/' });
    track('page_view', { path: '/stocks/COMI' });
    const stored = JSON.parse(localStorage.getItem('egx_analytics') ?? '[]');
    expect(stored).toHaveLength(2);
  });

  it('debounces and fires fetch after 2s', () => {
    track('page_view', { path: '/' });
    expect(mockFetch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('flushes immediately when queue reaches 20 events', () => {
    for (let i = 0; i < 20; i++) {
      track('page_view', { path: `/${i}` });
    }
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('sends events to /api/analytics/events endpoint', () => {
    track('search_performed', { query: 'COMI' });
    jest.advanceTimersByTime(2000);
    expect(mockFetch.mock.calls[0][0]).toContain('/api/analytics/events');
  });

  it('sends POST with JSON body', () => {
    track('stock_page_viewed', { symbol: 'COMI', score: 82, data_quality: 'HIGH' });
    jest.advanceTimersByTime(2000);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].name).toBe('stock_page_viewed');
  });

  it('never throws even if fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(() => {
      track('page_view', { path: '/' });
      jest.advanceTimersByTime(2000);
    }).not.toThrow();
  });

  it('caps localStorage ring buffer at 100', () => {
    // Pre-fill localStorage with 99 entries
    const initial = Array.from({ length: 99 }, (_, i) => ({ name: 'old', props: {}, ts: i }));
    localStorage.setItem('egx_analytics', JSON.stringify(initial));

    track('page_view', { path: '/' });
    const stored = JSON.parse(localStorage.getItem('egx_analytics') ?? '[]');
    expect(stored).toHaveLength(100);

    track('page_view', { path: '/2' });
    const stored2 = JSON.parse(localStorage.getItem('egx_analytics') ?? '[]');
    expect(stored2.length).toBeLessThanOrEqual(100);
  });
});
