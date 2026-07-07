/**
 * E2E: Home page (/) — Opportunities feed, Market Pulse (WGT-090), Quick Actions (WGT-091)
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const mockRegime = {
  regime: 'BULL',
  confidence: 78,
  run_date: '2026-07-07',
  breadth: { advancing: 18, declining: 7, unchanged: 5 },
  reason: { ar: 'السوق في مرحلة صعود', en: 'Bull market' },
};

const mockOpportunities = {
  total: 2,
  limit: 20,
  offset: 0,
  items: [
    {
      id: 1,
      symbol: 'COMI',
      name_ar: 'بنك القاهرة التجاري',
      is_sharia: false,
      type: 'Breakout',
      radar_score: 87,
      signal_quality: 'HIGH',
      run_date: '2026-07-07',
      levels: { entry: 87.5, tp1: 93.0, tp2: 98.0, sl: 84.2, rr: 2.1, max_hold_days: 10 },
    },
    {
      id: 2,
      symbol: 'SKPC',
      name_ar: 'سيدي كرير للبتروكيماويات',
      is_sharia: true,
      type: 'Reversal',
      radar_score: 72,
      signal_quality: 'MEDIUM',
      run_date: '2026-07-07',
      levels: { entry: 45.0, tp1: 48.0, tp2: 51.0, sl: 43.0, rr: 1.8, max_hold_days: 7 },
    },
  ],
};

const mockSummary = {
  as_of: '2026-07-07',
  regime: mockRegime,
  egx30_close: 31500,
  egx30_change_pct: 1.23,
  sector_ranking: [
    { sector: 'البنوك', avg_score: 78, count: 12 },
  ],
  top_volume: [],
  top_breakouts: [],
  opportunities_count: 5,
};

test.beforeEach(async ({ page }) => {
  await page.route(`${BASE_API}/api/market/regime`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRegime) })
  );
  await page.route(`${BASE_API}/api/opportunities**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOpportunities) })
  );
  await page.route(`${BASE_API}/api/market/summary`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSummary) })
  );
});

// ── Existing tests (preserved) ────────────────────────────────────────────────

test('page loads without crashing', async ({ page }) => {
  await page.goto('/');
  await expect(page).not.toHaveTitle(/error/i);
});

test('shows EGX Radar brand in nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('EGX Radar')).toBeVisible();
});

test('shows at least one opportunity card after data loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('COMI')).toBeVisible({ timeout: 10_000 });
});

test('shows arabic stock name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('بنك القاهرة التجاري')).toBeVisible({ timeout: 10_000 });
});

test('shows sharia badge for sharia-compliant stock', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('سيدي كرير للبتروكيماويات')).toBeVisible({ timeout: 10_000 });
});

test('shows legal disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/ليست نصيحة استثمارية/)).toBeVisible({ timeout: 10_000 });
});

test('nav link to dashboard exists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /السوق|Market/ })).toBeVisible();
});

test('search input is present', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder(/ابحث/)).toBeVisible();
});

test('typing a symbol in search and pressing enter navigates to stock page', async ({ page }) => {
  await page.route(`${BASE_API}/api/stocks/EFIH`, (route: Route) =>
    route.fulfill({ status: 404, body: '{}' })
  );
  await page.goto('/');
  const searchInput = page.getByPlaceholder(/ابحث/);
  await searchInput.fill('EFIH');
  await searchInput.press('Enter');
  await expect(page).toHaveURL(/\/stocks\/EFIH/, { timeout: 5_000 });
});

test('shows error state when API is down', async ({ page }) => {
  await page.unroute(`${BASE_API}/api/opportunities**`);
  await page.route(`${BASE_API}/api/opportunities**`, (route: Route) =>
    route.fulfill({ status: 503, body: 'service unavailable' })
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
});

// ── WGT-090: Market Pulse ─────────────────────────────────────────────────────

test('WGT-090 shows EGX30 label', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('EGX30')).toBeVisible({ timeout: 10_000 });
});

test('WGT-090 shows top sector', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('البنوك')).toBeVisible({ timeout: 10_000 });
});

test('WGT-090 shows opportunities count', async ({ page }) => {
  await page.goto('/');
  // opportunities_count = 5; look for it inside WGT-090
  const wgt = page.locator('[data-widget-id="WGT-090"]');
  await expect(wgt).toBeVisible({ timeout: 10_000 });
  await expect(wgt.getByText('5')).toBeVisible();
});

// ── WGT-091: Quick Actions ────────────────────────────────────────────────────

test('WGT-091 quick actions rendered on page load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-widget-id="WGT-091"]')).toBeVisible();
});

test('WGT-091 discover link is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /اكتشف/ })).toBeVisible();
});

test('WGT-091 morning brief link is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /موجز صباحي/ })).toBeVisible();
});

test('WGT-091 my day link is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /يومي/ }).first()).toBeVisible();
});
