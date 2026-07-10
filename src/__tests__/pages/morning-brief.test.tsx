/**
 * Tests for Morning Brief page (/morning-brief) — WGT-060/061/062
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MorningBriefPage from '@/app/morning-brief/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetMorningBrief = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { getMorningBrief: () => mockGetMorningBrief() },
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fullResponse: import('@/lib/types').MorningBrief = {
  as_of: '2026-07-07',
  regime: {
    regime: 'BULL',
    confidence: 75.0,
    run_date: '2026-07-07',
    reason: { ar: 'السوق صاعد بقوة', en: 'Strong bull market' },
  },
  egx30_close: 31500.0,
  egx30_change_pct: 1.2,
  breadth: { advancing: 45, declining: 12, unchanged: 8 },
  top_scores: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', sector: 'البنوك', is_sharia: false, score: 82.0, last_change_pct: 1.5 },
    { symbol: 'AMOC', name_ar: 'ألكسندريا', sector: 'البتروكيماويات', is_sharia: true,  score: 74.0, last_change_pct: 0.3 },
    { symbol: 'HRHO', name_ar: 'هيرمس',      sector: 'الخدمات المالية', is_sharia: false, score: 61.0, last_change_pct: -0.8 },
  ],
  top_rvol: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', rvol: 1.8, score: 82.0 },
  ],
  new_opportunities: [
    {
      symbol: 'COMI', name_ar: 'بنك القاهرة',
      opp_type: 'Breakout',
      entry_price: 89.0, tp1_price: 95.0, sl_price: 85.0,
      radar_score: 82.0, signal_quality: 'HIGH', run_date: '2026-07-07',
    },
  ],
  opportunities_count: 1,
  scored_count: 65,
};

const emptyResponse: import('@/lib/types').MorningBrief = {
  as_of: null,
  regime: null,
  egx30_close: null,
  egx30_change_pct: null,
  breadth: null,
  top_scores: [],
  top_rvol: [],
  new_opportunities: [],
  opportunities_count: 0,
  scored_count: 0,
};

beforeEach(() => { mockGetMorningBrief.mockReset(); });

// ── Loading ───────────────────────────────────────────────────────────────────

describe('MorningBriefPage — loading', () => {
  it('shows skeletons while loading', () => {
    mockGetMorningBrief.mockReturnValue(new Promise(() => {}));
    render(<MorningBriefPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('MorningBriefPage — error', () => {
  it('shows error alert when API fails', async () => {
    mockGetMorningBrief.mockRejectedValue(new Error('fail'));
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button', async () => {
    mockGetMorningBrief.mockRejectedValue(new Error('fail'));
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });

  it('retry button re-calls API', async () => {
    const user = userEvent.setup();
    mockGetMorningBrief.mockRejectedValue(new Error('fail'));
    render(<MorningBriefPage />);
    await waitFor(() => screen.getByRole('button', { name: /إعادة المحاولة/ }));
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    await user.click(screen.getByRole('button', { name: /إعادة المحاولة/ }));
    await waitFor(() => expect(mockGetMorningBrief).toHaveBeenCalledTimes(2));
  });
});

// ── WGT-060: Regime banner ────────────────────────────────────────────────────

describe('MorningBriefPage — WGT-060 regime banner', () => {
  it('renders page heading', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'الموجز الصباحي' })).toBeInTheDocument());
  });

  it('shows regime label', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText('سوق صاعد')).toBeInTheDocument());
  });

  it('shows regime reason', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText('السوق صاعد بقوة')).toBeInTheDocument());
  });

  it('shows EGX30 label', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText('EGX30')).toBeInTheDocument());
  });

  it('shows advancing breadth', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/45.* صاعد/)).toBeInTheDocument());
  });

  it('shows declining breadth', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/12.* هابط/)).toBeInTheDocument());
  });

  it('shows as_of date', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/موجز يوم/)).toBeInTheDocument());
  });
});

// ── Summary metrics ───────────────────────────────────────────────────────────

describe('MorningBriefPage — summary metrics', () => {
  it('shows scored count', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText('65')).toBeInTheDocument());
  });

  it('shows opportunities count', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => {
      // opportunities_count = 1, scored_count = 65, both rendered
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThan(0);
    });
  });
});

// ── WGT-061: Top scores ───────────────────────────────────────────────────────

describe('MorningBriefPage — WGT-061 top scores', () => {
  it('renders top scores heading', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/أعلى درجات القوة/)).toBeInTheDocument());
  });

  it('renders stock symbols', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => {
      // COMI appears in both top_scores and new_opportunities — use getAllByText
      expect(screen.getAllByText('COMI').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AMOC').length).toBeGreaterThan(0);
    });
  });

  it('shows sharia badge', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText('شريعة')).toBeInTheDocument());
  });

  it('links to stock detail page', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.some((l) => l.getAttribute('href') === '/stocks/COMI')).toBe(true);
    });
  });

  it('shows empty state when no top scores', async () => {
    mockGetMorningBrief.mockResolvedValue(emptyResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد بيانات/)).toBeInTheDocument());
  });
});

// ── WGT-062: New opportunities ────────────────────────────────────────────────

describe('MorningBriefPage — WGT-062 new opportunities', () => {
  it('renders new opportunities heading', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/فرص جديدة/)).toBeInTheDocument());
  });

  it('shows opportunity type', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText('Breakout')).toBeInTheDocument());
  });

  it('shows entry/target/stop labels', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/دخول/)).toBeInTheDocument());
  });

  it('shows "no opportunities" when empty', async () => {
    mockGetMorningBrief.mockResolvedValue(emptyResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد فرص جديدة/)).toBeInTheDocument());
  });

  it('shows "view all opportunities" link', async () => {
    mockGetMorningBrief.mockResolvedValue(fullResponse);
    render(<MorningBriefPage />);
    await waitFor(() => expect(screen.getByText(/عرض كل الفرص/)).toBeInTheDocument());
  });
});
