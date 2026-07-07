/**
 * Tests for /performance page — WGT-100 / WGT-101 / WGT-102 / WGT-103
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock next/navigation ──────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/performance',
}));

// ── Mock next/link ────────────────────────────────────────────────────────────
jest.mock('next/link', () => {
  const Link = ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

// ── Mock store ────────────────────────────────────────────────────────────────
const mockStore = {
  lang:     'ar' as const,
  setLang:  jest.fn(),
  regime:   'SIDEWAYS' as 'SIDEWAYS' | 'BULL' | 'BEAR' | 'VOLATILE' | 'LOW_LIQUIDITY',
  user:     null as import('@/lib/types').User | null,
  logout:   jest.fn(),
  initAuth: jest.fn(),
};
jest.mock('@/lib/store', () => ({ useAppStore: () => mockStore }));

// ── Mock API ──────────────────────────────────────────────────────────────────
const mockGetPerformance = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { getPerformance: (...args: unknown[]) => mockGetPerformance(...args) },
}));

// ── Mock design-system ────────────────────────────────────────────────────────
jest.mock('@/design-system', () => ({
  Card:          ({ children, ...p }: { children: React.ReactNode; [k: string]: unknown }) => <div {...p}>{children}</div>,
  CardHeader:    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle:     ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardBody:      ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Badge:         ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  ErrorState:    ({ onRetry }: { onRetry: () => void }) => (
    <div>
      <span>خطأ في التحميل</span>
      <button onClick={onRetry}>إعادة المحاولة</button>
    </div>
  ),
  WidgetSkeleton: () => <div data-testid="skeleton" />,
}));

// ── Mock AppNav ───────────────────────────────────────────────────────────────
jest.mock('@/components', () => ({
  AppNav: () => <nav data-testid="app-nav" />,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
import type { PerformanceResponse } from '@/lib/types';

const mockOverall: PerformanceResponse['overall'] = {
  total: 812, closed: 812, wins: 258, losses: 401,
  win_rate: 31.8, avg_win_pct: 8.3, avg_loss_pct: -5.1,
  profit_factor: 1.188, expectancy: -0.74,
  avg_hold_days: 9.7, tp1_rate: 25.0, sl_rate: 49.4,
};

const mockPerformance: PerformanceResponse = {
  overall: mockOverall,
  by_year: [
    { year: 2023, total: 200, closed: 200, wins: 70, losses: 100,
      win_rate: 35.0, avg_win_pct: 9.0, avg_loss_pct: -5.5,
      profit_factor: 1.3, expectancy: 0.1, avg_hold_days: 10.0,
      tp1_rate: 30.0, sl_rate: 50.0 },
    { year: 2024, total: 300, closed: 300, wins: 90, losses: 160,
      win_rate: 30.0, avg_win_pct: 7.0, avg_loss_pct: -4.8,
      profit_factor: 1.1, expectancy: -0.3, avg_hold_days: 9.5,
      tp1_rate: 25.0, sl_rate: 53.3 },
  ],
  by_sector: [
    { sector: 'بنوك', total: 150, closed: 150, wins: 60, losses: 70,
      win_rate: 40.0, avg_win_pct: 10.0, avg_loss_pct: -5.0,
      profit_factor: 1.7, expectancy: 1.0, avg_hold_days: 8.0,
      tp1_rate: 35.0, sl_rate: 46.7 },
    { sector: 'عقارات', total: 100, closed: 100, wins: 30, losses: 60,
      win_rate: 30.0, avg_win_pct: 6.0, avg_loss_pct: -4.0,
      profit_factor: 0.9, expectancy: -0.5, avg_hold_days: 12.0,
      tp1_rate: 20.0, sl_rate: 60.0 },
  ],
  by_version: [
    { version: 'backtest_v1', total: 812, closed: 812, wins: 258, losses: 401,
      win_rate: 31.8, avg_win_pct: 8.3, avg_loss_pct: -5.1,
      profit_factor: 1.188, expectancy: -0.74, avg_hold_days: 9.7,
      tp1_rate: 25.0, sl_rate: 49.4 },
  ],
  top_stocks: [
    { symbol: 'COMI', name_ar: 'التجاري الدولي', sector: 'بنوك',
      total: 25, closed: 25, wins: 15, losses: 8,
      win_rate: 60.0, avg_win_pct: 12.0, avg_loss_pct: -5.0,
      profit_factor: 4.5, expectancy: 5.2, avg_hold_days: 7.0,
      tp1_rate: 52.0, sl_rate: 32.0 },
    { symbol: 'FAISAL', name_ar: 'فيصل', sector: 'بنوك',
      total: 10, closed: 10, wins: 3, losses: 6,
      win_rate: 30.0, avg_win_pct: 5.0, avg_loss_pct: -4.0,
      profit_factor: 0.6, expectancy: -1.3, avg_hold_days: 11.0,
      tp1_rate: 20.0, sl_rate: 60.0 },
  ],
};

// ── Import page ───────────────────────────────────────────────────────────────
import PerformancePage from '@/app/performance/page';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.user = null;
  mockGetPerformance.mockResolvedValue(mockPerformance);
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('Loading state', () => {
  it('shows skeleton while loading', () => {
    mockGetPerformance.mockReturnValue(new Promise(() => {}));
    render(<PerformancePage />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('Error state', () => {
  it('shows error UI when API fails', async () => {
    mockGetPerformance.mockRejectedValue(new Error('network'));
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText(/خطأ في التحميل/)).toBeInTheDocument()
    );
  });

  it('retry button calls API again', async () => {
    mockGetPerformance.mockRejectedValueOnce(new Error('network'));
    render(<PerformancePage />);
    await waitFor(() => screen.getByText(/إعادة المحاولة/));
    await userEvent.click(screen.getByText(/إعادة المحاولة/));
    expect(mockGetPerformance).toHaveBeenCalledTimes(2);
  });
});

// ── WGT-100: Overall stats ────────────────────────────────────────────────────

describe('WGT-100 Overall stats', () => {
  it('renders total trades count', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('812')).toBeInTheDocument()
    );
  });

  it('renders win rate', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('31.8%')).toBeInTheDocument()
    );
  });

  it('renders profit factor', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('1.188')).toBeInTheDocument()
    );
  });

  it('renders avg win pct', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('8.3%')).toBeInTheDocument()
    );
  });

  it('renders avg loss pct', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('-5.1%')).toBeInTheDocument()
    );
  });

  it('renders avg hold days', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('9.7')).toBeInTheDocument()
    );
  });

  it('renders disclaimer text', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText(/الأداء السابق لا يضمن/)).toBeInTheDocument()
    );
  });
});

// ── WGT-101: By year ──────────────────────────────────────────────────────────

describe('WGT-101 By year', () => {
  it('renders 2023 row', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('2023')).toBeInTheDocument()
    );
  });

  it('renders 2024 row', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('2024')).toBeInTheDocument()
    );
  });

  it('renders الأداء السنوي heading', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('الأداء السنوي')).toBeInTheDocument()
    );
  });
});

// ── WGT-102: By sector ────────────────────────────────────────────────────────

describe('WGT-102 By sector', () => {
  it('renders بنوك sector', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getAllByText('بنوك').length).toBeGreaterThan(0)
    );
  });

  it('renders عقارات sector', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('عقارات')).toBeInTheDocument()
    );
  });

  it('renders sector heading', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('الأداء بالقطاع')).toBeInTheDocument()
    );
  });
});

// ── WGT-103: Top stocks ───────────────────────────────────────────────────────

describe('WGT-103 Top stocks', () => {
  it('renders COMI link', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'COMI' })).toBeInTheDocument()
    );
  });

  it('renders FAISAL link', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'FAISAL' })).toBeInTheDocument()
    );
  });

  it('COMI links to stock page', async () => {
    render(<PerformancePage />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'COMI' });
      expect(link).toHaveAttribute('href', '/stocks/COMI');
    });
  });

  it('renders top stocks heading', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByText('أفضل الأسهم أداءً')).toBeInTheDocument()
    );
  });

  it('renders سجل الأداء page heading', async () => {
    render(<PerformancePage />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('سجل الأداء')
    );
  });
});
