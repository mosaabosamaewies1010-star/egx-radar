/**
 * Tests for Market Dashboard page (/dashboard)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarketDashboardPage from '@/app/dashboard/page';

jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard',
  useParams:   () => ({}),
}));

const mockStore = {
  lang:            'ar' as const,
  regime:          'SIDEWAYS' as const,
  regimeData:      null,
  setRegime:       jest.fn(),
  shariaFilter:    false,
  setShariaFilter: jest.fn(),
  setLang:         jest.fn(),
  user:            null,
  token:           null,
  setUser:         jest.fn(),
  setToken:        jest.fn(),
  logout:          jest.fn(),
  initAuth:        jest.fn(),
};
jest.mock('@/lib/store', () => ({ useAppStore: () => mockStore }));
jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));
jest.mock('@/lib/useAnalytics', () => ({
  usePageView:   jest.fn(),
  useWidgetView: () => ({ current: null }),
}));

const mockGetMarketSummary = jest.fn();
const mockGetHeatmap       = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    getMarketSummary: (...args: unknown[]) => mockGetMarketSummary(...args),
    getHeatmap:       (...args: unknown[]) => mockGetHeatmap(...args),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSummary = {
  as_of: '2026-07-07',
  regime: {
    regime: 'BULL' as const,
    confidence: 78,
    run_date: '2026-07-07',
    breadth: { advancing: 18, declining: 7, unchanged: 5 },
    reason: { ar: 'السوق في مرحلة صعود', en: 'Bull market' },
  },
  egx30_close: 30360,
  egx30_change_pct: 1.2,
  sector_ranking: [
    { sector: 'البنوك', avg_score: 74.2, count: 8 },
    { sector: 'الاتصالات', avg_score: 62.1, count: 4 },
  ],
  top_volume: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', rvol: 2.3, score: 87 },
    { symbol: 'EFIH', name_ar: 'هيرميس', rvol: 1.8, score: 72 },
  ],
  top_breakouts: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', score: 87, trend_score: 17 },
  ],
  opportunities_count: 4,
};

const mockHeatmap = {
  stocks: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', sector: 'البنوك', score: 87, change_pct: 1.4 },
    { symbol: 'EFIH', name_ar: 'هيرميس', sector: 'المالية', score: 72, change_pct: 0.8 },
  ],
  as_of: '2026-07-07',
};

beforeEach(() => {
  mockGetMarketSummary.mockReset();
  mockGetHeatmap.mockReset();
});

// ── Loading ───────────────────────────────────────────────────────────────────

describe('MarketDashboardPage — loading', () => {
  it('shows shimmer skeleton while fetching', () => {
    mockGetMarketSummary.mockReturnValue(new Promise(() => {}));
    mockGetHeatmap.mockReturnValue(new Promise(() => {}));
    render(<MarketDashboardPage />);
    expect(document.querySelector('.shimmer')).toBeInTheDocument();
  });
});

// ── Success ───────────────────────────────────────────────────────────────────

describe('MarketDashboardPage — success', () => {
  beforeEach(() => {
    mockGetMarketSummary.mockResolvedValue(mockSummary);
    mockGetHeatmap.mockResolvedValue(mockHeatmap);
  });

  it('renders the page title', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('لوحة السوق')).toBeInTheDocument());
  });

  it('renders EGX30 label', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('EGX30')).toBeInTheDocument());
  });

  it('renders sector ranking header', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('ترتيب القطاعات')).toBeInTheDocument());
  });

  it('renders top sector name', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getAllByText('البنوك').length).toBeGreaterThan(0));
  });

  it('renders top volume section', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('أعلى حجم تداول')).toBeInTheDocument());
  });

  it('renders top breakouts section', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('أقوى اختراق')).toBeInTheDocument());
  });

  it('renders opportunities count', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
  });

  it('renders heatmap section header', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('خريطة السوق الحرارية')).toBeInTheDocument());
  });

  it('renders breadth advancing stat', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText('اتساع السوق — تفصيل')).toBeInTheDocument());
  });

  it('renders disclaimer text', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText(/ليست نصيحة استثمارية/)).toBeInTheDocument());
  });

  it('calls setRegime with regime data', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(mockStore.setRegime).toHaveBeenCalledWith(mockSummary.regime));
  });
});

// ── Empty data ────────────────────────────────────────────────────────────────

describe('MarketDashboardPage — empty data', () => {
  it('shows fallback text when no sector data', async () => {
    mockGetMarketSummary.mockResolvedValue({ ...mockSummary, sector_ranking: [], top_volume: [], top_breakouts: [] });
    mockGetHeatmap.mockResolvedValue({ stocks: [], as_of: null });
    render(<MarketDashboardPage />);
    await waitFor(() => {
      expect(screen.getAllByText('لا تتوفر بيانات').length).toBeGreaterThan(0);
    });
  });

  it('shows heatmap empty state', async () => {
    mockGetMarketSummary.mockResolvedValue(mockSummary);
    mockGetHeatmap.mockResolvedValue({ stocks: [], as_of: null });
    render(<MarketDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/لا تتوفر بيانات للخريطة الحرارية/)).toBeInTheDocument()
    );
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('MarketDashboardPage — error', () => {
  beforeEach(() => {
    mockGetMarketSummary.mockRejectedValue(new Error('Network error'));
    mockGetHeatmap.mockRejectedValue(new Error('Network error'));
  });

  it('shows error state on API failure', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button on error', async () => {
    render(<MarketDashboardPage />);
    await waitFor(() => expect(screen.getByText(/إعادة المحاولة/)).toBeInTheDocument());
  });

  it('retries on button click', async () => {
    const user = userEvent.setup();
    mockGetMarketSummary.mockRejectedValue(new Error('fail'));
    mockGetHeatmap.mockRejectedValue(new Error('fail'));
    render(<MarketDashboardPage />);
    const retryBtn = await screen.findByText(/إعادة المحاولة/);
    await user.click(retryBtn);
    expect(mockGetMarketSummary).toHaveBeenCalledTimes(2);
  });
});
