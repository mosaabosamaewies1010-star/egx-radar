/**
 * Tests for Discover page (/discover) — WGT-050/051/052
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiscoverPage from '@/app/discover/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDiscover = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { discover: (...a: unknown[]) => mockDiscover(...a) },
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeItem = (overrides = {}): import('@/lib/types').DiscoverItem => ({
  symbol:          'COMI',
  name_ar:         'بنك القاهرة',
  sector:          'البنوك',
  is_sharia:       false,
  score:           82.0,
  run_date:        '2026-07-07',
  data_quality:    'HIGH',
  last_price:      90.0,
  last_change_pct: 1.5,
  rsi:             55.0,
  adx:             28.0,
  rvol:            1.8,
  obv_trend:       'UP',
  has_opportunity: false,
  opp_type:        null,
  ...overrides,
});

const shariaItem = makeItem({
  symbol: 'AMOC', name_ar: 'ألكسندريا', sector: 'البتروكيماويات',
  is_sharia: true, score: 74.0,
});

const oppItem = makeItem({
  symbol: 'HRHO', name_ar: 'هيرمس', sector: 'الخدمات المالية',
  score: 61.0, has_opportunity: true, opp_type: 'Breakout',
});

const emptyResponse = { total: 0, limit: 60, offset: 0, sort: 'score', sectors: [], items: [] };

const fullResponse = {
  total: 3, limit: 60, offset: 0, sort: 'score',
  sectors: ['البنوك', 'البتروكيماويات', 'الخدمات المالية'],
  items: [makeItem(), shariaItem, oppItem],
};

beforeEach(() => { mockDiscover.mockReset(); });

// ── Loading ───────────────────────────────────────────────────────────────────

describe('DiscoverPage — loading', () => {
  it('shows skeletons while loading', () => {
    mockDiscover.mockReturnValue(new Promise(() => {}));
    render(<DiscoverPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('DiscoverPage — error', () => {
  it('shows error alert when API fails', async () => {
    mockDiscover.mockRejectedValue(new Error('fail'));
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button on error', async () => {
    mockDiscover.mockRejectedValue(new Error('fail'));
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });
});

// ── WGT-050: Stock cards ──────────────────────────────────────────────────────

describe('DiscoverPage — WGT-050 stock cards', () => {
  it('renders page heading', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'اكتشف الأسهم' })).toBeInTheDocument());
  });

  it('renders stock symbol', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText('COMI')).toBeInTheDocument());
  });

  it('renders stock name_ar', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText('بنك القاهرة')).toBeInTheDocument());
  });

  it('shows sharia badge for sharia stocks', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText('شريعة')).toBeInTheDocument());
  });

  it('shows opportunity badge for stocks with opportunity', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText('Breakout')).toBeInTheDocument());
  });

  it('card links to stock detail page', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => {
      const link = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/stocks/COMI');
      expect(link).toBeInTheDocument();
    });
  });

  it('shows results count', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText(/3 سهم مطابق/)).toBeInTheDocument());
  });

  it('shows empty state when no results', async () => {
    mockDiscover.mockResolvedValue(emptyResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد أسهم تطابق/)).toBeInTheDocument());
  });
});

// ── WGT-051: Filter bar ───────────────────────────────────────────────────────

describe('DiscoverPage — WGT-051 filter bar', () => {
  it('renders sector dropdown', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByLabelText('القطاع')).toBeInTheDocument());
  });

  it('renders sort dropdown', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByLabelText('الترتيب')).toBeInTheDocument());
  });

  it('renders sharia checkbox', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText('شريعة فقط')).toBeInTheDocument());
  });

  it('renders opp_only checkbox', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByText('ذات فرصة فقط')).toBeInTheDocument());
  });

  it('sector options populated from API response', async () => {
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'البنوك' })).toBeInTheDocument());
  });

  it('changing sector dropdown re-calls discover', async () => {
    const user = userEvent.setup();
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    // wait until sector options are populated from API response
    await waitFor(() => expect(screen.getByRole('option', { name: 'البنوك' })).toBeInTheDocument());

    mockDiscover.mockResolvedValue({ ...emptyResponse, total: 1, items: [makeItem()] });
    await user.selectOptions(screen.getByLabelText('القطاع'), 'البنوك');

    await waitFor(() => expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({ sector: 'البنوك' })
    ));
  });

  it('toggling sharia checkbox re-calls discover', async () => {
    const user = userEvent.setup();
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => screen.getByText('شريعة فقط'));

    mockDiscover.mockResolvedValue(emptyResponse);
    await user.click(screen.getByRole('checkbox', { name: 'شريعة فقط' }));

    await waitFor(() => expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({ sharia: true })
    ));
  });

  it('reset button appears when filters changed', async () => {
    const user = userEvent.setup();
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => screen.getByText('شريعة فقط'));

    await user.click(screen.getByRole('checkbox', { name: 'شريعة فقط' }));
    await waitFor(() => expect(screen.getByLabelText('إعادة ضبط الفلاتر')).toBeInTheDocument());
  });

  it('reset button resets filters and re-calls discover', async () => {
    const user = userEvent.setup();
    mockDiscover.mockResolvedValue(fullResponse);
    render(<DiscoverPage />);
    await waitFor(() => screen.getByText('شريعة فقط'));

    await user.click(screen.getByRole('checkbox', { name: 'شريعة فقط' }));
    await waitFor(() => expect(screen.getByLabelText('إعادة ضبط الفلاتر')).toBeInTheDocument());

    mockDiscover.mockResolvedValue(fullResponse);
    await user.click(screen.getByLabelText('إعادة ضبط الفلاتر'));

    await waitFor(() => expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({ sharia: undefined })
    ));
  });
});
