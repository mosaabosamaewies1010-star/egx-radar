/**
 * E2E: Portfolio page (/portfolio) — WGT-022/023/024
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const emptySummary = {
  total_invested: 0,
  open_positions: 0,
  closed_positions: 0,
  total_realized_pnl: 0,
  total_unrealized_pnl: null as number | null,
};

const openHolding = {
  id: 1,
  user_id: null,
  stock_id: 1,
  symbol: 'COMI',
  name_ar: 'بنك القاهرة',
  quantity: 100,
  avg_cost: 87.5,
  currency: 'EGP',
  cost_basis: 8750,
  is_open: true,
  realized_pnl: null,
  current_price: 90.0,
  unrealized_pnl: 250.0,
  unrealized_pnl_pct: 2.86,
  opened_at: '2026-01-01T00:00:00',
  closed_at: null,
  close_price: null,
  notes: null,
};

function mockPortfolio(page: import('@playwright/test').Page, holdings = [openHolding], summary = emptySummary) {
  return page.route(`${BASE_API}/api/portfolio`, (route: Route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ summary, holdings }),
      });
    } else {
      route.continue();
    }
  });
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('Portfolio page — load', () => {
  test('renders page title', async ({ page }) => {
    await mockPortfolio(page, [], emptySummary);
    await page.goto('/portfolio');
    await expect(page.getByRole('heading', { name: 'محفظتي' })).toBeVisible();
  });

  test('shows summary widget after load', async ({ page }) => {
    await mockPortfolio(page, [], emptySummary);
    await page.goto('/portfolio');
    await expect(page.locator('[data-widget-id="WGT-022"]')).toBeVisible();
  });

  test('shows empty state when no holdings', async ({ page }) => {
    await mockPortfolio(page, [], emptySummary);
    await page.goto('/portfolio');
    await expect(page.getByText(/لا توجد صفقات بعد/)).toBeVisible();
  });

  test('shows holding symbol when holdings exist', async ({ page }) => {
    await mockPortfolio(page, [openHolding], {
      ...emptySummary,
      total_invested: 8750,
      open_positions: 1,
      total_unrealized_pnl: 250,
    });
    await page.goto('/portfolio');
    await expect(page.getByText('COMI')).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/portfolio`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/portfolio');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

// ── WGT-024: Add form ─────────────────────────────────────────────────────────

test.describe('Portfolio page — add form', () => {
  test('add form expands when button clicked', async ({ page }) => {
    await mockPortfolio(page, [], emptySummary);
    await page.goto('/portfolio');
    await expect(page.getByText('إضافة صفقة جديدة')).toBeVisible();
    await page.click('text=إضافة صفقة جديدة');
    await expect(page.getByPlaceholder('COMI')).toBeVisible();
  });

  test('successfully adds a holding', async ({ page }) => {
    let callCount = 0;
    await page.route(`${BASE_API}/api/portfolio`, (route: Route) => {
      const method = route.request().method();
      if (method === 'GET') {
        callCount++;
        const holdings = callCount === 1 ? [] : [openHolding];
        const summary  = callCount === 1 ? emptySummary : { ...emptySummary, open_positions: 1, total_invested: 8750 };
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ summary, holdings }),
        });
      } else if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(openHolding),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/portfolio');
    await page.click('text=إضافة صفقة جديدة');
    await page.fill('[placeholder="COMI"]', 'COMI');
    await page.fill('[placeholder="100"]', '100');
    await page.fill('[placeholder="87.50"]', '87.5');
    await page.click('button:has-text("إضافة")');

    await expect(page.getByText('COMI')).toBeVisible({ timeout: 8_000 });
  });

  test('shows error when adding with unknown symbol', async ({ page }) => {
    await mockPortfolio(page, [], emptySummary);
    await page.route(`${BASE_API}/api/portfolio`, (route: Route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'الرمز XXXX غير موجود' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/portfolio');
    await page.click('text=إضافة صفقة جديدة');
    await page.fill('[placeholder="COMI"]', 'XXXX');
    await page.fill('[placeholder="100"]', '50');
    await page.fill('[placeholder="87.50"]', '10');
    await page.click('button:has-text("إضافة")');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

// ── Nav link ──────────────────────────────────────────────────────────────────

test.describe('Portfolio nav link', () => {
  test('portfolio link exists in nav and navigates to /portfolio', async ({ page }) => {
    await page.route(`${BASE_API}/api/portfolio`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ summary: emptySummary, holdings: [] }),
      })
    );
    // mock other API calls the home page might make
    await page.route(`${BASE_API}/**`, (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

    await page.goto('/');
    const link = page.getByRole('link', { name: /محفظتي/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/portfolio', { timeout: 5_000 });
  });
});
