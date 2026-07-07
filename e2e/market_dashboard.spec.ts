/**
 * E2E: Market Dashboard (/dashboard)
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const mockSummary = {
  as_of: '2026-07-07',
  regime: {
    regime: 'BULL',
    confidence: 78,
    run_date: '2026-07-07',
    breadth: { advancing: 18, declining: 7, unchanged: 5 },
    reason: { ar: 'السوق في مرحلة صعود', en: 'Bull market' },
  },
  egx30_close: 30360,
  egx30_change_pct: 1.2,
  sector_ranking: [
    { sector: 'البنوك',     avg_score: 74.2, count: 8 },
    { sector: 'الاتصالات', avg_score: 62.1, count: 4 },
  ],
  top_volume: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة التجاري', rvol: 2.3, score: 87 },
  ],
  top_breakouts: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة التجاري', score: 87, trend_score: 17 },
  ],
  opportunities_count: 4,
};

const mockHeatmap = {
  stocks: [
    { symbol: 'COMI', name_ar: 'بنك القاهرة التجاري', sector: 'البنوك', score: 87, change_pct: 1.4 },
    { symbol: 'EFIH', name_ar: 'هيرميس',             sector: 'المالية', score: 72, change_pct: 0.8 },
  ],
  as_of: '2026-07-07',
};

test.beforeEach(async ({ page }) => {
  await page.route(`${BASE_API}/api/market/summary`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSummary) })
  );
  await page.route(`${BASE_API}/api/market/heatmap`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHeatmap) })
  );
});

test('page title is visible', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('لوحة السوق')).toBeVisible({ timeout: 10_000 });
});

test('shows EGX30 label', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('EGX30')).toBeVisible({ timeout: 10_000 });
});

test('shows sector ranking header', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('ترتيب القطاعات')).toBeVisible({ timeout: 10_000 });
});

test('shows top sector name from API data', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('البنوك').first()).toBeVisible({ timeout: 10_000 });
});

test('shows heatmap section header', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('خريطة السوق الحرارية')).toBeVisible({ timeout: 10_000 });
});

test('shows top volume section', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('أعلى حجم تداول')).toBeVisible({ timeout: 10_000 });
});

test('shows top breakouts section', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('أقوى اختراق')).toBeVisible({ timeout: 10_000 });
});

test('shows opportunities count', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('4')).toBeVisible({ timeout: 10_000 });
});

test('shows market breadth detail', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('اتساع السوق — تفصيل')).toBeVisible({ timeout: 10_000 });
});

test('shows disclaimer text', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText(/ليست نصيحة استثمارية/)).toBeVisible({ timeout: 10_000 });
});

test('nav link to opportunities page works', async ({ page }) => {
  await page.goto('/dashboard');
  const link = page.getByRole('link', { name: /الفرص|Opportunities/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL('/', { timeout: 5_000 });
});

test('error state shown on API failure', async ({ page }) => {
  await page.unroute(`${BASE_API}/api/market/summary`);
  await page.route(`${BASE_API}/api/market/summary`, (route: Route) =>
    route.fulfill({ status: 503, body: 'error' })
  );
  await page.goto('/dashboard');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
});

test('retry button appears on error', async ({ page }) => {
  await page.unroute(`${BASE_API}/api/market/summary`);
  await page.route(`${BASE_API}/api/market/summary`, (route: Route) =>
    route.fulfill({ status: 503, body: 'error' })
  );
  await page.goto('/dashboard');
  await expect(page.getByText(/إعادة المحاولة/)).toBeVisible({ timeout: 10_000 });
});
