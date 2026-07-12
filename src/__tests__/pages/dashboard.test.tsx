/**
 * Tests for Dashboard page — regime banner, opportunity list, market pulse, quick actions.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/app/page';

// Mock router and pathname
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
}));

// Mock zustand
const mockStore = {
  lang:            'ar' as const,
  setLang:         jest.fn(),
  regime:          'SIDEWAYS' as const,
  regimeData:      null,
  setRegime:       jest.fn(),
  shariaFilter:    false,
  setShariaFilter: jest.fn(),
  user:            null as import('@/lib/types').User | null,
  token:           null,
  setUser:         jest.fn(),
  setToken:        jest.fn(),
  logout:          jest.fn(),
  initAuth:        jest.fn(),
};
jest.mock('@/lib/store', () => ({ useAppStore: () => mockStore }));

// Mock analytics to avoid fetch side-effects
jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));
jest.mock('@/lib/useAnalytics', () => ({
  usePageView: jest.fn(),
  useWidgetView: () => ({ current: null }),
}));

// Mock API
const mockGetRegime        = jest.fn();
const mockGetOpportunities = jest.fn();
const mockGetMarketSummary = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    getRegime:         (...args: unknown[]) => mockGetRegime(...args),
    getOpportunities:  (...args: unknown[]) => mockGetOpportunities(...args),
    getMarketSummary:  (...args: unknown[]) => mockGetMarketSummary(...args),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockRegime = {
  regime: 'BULL' as const,
  confidence: 78,
  run_date: '2026-07-07',
  reason: { ar: 'السوق في مرحلة صعود', en: 'Bull market' },
};

const mockOpp = {
  id: 1,
  symbol: 'COMI',
  name_ar: 'بنك القاهرة',
  is_sharia: false,
  type: 'Breakout' as const,
  radar_score: 87,
  signal_quality: 'HIGH' as const,
  run_date: '2026-07-07',
  levels: { entry: 87.5, tp1: 92.8, tp2: 97.5, sl: 84.2, rr: 2.1, max_hold_days: 10 },
};

const mockSummary = {
  as_of: '2026-07-07',
  regime: {
    ...mockRegime,
    breadth: { advancing: 18, declining: 7, unchanged: 5 },
  },
  egx30_close: 31500,
  egx30_change_pct: 1.23,
  sector_ranking: [
    { sector: 'البنوك', avg_score: 78, count: 12 },
    { sector: 'العقارات', avg_score: 65, count: 8 },
  ],
  top_volume:    [],
  top_breakouts: [],
  opportunities_count: 5,
};

beforeEach(() => {
  mockGetRegime.mockReset();
  mockGetOpportunities.mockReset();
  mockGetMarketSummary.mockReset();
  // Non-critical — resolves with mock data by default so it doesn't break existing tests
  mockGetMarketSummary.mockResolvedValue(mockSummary);
  mockStore.regime = 'SIDEWAYS';
  mockStore.user   = null;
});

// ── Loading ───────────────────────────────────────────────────────────────────

describe('DashboardPage — loading', () => {
  it('shows skeleton while data loads', () => {
    mockGetRegime.mockReturnValue(new Promise(() => {}));
    mockGetOpportunities.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(document.querySelector('.shimmer')).toBeInTheDocument();
  });
});

// ── Success ───────────────────────────────────────────────────────────────────

describe('DashboardPage — success', () => {
  beforeEach(() => {
    mockGetRegime.mockResolvedValue(mockRegime);
    mockGetOpportunities.mockResolvedValue({
      total: 1, limit: 20, offset: 0, items: [mockOpp],
    });
  });

  it('renders opportunity symbol after load', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });
  });

  it('renders stock arabic name', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('بنك القاهرة')).toBeInTheDocument();
    });
  });

  it('renders R/R ratio', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/2\.1:1/)).toBeInTheDocument();
    });
  });

  it('renders total count badge', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('renders disclaimer text', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/ليست نصيحة استثمارية/)).toBeInTheDocument();
    });
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('DashboardPage — error', () => {
  beforeEach(() => {
    mockGetRegime.mockRejectedValue(new Error('Network error'));
    mockGetOpportunities.mockRejectedValue(new Error('Network error'));
  });

  it('shows error state after API failure', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows retry button', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/إعادة المحاولة/)).toBeInTheDocument();
    });
  });
});

// ── Sharia filter ─────────────────────────────────────────────────────────────

describe('DashboardPage — sharia filter', () => {
  beforeEach(() => {
    mockGetRegime.mockResolvedValue(mockRegime);
    mockGetOpportunities.mockResolvedValue({
      total: 0, limit: 20, offset: 0, items: [],
    });
  });

  it('calls setShariaFilter when filter is toggled', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('شريعة'));
    await user.click(screen.getByText('شريعة'));
    expect(mockStore.setShariaFilter).toHaveBeenCalledWith(true);
  });
});

// ── WGT-090: Market Pulse ─────────────────────────────────────────────────────

describe('DashboardPage — WGT-090 market pulse', () => {
  beforeEach(() => {
    mockGetRegime.mockResolvedValue(mockRegime);
    mockGetOpportunities.mockResolvedValue({
      total: 1, limit: 20, offset: 0, items: [mockOpp],
    });
  });

  it('renders WGT-090 widget after data loads', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-widget-id="WGT-090"]')).toBeInTheDocument();
    });
  });

  it('shows EGX30 label', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('EGX30')).toBeInTheDocument());
  });

  it('shows top sector name', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('البنوك')).toBeInTheDocument());
  });

  it('shows breadth advancing count', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText(/▲.*18/)).toBeInTheDocument());
  });

  it('shows opportunities count from summary', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
  });

  it('does not render WGT-090 when summary is unavailable', async () => {
    mockGetMarketSummary.mockRejectedValue(new Error('unavailable'));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('COMI'));
    expect(document.querySelector('[data-widget-id="WGT-090"]')).not.toBeInTheDocument();
  });
});

// ── WGT-091: Quick Actions ────────────────────────────────────────────────────

describe('DashboardPage — WGT-091 quick actions', () => {
  beforeEach(() => {
    mockGetRegime.mockResolvedValue(mockRegime);
    mockGetOpportunities.mockResolvedValue({
      total: 0, limit: 20, offset: 0, items: [],
    });
  });

  it('renders WGT-091 immediately (no API dependency)', () => {
    mockGetRegime.mockReturnValue(new Promise(() => {}));
    mockGetOpportunities.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(document.querySelector('[data-widget-id="WGT-091"]')).toBeInTheDocument();
  });

  it('renders discover link', () => {
    render(<DashboardPage />);
    expect(screen.getAllByRole('link', { name: /اكتشف/ }).length).toBeGreaterThan(0);
  });

  it('renders morning brief link', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('link', { name: /موجز صباحي/ })).toBeInTheDocument();
  });

  it('renders my day link', () => {
    render(<DashboardPage />);
    // Multiple links with يومي may exist (nav + quick action); just verify at least one
    expect(screen.getAllByRole('link', { name: /يومي/ }).length).toBeGreaterThan(0);
  });

  it('renders portfolio link', () => {
    render(<DashboardPage />);
    expect(screen.getAllByRole('link', { name: /محفظتي/ }).length).toBeGreaterThan(0);
  });

  it('renders watchlist link', () => {
    render(<DashboardPage />);
    expect(screen.getAllByRole('link', { name: /متابعة/ }).length).toBeGreaterThan(0);
  });

  it('shows PRO action tile when user is not pro', () => {
    render(<DashboardPage />);
    expect(screen.getAllByRole('link', { name: /PRO/ }).length).toBeGreaterThan(0);
  });

  it('hides PRO action tile when user is already pro', () => {
    mockStore.user = { id: 1, email: 'p@t.com', is_pro: true, name: null, created_at: '', referral_code: null, discount_credits: 0, referred_by_id: null, has_referral_discount: false };
    render(<DashboardPage />);
    // WGT-091 PRO tile should be gone; PRO badge may still appear in nav
    const wgt = document.querySelector('[data-widget-id="WGT-091"]');
    expect(wgt).not.toHaveTextContent('PRO ⭐');
  });
});

// ── WGT-092: Opportunities widget ID ─────────────────────────────────────────

describe('DashboardPage — WGT-092 widget id', () => {
  it('opportunities card has WGT-092 widget id', async () => {
    mockGetRegime.mockResolvedValue(mockRegime);
    mockGetOpportunities.mockResolvedValue({ total: 0, limit: 20, offset: 0, items: [] });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-widget-id="WGT-092"]')).toBeInTheDocument();
    });
  });
});
