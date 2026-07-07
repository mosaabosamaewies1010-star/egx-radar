/**
 * E2E: Notifications page (/notifications) — WGT-040/041
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const unreadItem = {
  id: 1,
  user_id: null,
  type: 'regime_change',
  title_ar: 'تغيّر مزاج السوق',
  body_ar: 'السوق انتقل إلى وضع صاعد',
  symbol: null as string | null,
  is_read: false,
  created_at: new Date().toISOString(),
};

const readItem = {
  id: 2,
  user_id: null,
  type: 'new_opportunity',
  title_ar: 'فرصة جديدة في COMI',
  body_ar: 'اختراق صاعد',
  symbol: 'COMI',
  is_read: true,
  created_at: new Date().toISOString(),
};

function mockNotifications(
  page: import('@playwright/test').Page,
  items = [unreadItem],
  unread = 1,
) {
  return page.route(`${BASE_API}/api/notifications*`, (route: Route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: items.length, unread, limit: 50, offset: 0, items }),
      });
    } else {
      route.continue();
    }
  });
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('Notifications page — load', () => {
  test('renders page heading', async ({ page }) => {
    await mockNotifications(page, []);
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: 'الإشعارات' })).toBeVisible();
  });

  test('shows empty state when no notifications', async ({ page }) => {
    await mockNotifications(page, [], 0);
    await page.goto('/notifications');
    await expect(page.getByText(/لا توجد إشعارات/)).toBeVisible();
  });

  test('renders notification title', async ({ page }) => {
    await mockNotifications(page, [unreadItem], 1);
    await page.goto('/notifications');
    await expect(page.getByText('تغيّر مزاج السوق')).toBeVisible();
  });

  test('shows unread count badge', async ({ page }) => {
    await mockNotifications(page, [unreadItem], 1);
    await page.goto('/notifications');
    await expect(page.getByText('1')).toBeVisible();
  });

  test('symbol links to stock page', async ({ page }) => {
    await mockNotifications(page, [unreadItem, readItem], 1);
    await page.goto('/notifications');
    await expect(page.getByRole('link', { name: 'COMI' })).toHaveAttribute('href', '/stocks/COMI');
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/notifications*`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/notifications');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

// ── Mark all read ─────────────────────────────────────────────────────────────

test.describe('Notifications page — mark all read', () => {
  test('mark-all button visible when unread exist', async ({ page }) => {
    await mockNotifications(page, [unreadItem], 1);
    await page.goto('/notifications');
    await expect(page.getByText(/تحديد الكل مقروء/)).toBeVisible();
  });

  test('mark all read calls PATCH read-all', async ({ page }) => {
    await mockNotifications(page, [unreadItem], 1);
    let patchCalled = false;
    await page.route(`${BASE_API}/api/notifications/read-all`, (route: Route) => {
      patchCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.goto('/notifications');
    await page.click('text=تحديد الكل مقروء');
    await expect(async () => { expect(patchCalled).toBe(true); }).toPass({ timeout: 5_000 });
  });
});

// ── Nav link ──────────────────────────────────────────────────────────────────

test.describe('Notifications nav link', () => {
  test('nav link exists and navigates to /notifications', async ({ page }) => {
    await page.route(`${BASE_API}/api/notifications*`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, unread: 0, limit: 50, offset: 0, items: [] }),
      })
    );
    await page.route(`${BASE_API}/**`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/');
    const link = page.getByRole('link', { name: /إشعارات/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/notifications', { timeout: 5_000 });
  });
});
