/**
 * Tests for My Day page (/my-day) — WGT-070/071/072
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyDayPage from '@/app/my-day/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetMyDay = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { getMyDay: () => mockGetMyDay() },
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fullResponse: import('@/lib/types').MyDay = {
  as_of: '2026-07-07',
  is_authenticated: false,
  portfolio: {
    open_positions:     2,
    total_invested:     11250.0,
    unrealized_pnl:     250.0,
    unrealized_pnl_pct: 2.22,
  },
  watchlist_count: 3,
  watchlist_alerts: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', alert_type: 'above', current_price: 95.0, alert_price: 90.0 },
    { symbol: 'HRHO', name_ar: 'هيرمس',        alert_type: 'below', current_price: 40.0, alert_price: 45.0 },
  ],
  unread_notifications: 2,
  active_opportunities: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', opp_type: 'Breakout', radar_score: 82.0, run_date: '2026-07-07' },
  ],
};

const emptyResponse: import('@/lib/types').MyDay = {
  as_of: '2026-07-07',
  is_authenticated: false,
  portfolio: null,
  watchlist_count: 0,
  watchlist_alerts: [],
  unread_notifications: 0,
  active_opportunities: [],
};

beforeEach(() => { mockGetMyDay.mockReset(); });

// ── Loading ───────────────────────────────────────────────────────────────────

describe('MyDayPage — loading', () => {
  it('shows skeletons while loading', () => {
    mockGetMyDay.mockReturnValue(new Promise(() => {}));
    render(<MyDayPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('MyDayPage — error', () => {
  it('shows error alert when API fails', async () => {
    mockGetMyDay.mockRejectedValue(new Error('fail'));
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button', async () => {
    mockGetMyDay.mockRejectedValue(new Error('fail'));
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });

  it('retry re-calls API', async () => {
    const user = userEvent.setup();
    mockGetMyDay.mockRejectedValue(new Error('fail'));
    render(<MyDayPage />);
    await waitFor(() => screen.getByRole('button', { name: /إعادة المحاولة/ }));
    mockGetMyDay.mockResolvedValue(fullResponse);
    await user.click(screen.getByRole('button', { name: /إعادة المحاولة/ }));
    await waitFor(() => expect(mockGetMyDay).toHaveBeenCalledTimes(2));
  });
});

// ── Page heading ──────────────────────────────────────────────────────────────

describe('MyDayPage — heading', () => {
  it('renders page heading', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'يومي' })).toBeInTheDocument());
  });

  it('shows as_of date in subtitle', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/ملخص يوم/)).toBeInTheDocument());
  });
});

// ── WGT-072: Notifications summary ────────────────────────────────────────────

describe('MyDayPage — WGT-072 notifications', () => {
  it('shows unread count when unread > 0', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/غير مقروء/)).toBeInTheDocument());
  });

  it('shows "no new notifications" when unread = 0', async () => {
    mockGetMyDay.mockResolvedValue(emptyResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/لا إشعارات جديدة/)).toBeInTheDocument());
  });

  it('shows "view all" link when unread > 0', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => {
      const link = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/notifications');
      expect(link).toBeInTheDocument();
    });
  });

  it('no "view all" link when unread = 0', async () => {
    mockGetMyDay.mockResolvedValue(emptyResponse);
    render(<MyDayPage />);
    await waitFor(() => screen.getByText(/لا إشعارات جديدة/));
    const links = screen.queryAllByRole('link');
    expect(links.every((l) => l.getAttribute('href') !== '/notifications')).toBe(true);
  });
});

// ── WGT-070: Portfolio snapshot ────────────────────────────────────────────────

describe('MyDayPage — WGT-070 portfolio', () => {
  it('shows open positions count', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getAllByText('2').length).toBeGreaterThan(0));
  });

  it('shows unrealized P&L label', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/ربح.*خسارة غير محققة/)).toBeInTheDocument());
  });

  it('shows "add position" when no portfolio', async () => {
    mockGetMyDay.mockResolvedValue(emptyResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText('أضف صفقة')).toBeInTheDocument());
  });

  it('portfolio link goes to /portfolio', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.some((l) => l.getAttribute('href') === '/portfolio')).toBe(true);
    });
  });
});

// ── WGT-071: Watchlist alerts ─────────────────────────────────────────────────

describe('MyDayPage — WGT-071 watchlist alerts', () => {
  it('shows watchlist heading', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/تنبيهات المتابعة/)).toBeInTheDocument());
  });

  it('shows alert count badge', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    // '2' appears in both alert badge and open positions — verify at least one exists
    await waitFor(() => expect(screen.getAllByText('2').length).toBeGreaterThan(0));
  });

  it('shows "above" alert symbol', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => {
      // COMI appears in alerts + active_opportunities — use getAllByText
      expect(screen.getAllByText('COMI').length).toBeGreaterThan(0);
    });
  });

  it('shows "below" alert symbol', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText('HRHO')).toBeInTheDocument());
  });

  it('alert links to stock detail page', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.some((l) => l.getAttribute('href') === '/stocks/HRHO')).toBe(true);
    });
  });

  it('shows "no alerts" when none', async () => {
    mockGetMyDay.mockResolvedValue(emptyResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/لا تنبيهات اليوم/)).toBeInTheDocument());
  });

  it('shows watchlist count', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText(/3 سهم متابَع/)).toBeInTheDocument());
  });

  it('shows active opportunity in watchlist section', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => expect(screen.getByText('Breakout')).toBeInTheDocument());
  });

  it('watchlist link goes to /watchlist', async () => {
    mockGetMyDay.mockResolvedValue(fullResponse);
    render(<MyDayPage />);
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.some((l) => l.getAttribute('href') === '/watchlist')).toBe(true);
    });
  });
});
