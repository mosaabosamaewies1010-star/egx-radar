/**
 * E2E: Discover page (/discover) — WGT-050/051/052
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const items = [
  {
    symbol: 'COMI', name_ar: 'بنك القاهرة', sector: 'البنوك',
    is_sharia: false, score: 82.0, run_date: '2026-07-07', data_quality: 'HIGH',
    last_price: 90.0, last_change_pct: 1.5, rsi: 55.0, adx: 28.0, rvol: 1.8,
    obv_trend: 'UP', has_opportunity: true, opp_type: 'Breakout',
  },
  {
    symbol: 'AMOC', name_ar: 'ألكسندريا', sector: 'البتروكيماويات',
    is_sharia: true, score: 74.0, run_date: '2026-07-07', data_quality: 'HIGH',
    last_price: 12.0, last_change_pct: 0.3, rsi: 60.0, adx: 22.0, rvol: 1.3,
    obv_trend: 'UP', has_opportunity: false, opp_type: null,
  },
];

const fullResponse = {
  total: 2, limit: 60, offset: 0, sort: 'score',
  sectors: ['البنوك', 'البتروكيماويات'],
  items,
};

function mockDiscover(page: import('@playwright/test').Page, response = fullResponse) {
  return page.route(`${BASE_API}/api/discover*`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
  );
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('Discover page — load', () => {
  test('renders page heading', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: 'اكتشف الأسهم' })).toBeVisible();
  });

  test('renders stock cards', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByText('COMI')).toBeVisible();
    await expect(page.getByText('AMOC')).toBeVisible();
  });

  test('shows sharia badge', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByText('شريعة')).toBeVisible();
  });

  test('shows opportunity badge', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByText('Breakout')).toBeVisible();
  });

  test('card links to stock detail', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.locator('a[href="/stocks/COMI"]')).toBeVisible();
  });

  test('shows results count', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByText(/2 سهم مطابق/)).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/discover*`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/discover');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

// ── Filter bar ────────────────────────────────────────────────────────────────

test.describe('Discover page — filters', () => {
  test('sector dropdown is present', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByLabel('القطاع')).toBeVisible();
  });

  test('sector options populated', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByRole('option', { name: 'البنوك' })).toBeAttached();
  });

  test('sharia checkbox visible', async ({ page }) => {
    await mockDiscover(page);
    await page.goto('/discover');
    await expect(page.getByText('شريعة فقط')).toBeVisible();
  });
});

// ── Nav link ──────────────────────────────────────────────────────────────────

test.describe('Discover nav link', () => {
  test('nav link navigates to /discover', async ({ page }) => {
    await mockDiscover(page);
    await page.route(`${BASE_API}/**`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/');
    const link = page.getByRole('link', { name: /اكتشف/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/discover', { timeout: 5_000 });
  });
});
