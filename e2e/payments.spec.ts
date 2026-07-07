/**
 * E2E: Payments page (/payments) — WGT-080/081
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const plansResponse = {
  features: ['راداركور لجميع الأسهم', 'تنبيهات فورية', 'فرص التداول'],
  plans: [
    { id: 'pro_monthly', name_ar: 'PRO شهري', price: 199, currency: 'EGP',
      period: 'monthly', savings: null,
      features: ['راداركور لجميع الأسهم', 'تنبيهات فورية', 'فرص التداول'] },
    { id: 'pro_annual', name_ar: 'PRO سنوي', price: 1799, currency: 'EGP',
      period: 'annual', savings: '25%',
      features: ['راداركور لجميع الأسهم', 'تنبيهات فورية', 'فرص التداول'] },
  ],
};

function mockPlans(page: import('@playwright/test').Page) {
  return page.route(`${BASE_API}/api/payments/plans`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plansResponse) })
  );
}

test.describe('Payments page — load', () => {
  test('renders page heading', async ({ page }) => {
    await mockPlans(page);
    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: /الاشتراك في PRO/ })).toBeVisible();
  });

  test('renders monthly plan card', async ({ page }) => {
    await mockPlans(page);
    await page.goto('/payments');
    await expect(page.getByText('PRO شهري')).toBeVisible();
  });

  test('renders annual plan card', async ({ page }) => {
    await mockPlans(page);
    await page.goto('/payments');
    await expect(page.getByText('PRO سنوي')).toBeVisible();
  });

  test('shows annual savings badge', async ({ page }) => {
    await mockPlans(page);
    await page.goto('/payments');
    await expect(page.getByText(/وفّر.*25/)).toBeVisible();
  });

  test('shows features list', async ({ page }) => {
    await mockPlans(page);
    await page.goto('/payments');
    await expect(page.getByText('راداركور لجميع الأسهم').first()).toBeVisible();
  });

  test('shows subscribe buttons', async ({ page }) => {
    await mockPlans(page);
    await page.goto('/payments');
    const btns = page.getByRole('button', { name: /اشترك الآن/ });
    await expect(btns.first()).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route(`${BASE_API}/api/payments/plans`, (route: Route) =>
      route.fulfill({ status: 500, body: 'error' })
    );
    await page.goto('/payments');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Payments nav link', () => {
  test('PRO link visible in nav when not pro', async ({ page }) => {
    await mockPlans(page);
    await page.route(`${BASE_API}/**`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/');
    await expect(page.getByRole('link', { name: /PRO/ }).first()).toBeVisible();
  });
});
