/**
 * Tests for Stock Intelligence Page — loading, error, data rendering.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StockPage from '@/app/stocks/[symbol]/page';

// Mock next/navigation
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter:  () => ({ push: jest.fn(), back: mockBack }),
  usePathname: () => '/stocks/COMI',
  useParams:  () => ({ symbol: 'COMI' }),
}));

// Mock zustand store
jest.mock('@/lib/store', () => ({
  useAppStore: () => ({
    lang:            'ar' as const,
    regime:          'BULL' as const,
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
  }),
}));

// Mock analytics
jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));
jest.mock('@/lib/useAnalytics', () => ({
  usePageView:      jest.fn(),
  useWidgetView:    () => ({ current: null }),
  useTrackOnMount:  jest.fn(),
}));

// Mock API
const mockGetStock = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { getStock: (...args: unknown[]) => mockGetStock(...args) },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockStock = {
  symbol: 'COMI',
  name_ar: 'بنك القاهرة',
  sector: 'البنوك',
  price: 87.5,
  change_amt: 1.2,
  change_pct: 1.39,
  score: 82,
  data_quality: 'HIGH' as const,
  is_sharia: false,
  indicators: {
    adx: 32.1,
    rsi: 61.4,
    rvol: 1.8,
    atr_pct: 1.9,
    macd_hist: 0.3,
    obv_trend: 'UP' as const,
    stoch_k: 66,
    stoch_d: 62,
    williams_r: -28,
  },
  breakdown: {
    trend: 17,
    momentum: 15,
    liquidity: 12,
    volume: 11,
    sector: 9,
    fundamental: 10,
    risk_penalty: 4,
    final_score: 82,
  },
  explain: {
    ar: 'الاتجاه قوي\nالزخم جيد',
    en: 'Strong trend\nGood momentum',
  },
  opportunity: {
    type: 'Breakout' as const,
    signal_quality: 'HIGH' as const,
    levels: { entry: 87.5, tp1: 93.0, tp2: 98.5, sl: 84.2, rr: 2.1, max_hold_days: 10 },
    reason: { ar: 'اختراق مع حجم عالي', en: 'Breakout with high volume' },
  },
};

beforeEach(() => {
  mockGetStock.mockReset();
  mockBack.mockReset();
});

// ── Loading ───────────────────────────────────────────────────────────────────

describe('StockPage — loading', () => {
  it('shows shimmer skeleton while fetching', () => {
    mockGetStock.mockReturnValue(new Promise(() => {}));
    render(<StockPage />);
    expect(document.querySelector('.shimmer')).toBeInTheDocument();
  });
});

// ── Success ───────────────────────────────────────────────────────────────────

describe('StockPage — success', () => {
  beforeEach(() => {
    mockGetStock.mockResolvedValue(mockStock);
  });

  it('renders the stock symbol', async () => {
    render(<StockPage />);
    await waitFor(() => expect(screen.getAllByText('COMI').length).toBeGreaterThan(0));
  });

  it('renders the arabic stock name', async () => {
    render(<StockPage />);
    await waitFor(() => expect(screen.getAllByText('بنك القاهرة').length).toBeGreaterThan(0));
  });

  it('renders the sector badge', async () => {
    render(<StockPage />);
    await waitFor(() => expect(screen.getByText('البنوك')).toBeInTheDocument());
  });

  it('renders explain bullets from newline-split text', async () => {
    render(<StockPage />);
    await waitFor(() => {
      expect(screen.getByText('الاتجاه قوي')).toBeInTheDocument();
      expect(screen.getByText('الزخم جيد')).toBeInTheDocument();
    });
  });

  it('renders high data quality badge', async () => {
    render(<StockPage />);
    await waitFor(() => expect(screen.getByText('بيانات عالية')).toBeInTheDocument());
  });

  it('renders the OBV trend pill', async () => {
    render(<StockPage />);
    await waitFor(() => expect(screen.getByText(/تراكم/)).toBeInTheDocument());
  });

  it('renders opportunity section header when score >= 60', async () => {
    render(<StockPage />);
    await waitFor(() => expect(screen.getByText('الفرصة المكتشفة')).toBeInTheDocument());
  });

  it('renders disclaimer text', async () => {
    render(<StockPage />);
    await waitFor(() =>
      expect(screen.getByText(/ليست نصيحة استثمارية/)).toBeInTheDocument()
    );
  });
});

// ── No opportunity ────────────────────────────────────────────────────────────

describe('StockPage — no opportunity', () => {
  it('renders fallback card when opportunity is null', async () => {
    mockGetStock.mockResolvedValue({ ...mockStock, opportunity: null, score: 55 });
    render(<StockPage />);
    await waitFor(() =>
      expect(screen.getByText(/لا توجد فرصة نشطة/)).toBeInTheDocument()
    );
  });
});

// ── Sharia badge ──────────────────────────────────────────────────────────────

describe('StockPage — sharia', () => {
  it('renders sharia badge when is_sharia is true', async () => {
    mockGetStock.mockResolvedValue({ ...mockStock, is_sharia: true });
    render(<StockPage />);
    await waitFor(() => expect(screen.getByText('شريعة')).toBeInTheDocument());
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('StockPage — error', () => {
  it('shows network error state on API failure', async () => {
    mockGetStock.mockRejectedValue(new Error('Network error'));
    render(<StockPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button on error', async () => {
    mockGetStock.mockRejectedValue(new Error('fail'));
    render(<StockPage />);
    await waitFor(() => expect(screen.getByText(/إعادة المحاولة/)).toBeInTheDocument());
  });

  it('retries fetch when retry button clicked', async () => {
    const user = userEvent.setup();
    mockGetStock.mockRejectedValue(new Error('fail'));
    render(<StockPage />);
    const retryBtn = await screen.findByText(/إعادة المحاولة/);
    await user.click(retryBtn);
    expect(mockGetStock).toHaveBeenCalledTimes(2);
  });

  it('shows 404 error state for unknown symbol', async () => {
    const { ApiError } = jest.requireMock('@/lib/api') as {
      ApiError: new (status: number, msg: string) => Error & { status: number };
    };
    mockGetStock.mockRejectedValue(new ApiError(404, 'Not found'));
    render(<StockPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
