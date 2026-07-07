import { test, expect, Page } from '@playwright/test';

// ── Shared mock data ──────────────────────────────────────────────────────────

const mockPerformance = {
  overall: {
    total: 812, closed: 812, wins: 258, losses: 401,
    win_rate: 31.8, avg_win_pct: 8.3, avg_loss_pct: -5.1,
    profit_factor: 1.188, expectancy: -0.74,
    avg_hold_days: 9.7, tp1_rate: 25.0, sl_rate: 49.4,
  },
  by_year: [
    { year: 2023, total: 200, closed: 200, wins: 70, losses: 100,
      win_rate: 35.0, avg_win_pct: 9.0, avg_loss_pct: -5.5,
      profit_factor: 1.3, expectancy: 0.1, avg_hold_days: 10.0,
      tp1_rate: 30.0, sl_rate: 50.0 },
    { year: 2024, total: 300, closed: 300, wins: 90, losses: 160,
      win_rate: 30.0, avg_win_pct: 7.0, avg_loss_pct: -4.8,
      profit_factor: 1.1, expectancy: -0.3, avg_hold_days: 9.5,
      tp1_rate: 25.0, sl_rate: 53.3 },
  ],
  by_sector: [
    { sector: 'بنوك', total: 150, closed: 150, wins: 60, losses: 70,
      win_rate: 40.0, avg_win_pct: 10.0, avg_loss_pct: -5.0,
      profit_factor: 1.7, expectancy: 1.0, avg_hold_days: 8.0,
      tp1_rate: 35.0, sl_rate: 46.7 },
  ],
  by_version: [
    { version: 'backtest_v1', total: 812, closed: 812, wins: 258, losses: 401,
      win_rate: 31.8, avg_win_pct: 8.3, avg_loss_pct: -5.1,
      profit_factor: 1.188, expectancy: -0.74, avg_hold_days: 9.7,
      tp1_rate: 25.0, sl_rate: 49.4 },
  ],
  top_stocks: [
    { symbol: 'COMI', name_ar: 'التجاري الدولي', sector: 'بنوك',
      total: 25, closed: 25, wins: 15, losses: 8,
      win_rate: 60.0, avg_win_pct: 12.0, avg_loss_pct: -5.0,
      profit_factor: 4.5, expectancy: 5.2, avg_hold_days: 7.0,
      tp1_rate: 52.0, sl_rate: 32.0 },
    { symbol: 'FAISAL', name_ar: 'فيصل', sector: 'بنوك',
      total: 10, closed: 10, wins: 3, losses: 6,
      win_rate: 30.0, avg_win_pct: 5.0, avg_loss_pct: -4.0,
      profit_factor: 0.6, expectancy: -1.3, avg_hold_days: 11.0,
      tp1_rate: 20.0, sl_rate: 60.0 },
  ],
};

async function setupMocks(page: Page) {
  await page.route('**/api/performance', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPerformance) })
  );
  await page.route('**/api/market/regime', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ regime: 'BULL', confidence: 0.8, reason: { ar: 'صاعد', en: 'Bull' } }) })
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('/performance page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/performance');
  });

  // Page heading
  test('shows سجل الأداء heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('سجل الأداء');
  });

  // WGT-100 overall stats
  test('WGT-100 shows total trades 812', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-100"]')).toContainText('812');
  });

  test('WGT-100 shows win rate', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-100"]')).toContainText('31.8%');
  });

  test('WGT-100 shows profit factor', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-100"]')).toContainText('1.188');
  });

  // WGT-101 by year
  test('WGT-101 shows 2023 row', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-101"]')).toContainText('2023');
  });

  test('WGT-101 shows 2024 row', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-101"]')).toContainText('2024');
  });

  // WGT-102 by sector
  test('WGT-102 shows بنوك sector', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-102"]')).toContainText('بنوك');
  });

  // WGT-103 top stocks
  test('WGT-103 shows COMI', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-103"]')).toContainText('COMI');
  });

  test('WGT-103 shows FAISAL', async ({ page }) => {
    await expect(page.locator('[data-widget-id="WGT-103"]')).toContainText('FAISAL');
  });

  test('COMI links to stock page', async ({ page }) => {
    const link = page.locator('[data-widget-id="WGT-103"] a', { hasText: 'COMI' }).first();
    await expect(link).toHaveAttribute('href', '/stocks/COMI');
  });

  // Disclaimer
  test('shows backtest disclaimer', async ({ page }) => {
    await expect(page.getByText(/الأداء السابق لا يضمن/)).toBeVisible();
  });

  // Navigation
  test('AppNav has سجل الأداء link', async ({ page }) => {
    await expect(page.locator('nav a[href="/performance"]')).toBeVisible();
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

test.describe('/performance error handling', () => {
  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/api/performance', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.route('**/api/market/regime', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ regime: 'BULL', confidence: 0.8, reason: { ar: '', en: '' } }) })
    );
    await page.goto('/performance');
    // Error state renders retry button
    await expect(page.getByRole('button', { name: /إعادة المحاولة|retry/i })).toBeVisible();
  });
});
