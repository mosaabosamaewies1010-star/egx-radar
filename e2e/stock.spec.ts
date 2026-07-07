/**
 * E2E: Stock detail page (/stocks/[symbol])
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const mockStock = {
  symbol: 'COMI',
  name_ar: 'بنك القاهرة التجاري',
  name_en: 'Commercial International Bank',
  sector: 'البنوك',
  is_sharia: false,
  score: 87.0,
  run_date: '2026-07-07',
  breakdown: {
    trend: 17, momentum: 15, liquidity: 12, volume: 11,
    sector: 9, fundamental: 10, risk_penalty: 4, regime_multiplier: 1.0,
  },
  indicators: { adx: 32.0, rsi: 62.0, atr_pct: 1.8, rvol: 2.3, obv_trend: 'UP' },
  explain: {
    ar: ['الزخم إيجابي', 'حجم تداول مرتفع', 'اتجاه صاعد واضح'],
    en: ['Positive momentum', 'High volume', 'Clear uptrend'],
  },
  data_quality: 'HIGH',
  opportunity: {
    type: 'Breakout',
    entry: 87.5, tp1: 93.0, tp2: 98.0, sl: 84.2,
    rr: 2.1, max_hold_days: 10,
    signal_quality: 'HIGH',
    reason: { ar: 'اختراق مقاومة رئيسية', en: 'Key resistance breakout' },
  },
};

test.beforeEach(async ({ page }) => {
  await page.route(`${BASE_API}/api/stocks/COMI`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStock) })
  );
});

test('renders stock symbol in heading', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByRole('heading', { name: /COMI/ })).toBeVisible({ timeout: 10_000 });
});

test('renders arabic stock name', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText('بنك القاهرة التجاري')).toBeVisible({ timeout: 10_000 });
});

test('renders sector badge', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText('البنوك')).toBeVisible({ timeout: 10_000 });
});

test('renders Radar Score', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText('87')).toBeVisible({ timeout: 10_000 });
});

test('renders explain bullets from API', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText('الزخم إيجابي')).toBeVisible({ timeout: 10_000 });
});

test('renders opportunity section when opp present', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText(/فرصة|Opportunity/i)).toBeVisible({ timeout: 10_000 });
});

test('renders entry price from opportunity', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText('87.5')).toBeVisible({ timeout: 10_000 });
});

test('renders disclaimer text', async ({ page }) => {
  await page.goto('/stocks/COMI');
  await expect(page.getByText(/ليست نصيحة استثمارية/)).toBeVisible({ timeout: 10_000 });
});

test('404 shows not-found error state', async ({ page }) => {
  await page.route(`${BASE_API}/api/stocks/XXXX`, (route: Route) =>
    route.fulfill({ status: 404, body: JSON.stringify({ error: 'not found' }) })
  );
  await page.goto('/stocks/XXXX');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
});

test('network error shows error state with retry button', async ({ page }) => {
  await page.route(`${BASE_API}/api/stocks/COMI`, (route: Route) =>
    route.abort('connectionrefused')
  );
  await page.goto('/stocks/COMI');
  await expect(page.getByText(/إعادة المحاولة/)).toBeVisible({ timeout: 10_000 });
});
