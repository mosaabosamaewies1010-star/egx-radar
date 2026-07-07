/**
 * Tests for Notifications page (/notifications) — WGT-040/041
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPage from '@/app/notifications/page';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetNotifications        = jest.fn();
const mockMarkNotificationRead    = jest.fn();
const mockMarkAllNotificationsRead = jest.fn();
const mockDeleteNotification      = jest.fn();
const mockClearReadNotifications  = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    getNotifications:         (...a: unknown[]) => mockGetNotifications(...a),
    markNotificationRead:     (...a: unknown[]) => mockMarkNotificationRead(...a),
    markAllNotificationsRead: (...a: unknown[]) => mockMarkAllNotificationsRead(...a),
    deleteNotification:       (...a: unknown[]) => mockDeleteNotification(...a),
    clearReadNotifications:   (...a: unknown[]) => mockClearReadNotifications(...a),
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

const unreadItem: import('@/lib/types').NotificationItem = {
  id: 1,
  user_id: null,
  type: 'regime_change',
  title_ar: 'تغيّر مزاج السوق',
  body_ar: 'السوق انتقل إلى وضع صاعد',
  symbol: null,
  is_read: false,
  created_at: new Date().toISOString(),
};

const readItem: import('@/lib/types').NotificationItem = {
  id: 2,
  user_id: null,
  type: 'new_opportunity',
  title_ar: 'فرصة جديدة في COMI',
  body_ar: 'اختراق صاعد مع حجم مرتفع',
  symbol: 'COMI',
  is_read: true,
  created_at: new Date().toISOString(),
};

const emptyResponse = { total: 0, unread: 0, limit: 50, offset: 0, items: [] };
const withTwo = { total: 2, unread: 1, limit: 50, offset: 0, items: [unreadItem, readItem] };

beforeEach(() => {
  mockGetNotifications.mockReset();
  mockMarkNotificationRead.mockReset();
  mockMarkAllNotificationsRead.mockReset();
  mockDeleteNotification.mockReset();
  mockClearReadNotifications.mockReset();
});

// ── Loading ───────────────────────────────────────────────────────────────────

describe('NotificationsPage — loading', () => {
  it('shows skeleton while loading', () => {
    mockGetNotifications.mockReturnValue(new Promise(() => {}));
    render(<NotificationsPage />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('NotificationsPage — error', () => {
  it('shows error alert when API fails', async () => {
    mockGetNotifications.mockRejectedValue(new Error('fail'));
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows retry button on error', async () => {
    mockGetNotifications.mockRejectedValue(new Error('fail'));
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument());
  });
});

// ── WGT-041: List ─────────────────────────────────────────────────────────────

describe('NotificationsPage — list', () => {
  it('renders page heading', async () => {
    mockGetNotifications.mockResolvedValue(emptyResponse);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'الإشعارات' })).toBeInTheDocument());
  });

  it('shows empty state when no notifications', async () => {
    mockGetNotifications.mockResolvedValue(emptyResponse);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText(/لا توجد إشعارات/)).toBeInTheDocument());
  });

  it('renders unread item title', async () => {
    mockGetNotifications.mockResolvedValue(withTwo);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText('تغيّر مزاج السوق')).toBeInTheDocument());
  });

  it('renders read item title', async () => {
    mockGetNotifications.mockResolvedValue(withTwo);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText('فرصة جديدة في COMI')).toBeInTheDocument());
  });

  it('shows unread badge count', async () => {
    mockGetNotifications.mockResolvedValue(withTwo);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('symbol links to stock page', async () => {
    mockGetNotifications.mockResolvedValue(withTwo);
    render(<NotificationsPage />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'COMI' });
      expect(link).toHaveAttribute('href', '/stocks/COMI');
    });
  });

  it('shows "تحديد كمقروء" button when unread exist', async () => {
    mockGetNotifications.mockResolvedValue(withTwo);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText(/تحديد الكل مقروء/)).toBeInTheDocument());
  });

  it('shows "مسح المقروءة" button when read items exist', async () => {
    mockGetNotifications.mockResolvedValue(withTwo);
    render(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText(/مسح المقروءة/)).toBeInTheDocument());
  });

  it('does not show mark-all button when no unread', async () => {
    mockGetNotifications.mockResolvedValue({ ...emptyResponse, items: [readItem], total: 1 });
    render(<NotificationsPage />);
    await waitFor(() => screen.getByText('فرصة جديدة في COMI'));
    expect(screen.queryByText(/تحديد الكل مقروء/)).not.toBeInTheDocument();
  });
});

// ── Mark single read ──────────────────────────────────────────────────────────

describe('NotificationsPage — mark read', () => {
  it('calls markNotificationRead when checkmark clicked', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue(withTwo);
    mockMarkNotificationRead.mockResolvedValue({ ...unreadItem, is_read: true });
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByLabelText('تحديد كمقروء')).toBeInTheDocument());
    await user.click(screen.getByLabelText('تحديد كمقروء'));

    await waitFor(() => expect(mockMarkNotificationRead).toHaveBeenCalledWith(unreadItem.id));
  });

  it('hides mark-read button after marking', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue(withTwo);
    mockMarkNotificationRead.mockResolvedValue({ ...unreadItem, is_read: true });
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByLabelText('تحديد كمقروء')).toBeInTheDocument());
    await user.click(screen.getByLabelText('تحديد كمقروء'));

    await waitFor(() => expect(screen.queryByLabelText('تحديد كمقروء')).not.toBeInTheDocument());
  });
});

// ── Mark all read ─────────────────────────────────────────────────────────────

describe('NotificationsPage — mark all read', () => {
  it('calls markAllNotificationsRead', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue(withTwo);
    mockMarkAllNotificationsRead.mockResolvedValue({ ok: true });
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText(/تحديد الكل مقروء/)).toBeInTheDocument());
    await user.click(screen.getByText(/تحديد الكل مقروء/));

    await waitFor(() => expect(mockMarkAllNotificationsRead).toHaveBeenCalled());
  });

  it('hides mark-all button after marking all', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue(withTwo);
    mockMarkAllNotificationsRead.mockResolvedValue({ ok: true });
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText(/تحديد الكل مقروء/)).toBeInTheDocument());
    await user.click(screen.getByText(/تحديد الكل مقروء/));

    await waitFor(() => expect(screen.queryByText(/تحديد الكل مقروء/)).not.toBeInTheDocument());
  });
});

// ── Delete ────────────────────────────────────────────────────────────────────

describe('NotificationsPage — delete', () => {
  it('calls deleteNotification when X clicked', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue({ ...emptyResponse, items: [unreadItem], total: 1, unread: 1 });
    mockDeleteNotification.mockResolvedValue(undefined);
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getAllByLabelText('حذف').length).toBeGreaterThan(0));
    await user.click(screen.getAllByLabelText('حذف')[0]);

    await waitFor(() => expect(mockDeleteNotification).toHaveBeenCalledWith(unreadItem.id));
  });

  it('removes item from list after deletion', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue({ ...emptyResponse, items: [unreadItem], total: 1, unread: 1 });
    mockDeleteNotification.mockResolvedValue(undefined);
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText('تغيّر مزاج السوق')).toBeInTheDocument());
    await user.click(screen.getByLabelText('حذف'));

    await waitFor(() => expect(screen.queryByText('تغيّر مزاج السوق')).not.toBeInTheDocument());
  });
});

// ── Clear read ────────────────────────────────────────────────────────────────

describe('NotificationsPage — clear read', () => {
  it('calls clearReadNotifications', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue(withTwo);
    mockClearReadNotifications.mockResolvedValue({ ok: true });
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText(/مسح المقروءة/)).toBeInTheDocument());
    await user.click(screen.getByText(/مسح المقروءة/));

    await waitFor(() => expect(mockClearReadNotifications).toHaveBeenCalled());
  });

  it('removes read items from list after clearing', async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue(withTwo);
    mockClearReadNotifications.mockResolvedValue({ ok: true });
    render(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText('فرصة جديدة في COMI')).toBeInTheDocument());
    await user.click(screen.getByText(/مسح المقروءة/));

    await waitFor(() => expect(screen.queryByText('فرصة جديدة في COMI')).not.toBeInTheDocument());
  });
});
