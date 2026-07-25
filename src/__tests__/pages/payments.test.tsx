/**
 * Tests for Payments page (/payments) — WGT-080/081
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsPage from '@/app/payments/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetPlans         = jest.fn();
const mockSubscribe        = jest.fn();
const mockGetPaymentHistory = jest.fn();
const mockConfirmPayment   = jest.fn();
const mockUseAppStore      = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    getPlans:           (...a: unknown[]) => mockGetPlans(...a),
    subscribe:          (...a: unknown[]) => mockSubscribe(...a),
    getPaymentHistory:  (...a: unknown[]) => mockGetPaymentHistory(...a),
    confirmPayment:     (...a: unknown[]) => mockConfirmPayment(...a),
  },
}));

jest.mock('@/lib/store', () => ({
  useAppStore: (...a: unknown[]) => mockUseAppStore(...a),
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FEATURES = ['قوة لجميع الأسهم', 'تنبيهات فورية', 'فرص التداول'];

const plansResponse: import('@/lib/types').PlansResponse = {
  features: FEATURES,
  plans: [
    { id: 'pro_monthly', name_ar: 'PRO شهري', price: 199, currency: 'EGP', period: 'monthly', savings: null, features: FEATURES },
    { id: 'pro_annual',  name_ar: 'PRO سنوي',  price: 1799, currency: 'EGP', period: 'annual', savings: '25%', features: FEATURES },
  ],
};

const emptyHistory: import('@/lib/types').PaymentHistoryResponse = { total: 0, items: [] };

const pendingPayment: import('@/lib/types').PaymentRecord = {
  id: 1, user_id: 1, plan: 'pro_monthly', amount: 199,
  currency: 'EGP', status: 'pending',
  provider_ref: 'EGX-ABCD1234', created_at: '2026-07-07T10:00:00',
};

const subscribeResponse: import('@/lib/types').SubscribeResponse = {
  payment:      pendingPayment,
  provider_ref: 'EGX-ABCD1234',
  instructions: 'أرسل المبلغ عبر InstaPay مع ذكر رقم المرجع',
};

const completedPayment: import('@/lib/types').PaymentRecord = { ...pendingPayment, status: 'completed' };
const confirmResponse:  import('@/lib/types').ConfirmResponse = { payment: completedPayment, is_pro: true };

const historyWithOne: import('@/lib/types').PaymentHistoryResponse = {
  total: 1,
  items: [completedPayment],
};

// ── Setup helpers ─────────────────────────────────────────────────────────────

function setupAnonymous() {
  mockUseAppStore.mockReturnValue({ user: null });
  mockGetPlans.mockResolvedValue(plansResponse);
}

function setupFreeUser() {
  mockUseAppStore.mockReturnValue({ user: { id: 1, email: 'u@t.com', is_pro: false, name: null, created_at: '' } });
  mockGetPlans.mockResolvedValue(plansResponse);
  mockGetPaymentHistory.mockResolvedValue(emptyHistory);
}

function setupProUser() {
  mockUseAppStore.mockReturnValue({ user: { id: 2, email: 'p@t.com', is_pro: true, name: null, created_at: '' } });
  mockGetPlans.mockResolvedValue(plansResponse);
  mockGetPaymentHistory.mockResolvedValue(historyWithOne);
}

beforeEach(() => {
  mockGetPlans.mockReset();
  mockSubscribe.mockReset();
  mockGetPaymentHistory.mockReset();
  mockConfirmPayment.mockReset();
  mockUseAppStore.mockReset();
});

// ── Loading ───────────────────────────────────────────────────────────────────

describe('PaymentsPage — loading', () => {
  it('shows skeletons while loading', () => {
    setupAnonymous();
    mockGetPlans.mockReturnValue(new Promise(() => {}));
    render(<PaymentsPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('PaymentsPage — error', () => {
  it('shows error alert when plans API fails', async () => {
    setupAnonymous();
    mockGetPlans.mockRejectedValue(new Error('fail'));
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
  });

  it('shows retry button', async () => {
    setupAnonymous();
    mockGetPlans.mockRejectedValue(new Error('fail'));
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });
});

// ── Page heading ──────────────────────────────────────────────────────────────

describe('PaymentsPage — heading', () => {
  it('renders page heading', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /الاشتراك في PRO/ })).toBeInTheDocument());
  });
});

// ── WGT-080: Plan cards ───────────────────────────────────────────────────────

describe('PaymentsPage — WGT-080 plan cards', () => {
  it('renders monthly plan', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText('PRO شهري')).toBeInTheDocument());
  });

  it('renders annual plan', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText('PRO سنوي')).toBeInTheDocument());
  });

  it('shows savings badge on annual', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText(/وفّر.*25/)).toBeInTheDocument());
  });

  it('renders plan features', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getAllByText('قوة لجميع الأسهم').length).toBeGreaterThan(0));
  });

  it('subscribe buttons present for anonymous', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => {
      const btns = screen.getAllByRole('button', { name: /اشترك الآن/ });
      expect(btns.length).toBe(2);
    });
  });

  it('error shown when anonymous user clicks subscribe', async () => {
    const user = userEvent.setup();
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => screen.getAllByRole('button', { name: /اشترك الآن/ }));
    await user.click(screen.getAllByRole('button', { name: /اشترك الآن/ })[0]);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('hides plan cards for PRO user', async () => {
    setupProUser();
    render(<PaymentsPage />);
    await waitFor(() => screen.getByText(/أنت مشترك بالفعل/));
    expect(screen.queryByRole('button', { name: /اشترك الآن/ })).not.toBeInTheDocument();
  });
});

// ── Subscribe flow ────────────────────────────────────────────────────────────

describe('PaymentsPage — subscribe flow', () => {
  it('shows pending banner after subscribe', async () => {
    const user = userEvent.setup();
    setupFreeUser();
    mockSubscribe.mockResolvedValue(subscribeResponse);
    render(<PaymentsPage />);
    await waitFor(() => screen.getAllByRole('button', { name: /اشترك الآن/ }));
    await user.click(screen.getAllByRole('button', { name: /اشترك الآن/ })[0]);
    await waitFor(() => expect(screen.getByTestId('pending-banner')).toBeInTheDocument());
  });

  it('shows provider ref in pending banner', async () => {
    const user = userEvent.setup();
    setupFreeUser();
    mockSubscribe.mockResolvedValue(subscribeResponse);
    render(<PaymentsPage />);
    await waitFor(() => screen.getAllByRole('button', { name: /اشترك الآن/ }));
    await user.click(screen.getAllByRole('button', { name: /اشترك الآن/ })[0]);
    await waitFor(() => {
      const banner = screen.getByTestId('pending-banner');
      expect(banner).toHaveTextContent('EGX-ABCD1234');
    });
  });

  it('shows success message after confirm', async () => {
    const user = userEvent.setup();
    setupFreeUser();
    mockSubscribe.mockResolvedValue(subscribeResponse);
    mockConfirmPayment.mockResolvedValue(confirmResponse);
    render(<PaymentsPage />);
    await waitFor(() => screen.getAllByRole('button', { name: /اشترك الآن/ }));
    await user.click(screen.getAllByRole('button', { name: /اشترك الآن/ })[0]);
    await waitFor(() => screen.getByRole('button', { name: /تأكيد الدفع/ }));
    await user.click(screen.getByRole('button', { name: /تأكيد الدفع/ }));
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
  });
});

// ── WGT-081: Billing history ──────────────────────────────────────────────────

describe('PaymentsPage — WGT-081 billing history', () => {
  it('shows billing history section for logged-in user', async () => {
    setupFreeUser();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText('سجل الفواتير')).toBeInTheDocument());
  });

  it('shows "no payments" when history is empty', async () => {
    setupFreeUser();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد مدفوعات سابقة/)).toBeInTheDocument());
  });

  it('hides billing history for anonymous user', async () => {
    setupAnonymous();
    render(<PaymentsPage />);
    await waitFor(() => screen.getByText('PRO شهري'));
    expect(screen.queryByText('سجل الفواتير')).not.toBeInTheDocument();
  });

  it('shows completed payment in history', async () => {
    setupProUser();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText('مكتملة')).toBeInTheDocument());
  });

  it('shows provider_ref in history', async () => {
    setupProUser();
    render(<PaymentsPage />);
    await waitFor(() => expect(screen.getByText(/EGX-ABCD1234/)).toBeInTheDocument());
  });
});
