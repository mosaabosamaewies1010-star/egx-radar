/**
 * E2E: Watchlist page (/watchlist) — WGT-031/032
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

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

function mockWatchlist(page: import('@playwright/test').Page, items = [baseItem]) {
  return page.route(`${BASE_API}/api/watchlist`, (route: Route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, count: items.length }),
      });
    } else {
      route.continue();
    }
  });
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('Watchlist page — load', () => {
  test('renders page heading', async ({ page }) => {
    await mockWatchlist(page, []);
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: 'قائمة المتابعة' })).toBeVisible();
  });

  test('shows empty state when no items', async ({ page }) => {
    await mockWatchlist(page, []);
    await page.goto('/watchlist');
    await expect(page.getByText(/لا توجد أسهم في قائمة المتابعة/)).toBeVisible();
  });

  test('renders item symbol', async ({ page }) => {
    await mockWatchlist(page, [baseItem]);
    await page.goto('/watchlist');
    await expect(page.getByText('COMI')).toBeVisible();
  });

  test('symbol links to stock page', async ({ page }) => {
    await mockWatchlist(page, [baseItem]);
    await page.goto('/watchlist');
    await expect(page.getByRole('link', { name: 'COMI' })).toHaveAttribute('href', '/stocks/COMI');
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/watchlist`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/watchlist');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

// ── Add form ──────────────────────────────────────────────────────────────────

test.describe('Watchlist page — add form', () => {
  test('add form expands on button click', async ({ page }) => {
    await mockWatchlist(page, []);
    await page.goto('/watchlist');
    await page.click('text=إضافة سهم للمتابعة');
    await expect(page.getByPlaceholder('COMI')).toBeVisible();
  });

  test('successfully adds a stock', async ({ page }) => {
    let callCount = 0;
    await page.route(`${BASE_API}/api/watchlist`, (route: Route) => {
      const method = route.request().method();
      if (method === 'GET') {
        callCount++;
        const items = callCount === 1 ? [] : [baseItem];
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items, count: items.length }),
        });
      } else if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(baseItem),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/watchlist');
    await page.click('text=إضافة سهم للمتابعة');
    await page.fill('[placeholder="COMI"]', 'COMI');
    await page.click('button:has-text("إضافة")');

    await expect(page.getByText('COMI')).toBeVisible({ timeout: 8_000 });
  });

  test('shows error on duplicate add', async ({ page }) => {
    await mockWatchlist(page, [baseItem]);
    await page.route(`${BASE_API}/api/watchlist`, (route: Route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'السهم موجود بالفعل في قائمة المتابعة' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/watchlist');
    await page.click('text=إضافة سهم للمتابعة');
    await page.fill('[placeholder="COMI"]', 'COMI');
    await page.click('button:has-text("إضافة")');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

// ── Nav link ──────────────────────────────────────────────────────────────────

test.describe('Watchlist nav link', () => {
  test('nav link exists and navigates to /watchlist', async ({ page }) => {
    await page.route(`${BASE_API}/api/watchlist`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], count: 0 }),
      })
    );
    await page.route(`${BASE_API}/**`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/');
    const link = page.getByRole('link', { name: /متابعة/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/watchlist', { timeout: 5_000 });
  });
});
