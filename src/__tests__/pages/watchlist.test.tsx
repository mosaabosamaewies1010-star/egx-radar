/**
 * Tests for Watchlist page (/watchlist) — WGT-031/032
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WatchlistPage from '@/app/watchlist/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetWatchlist       = jest.fn();
const mockAddToWatchlist     = jest.fn();
const mockUpdateWatchlistItem = jest.fn();
const mockRemoveFromWatchlist = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    getWatchlist:        (...a: unknown[]) => mockGetWatchlist(...a),
    addToWatchlist:      (...a: unknown[]) => mockAddToWatchlist(...a),
    updateWatchlistItem: (...a: unknown[]) => mockUpdateWatchlistItem(...a),
    removeFromWatchlist: (...a: unknown[]) => mockRemoveFromWatchlist(...a),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseItem = {
  id: 1,
  user_id: null,
  stock_id: 1,
  symbol: 'COMI',
  name_ar: 'بنك القاهرة',
  notes: null,
  alert_price_above: null,
  alert_price_below: null,
  last_price: 90.0,
  last_change_pct: 1.5,
  sector: 'البنوك',
  is_sharia: false,
  created_at: '2026-01-01T00:00:00',
};

const itemWithAlerts = {
  ...baseItem,
  id: 2,
  symbol: 'HRHO',
  name_ar: 'هيرمس',
  alert_price_above: 100.0,
  alert_price_below: 80.0,
};

beforeEach(() => {
  mockGetWatchlist.mockReset();
  mockAddToWatchlist.mockReset();
  mockUpdateWatchlistItem.mockReset();
  mockRemoveFromWatchlist.mockReset();
});

// ── Loading ───────────────────────────────────────────────────────────────────

describe('WatchlistPage — loading', () => {
  it('shows skeleton while loading', () => {
    mockGetWatchlist.mockReturnValue(new Promise(() => {}));
    render(<WatchlistPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('WatchlistPage — error', () => {
  it('shows error alert when API fails', async () => {
    mockGetWatchlist.mockRejectedValue(new Error('fail'));
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button on error', async () => {
    mockGetWatchlist.mockRejectedValue(new Error('fail'));
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });
});

// ── WGT-031: List ─────────────────────────────────────────────────────────────

describe('WatchlistPage — WGT-031 list', () => {
  it('shows page heading', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'قائمة المتابعة' })).toBeInTheDocument());
  });

  it('shows empty state when no items', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد أسهم في قائمة المتابعة/)).toBeInTheDocument());
  });

  it('renders item symbol', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByText('COMI')).toBeInTheDocument());
  });

  it('renders item name_ar', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByText('بنك القاهرة')).toBeInTheDocument());
  });

  it('renders sector', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByText('البنوك')).toBeInTheDocument());
  });

  it('renders item count in card header', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [baseItem, itemWithAlerts], count: 2 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByText('2 سهم')).toBeInTheDocument());
  });

  it('symbol is a link to /stocks/<symbol>', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'COMI' });
      expect(link).toHaveAttribute('href', '/stocks/COMI');
    });
  });

  it('calls removeFromWatchlist when delete button clicked', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    mockRemoveFromWatchlist.mockResolvedValue(undefined);
    render(<WatchlistPage />);

    await waitFor(() => expect(screen.getByLabelText('حذف')).toBeInTheDocument());
    await user.click(screen.getByLabelText('حذف'));

    await waitFor(() => expect(mockRemoveFromWatchlist).toHaveBeenCalledWith(baseItem.id));
  });

  it('removes item from UI after delete', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    mockRemoveFromWatchlist.mockResolvedValue(undefined);
    render(<WatchlistPage />);

    await waitFor(() => expect(screen.getByText('COMI')).toBeInTheDocument());
    await user.click(screen.getByLabelText('حذف'));

    await waitFor(() => expect(screen.queryByText('COMI')).not.toBeInTheDocument());
  });
});

// ── WGT-032: Add form ─────────────────────────────────────────────────────────

describe('WatchlistPage — WGT-032 add form', () => {
  it('shows add form trigger button', async () => {
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    render(<WatchlistPage />);
    await waitFor(() => expect(screen.getByText('إضافة سهم للمتابعة')).toBeInTheDocument());
  });

  it('expands form on click', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    render(<WatchlistPage />);

    await waitFor(() => screen.getByText('إضافة سهم للمتابعة'));
    await user.click(screen.getByText('إضافة سهم للمتابعة'));

    expect(screen.getByPlaceholderText('COMI')).toBeInTheDocument();
  });

  it('shows validation error when symbol is empty', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    render(<WatchlistPage />);

    await waitFor(() => screen.getByText('إضافة سهم للمتابعة'));
    await user.click(screen.getByText('إضافة سهم للمتابعة'));
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('calls addToWatchlist with symbol', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    mockAddToWatchlist.mockResolvedValue(baseItem);
    mockGetWatchlist.mockResolvedValueOnce({ items: [], count: 0 })
                    .mockResolvedValueOnce({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);

    await waitFor(() => screen.getByText('إضافة سهم للمتابعة'));
    await user.click(screen.getByText('إضافة سهم للمتابعة'));
    await user.type(screen.getByPlaceholderText('COMI'), 'COMI');
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() =>
      expect(mockAddToWatchlist).toHaveBeenCalledWith({ symbol: 'COMI', notes: undefined })
    );
  });

  it('shows error when duplicate symbol added', async () => {
    const user = userEvent.setup();
    const { ApiError } = jest.requireMock('@/lib/api') as {
      ApiError: new (status: number, msg: string) => Error;
    };
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    mockAddToWatchlist.mockRejectedValue(
      new ApiError(409, JSON.stringify({ error: 'السهم موجود بالفعل في قائمة المتابعة' }))
    );
    render(<WatchlistPage />);

    await waitFor(() => screen.getByText('إضافة سهم للمتابعة'));
    await user.click(screen.getByText('إضافة سهم للمتابعة'));
    await user.type(screen.getByPlaceholderText('COMI'), 'COMI');
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('collapses form after successful add', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [], count: 0 });
    mockAddToWatchlist.mockResolvedValue(baseItem);
    mockGetWatchlist.mockResolvedValueOnce({ items: [], count: 0 })
                    .mockResolvedValueOnce({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);

    await waitFor(() => screen.getByText('إضافة سهم للمتابعة'));
    await user.click(screen.getByText('إضافة سهم للمتابعة'));
    await user.type(screen.getByPlaceholderText('COMI'), 'COMI');
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() => expect(screen.queryByPlaceholderText('COMI')).not.toBeInTheDocument());
  });
});

// ── Inline edit ───────────────────────────────────────────────────────────────

describe('WatchlistPage — inline edit', () => {
  it('edit form expands when تعديل clicked', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    render(<WatchlistPage />);

    await waitFor(() => expect(screen.getByLabelText('تعديل')).toBeInTheDocument());
    await user.click(screen.getByLabelText('تعديل'));

    expect(screen.getByPlaceholderText('سبب الاهتمام...')).toBeInTheDocument();
  });

  it('calls updateWatchlistItem on save', async () => {
    const user = userEvent.setup();
    mockGetWatchlist.mockResolvedValue({ items: [baseItem], count: 1 });
    mockUpdateWatchlistItem.mockResolvedValue({ ...baseItem, notes: 'ملاحظة' });
    render(<WatchlistPage />);

    await waitFor(() => expect(screen.getByLabelText('تعديل')).toBeInTheDocument());
    await user.click(screen.getByLabelText('تعديل'));
    await user.type(screen.getByPlaceholderText('سبب الاهتمام...'), 'ملاحظة');
    await user.click(screen.getByRole('button', { name: 'حفظ' }));

    await waitFor(() =>
      expect(mockUpdateWatchlistItem).toHaveBeenCalledWith(
        baseItem.id,
        expect.objectContaining({ notes: 'ملاحظة' })
      )
    );
  });
});
