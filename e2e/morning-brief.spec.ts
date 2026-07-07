/**
 * E2E: Morning Brief page (/morning-brief) — WGT-060/061/062
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const fullResponse = {
  as_of: '2026-07-07',
  regime: {
    regime: 'BULL', confidence: 75.0, run_date: '2026-07-07',
    reason: { ar: 'السوق صاعد بقوة', en: 'Strong bull market' },
  },
  egx30_close: 31500.0, egx30_change_pct: 1.2,
  breadth: { advancing: 45, declining: 12, unchanged: 8 },
  top_scores: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', sector: 'البنوك',
      is_sharia: false, score: 82.0, last_change_pct: 1.5 },
    { symbol: 'AMOC', name_ar: 'ألكسندريا', sector: 'البتروكيماويات',
      is_sharia: true, score: 74.0, last_change_pct: 0.3 },
  ],
  top_rvol: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة', rvol: 1.8, score: 82.0 },
  ],
  new_opportunities: [
    {
      symbol: 'COMI', name_ar: 'بنك القاهرة', opp_type: 'Breakout',
      entry_price: 89.0, tp1_price: 95.0, sl_price: 85.0,
      radar_score: 82.0, signal_quality: 'HIGH', run_date: '2026-07-07',
    },
  ],
  opportunities_count: 3, scored_count: 65,
};

function mockBrief(page: import('@playwright/test').Page, response = fullResponse) {
  return page.route(`${BASE_API}/api/morning-brief`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
  );
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('Morning Brief — load', () => {
  test('renders page heading', async ({ page }) => {
    await mockBrief(page);
    await page.goto('/morning-brief');
    await expect(page.getByRole('heading', { name: 'الموجز الصباحي' })).toBeVisible();
  });

  test('shows regime label', async ({ page }) => {
    await mockBrief(page);
    await page.goto('/morning-brief');
    await expect(page.getByText('سوق صاعد')).toBeVisible();
  });

  test('shows stock symbols in top scores', async ({ page }) => {
    await mockBrief(page);
    await page.goto('/morning-brief');
    await expect(page.getByText('COMI')).toBeVisible();
    await expect(page.getByText('AMOC')).toBeVisible();
  });

  test('shows opportunity type', async ({ page }) => {
    await mockBrief(page);
    await page.goto('/morning-brief');
    await expect(page.getByText('Breakout')).toBeVisible();
  });

  test('shows advancing breadth', async ({ page }) => {
    await mockBrief(page);
    await page.goto('/morning-brief');
    await expect(page.getByText(/45.* صاعد/)).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/morning-brief`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/morning-brief');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });

  test('links to stock detail page', async ({ page }) => {
    await mockBrief(page);
    await page.goto('/morning-brief');
    await expect(page.locator('a[href="/stocks/COMI"]').first()).toBeVisible();
  });
});

// ── Nav ───────────────────────────────────────────────────────────────────────

test.describe('Morning Brief nav link', () => {
  test('nav link navigates to /morning-brief', async ({ page }) => {
    await mockBrief(page);
    await page.route(`${BASE_API}/**`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/');
    const link = page.getByRole('link', { name: /موجز/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/morning-brief', { timeout: 5_000 });
  });
});
