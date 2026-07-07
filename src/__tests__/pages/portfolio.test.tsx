/**
 * Tests for Portfolio page (/portfolio) — WGT-022/023/024
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioPage from '@/app/portfolio/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetPortfolio = jest.fn();
const mockAddHolding   = jest.fn();
const mockCloseHolding = jest.fn();
const mockDeleteHolding = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    getPortfolio:  (...a: unknown[]) => mockGetPortfolio(...a),
    addHolding:    (...a: unknown[]) => mockAddHolding(...a),
    closeHolding:  (...a: unknown[]) => mockCloseHolding(...a),
    deleteHolding: (...a: unknown[]) => mockDeleteHolding(...a),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const emptySummary = {
  total_invested: 0,
  open_positions: 0,
  closed_positions: 0,
  total_realized_pnl: 0,
  total_unrealized_pnl: null,
};

const openHolding = {
  id: 1,
  user_id: null,
  stock_id: 1,
  symbol: 'COMI',
  name_ar: 'بنك القاهرة',
  quantity: 100,
  avg_cost: 87.5,
  currency: 'EGP',
  cost_basis: 8750,
  is_open: true,
  realized_pnl: null,
  current_price: 90.0,
  unrealized_pnl: 250.0,
  unrealized_pnl_pct: 2.86,
  opened_at: '2024-01-01T00:00:00',
  closed_at: null,
  close_price: null,
  notes: null,
};

const closedHolding = {
  ...openHolding,
  id: 2,
  symbol: 'HRHO',
  name_ar: 'هيرمس',
  is_open: false,
  closed_at: '2024-02-01T00:00:00',
  close_price: 95.0,
  realized_pnl: 750.0,
  unrealized_pnl: null,
  unrealized_pnl_pct: null,
};

const withOneSummary = {
  total_invested: 8750,
  open_positions: 1,
  closed_positions: 0,
  total_realized_pnl: 0,
  total_unrealized_pnl: 250,
};

beforeEach(() => {
  mockGetPortfolio.mockReset();
  mockAddHolding.mockReset();
  mockCloseHolding.mockReset();
  mockDeleteHolding.mockReset();
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('PortfolioPage — loading', () => {
  it('shows skeleton while loading', () => {
    // never resolves during this test
    mockGetPortfolio.mockReturnValue(new Promise(() => {}));
    render(<PortfolioPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('PortfolioPage — error', () => {
  it('shows error alert when API fails', async () => {
    mockGetPortfolio.mockRejectedValue(new Error('fail'));
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button on error', async () => {
    mockGetPortfolio.mockRejectedValue(new Error('fail'));
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });
});

// ── WGT-022: Summary bar ─────────────────────────────────────────────────────

describe('PortfolioPage — WGT-022 summary', () => {
  it('shows summary widget after load', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);
    await waitFor(() =>
      expect(document.querySelector('[data-widget-id="WGT-022"]')).toBeInTheDocument()
    );
  });

  it('shows total_invested value', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText(/إجمالي المستثمر/)).toBeInTheDocument());
  });

  it('shows open positions count', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText('مراكز مفتوحة')).toBeInTheDocument());
  });
});

// ── WGT-023: Holdings list ────────────────────────────────────────────────────

describe('PortfolioPage — WGT-023 holdings list', () => {
  it('shows empty state when no holdings', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد صفقات بعد/)).toBeInTheDocument());
  });

  it('renders open holding symbol', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText('COMI')).toBeInTheDocument());
  });

  it('renders holding name_ar', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText('بنك القاهرة')).toBeInTheDocument());
  });

  it('renders closed section when closed holdings exist', async () => {
    mockGetPortfolio.mockResolvedValue({
      summary: { ...withOneSummary, closed_positions: 1 },
      holdings: [openHolding, closedHolding],
    });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText(/مغلقة/)).toBeInTheDocument());
  });

  it('shows إغلاق button on open holdings', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText('إغلاق')).toBeInTheDocument());
  });

  it('calls deleteHolding when delete button clicked', async () => {
    const user = userEvent.setup();
    mockGetPortfolio.mockResolvedValue({ summary: withOneSummary, holdings: [openHolding] });
    mockDeleteHolding.mockResolvedValue(undefined);
    // second call for refresh
    mockGetPortfolio.mockResolvedValueOnce({ summary: withOneSummary, holdings: [openHolding] })
                    .mockResolvedValueOnce({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);

    await waitFor(() => expect(screen.getByLabelText('حذف')).toBeInTheDocument());
    await user.click(screen.getByLabelText('حذف'));

    await waitFor(() => expect(mockDeleteHolding).toHaveBeenCalledWith(openHolding.id));
  });
});

// ── WGT-024: Add form ─────────────────────────────────────────────────────────

describe('PortfolioPage — WGT-024 add form', () => {
  it('shows add form trigger button', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByText('إضافة صفقة جديدة')).toBeInTheDocument());
  });

  it('expands form on click', async () => {
    const user = userEvent.setup();
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);

    await waitFor(() => expect(screen.getByText('إضافة صفقة جديدة')).toBeInTheDocument());
    await user.click(screen.getByText('إضافة صفقة جديدة'));

    expect(screen.getByPlaceholderText('COMI')).toBeInTheDocument();
  });

  it('shows error when symbol is empty on submit', async () => {
    const user = userEvent.setup();
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);

    await waitFor(() => screen.getByText('إضافة صفقة جديدة'));
    await user.click(screen.getByText('إضافة صفقة جديدة'));
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('calls addHolding with correct data', async () => {
    const user = userEvent.setup();
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    mockAddHolding.mockResolvedValue(openHolding);
    // second call for refresh
    mockGetPortfolio.mockResolvedValueOnce({ summary: emptySummary, holdings: [] })
                    .mockResolvedValueOnce({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);

    await waitFor(() => screen.getByText('إضافة صفقة جديدة'));
    await user.click(screen.getByText('إضافة صفقة جديدة'));

    await user.type(screen.getByPlaceholderText('COMI'), 'COMI');
    await user.type(screen.getByPlaceholderText('100'), '100');
    await user.type(screen.getByPlaceholderText('87.50'), '87.5');
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() =>
      expect(mockAddHolding).toHaveBeenCalledWith({
        symbol: 'COMI',
        quantity: 100,
        avg_cost: 87.5,
        notes: undefined,
      })
    );
  });

  it('collapses form after successful add', async () => {
    const user = userEvent.setup();
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    mockAddHolding.mockResolvedValue(openHolding);
    mockGetPortfolio.mockResolvedValueOnce({ summary: emptySummary, holdings: [] })
                    .mockResolvedValueOnce({ summary: withOneSummary, holdings: [openHolding] });
    render(<PortfolioPage />);

    await waitFor(() => screen.getByText('إضافة صفقة جديدة'));
    await user.click(screen.getByText('إضافة صفقة جديدة'));
    await user.type(screen.getByPlaceholderText('COMI'), 'COMI');
    await user.type(screen.getByPlaceholderText('100'), '100');
    await user.type(screen.getByPlaceholderText('87.50'), '87.5');
    await user.click(screen.getByRole('button', { name: 'إضافة' }));

    await waitFor(() => expect(screen.queryByPlaceholderText('COMI')).not.toBeInTheDocument());
  });
});

// ── Page title ────────────────────────────────────────────────────────────────

describe('PortfolioPage — page heading', () => {
  it('shows page title محفظتي', async () => {
    mockGetPortfolio.mockResolvedValue({ summary: emptySummary, holdings: [] });
    render(<PortfolioPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'محفظتي' })).toBeInTheDocument());
  });
});
