/**
 * E2E: My Day page (/my-day) — WGT-070/071/072
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const fullResponse = {
  as_of: '2026-07-07',
  is_authenticated: false,
  portfolio: {
    open_positions: 2,
    total_invested: 11250.0,
    unrealized_pnl: 250.0,
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

function mockMyDay(page: import('@playwright/test').Page, response = fullResponse) {
  return page.route(`${BASE_API}/api/my-day`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
  );
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('My Day — load', () => {
  test('renders page heading', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.getByRole('heading', { name: 'يومي' })).toBeVisible();
  });

  test('shows unread notifications count', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.getByText(/غير مقروء/)).toBeVisible();
  });

  test('shows portfolio open positions', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.getByText('2')).toBeVisible();
  });

  test('shows watchlist alert for COMI', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.getByText('COMI').first()).toBeVisible();
  });

  test('shows watchlist alert for HRHO', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.getByText('HRHO')).toBeVisible();
  });

  test('shows opportunity type', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.getByText('Breakout')).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/my-day`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/my-day');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });

  test('links to stock detail page', async ({ page }) => {
    await mockMyDay(page);
    await page.goto('/my-day');
    await expect(page.locator('a[href="/stocks/HRHO"]')).toBeVisible();
  });
});

// ── Nav ───────────────────────────────────────────────────────────────────────

test.describe('My Day nav link', () => {
  test('nav link navigates to /my-day', async ({ page }) => {
    await mockMyDay(page);
    await page.route(`${BASE_API}/**`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/');
    const link = page.getByRole('link', { name: /يومي/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/my-day', { timeout: 5_000 });
  });
});
