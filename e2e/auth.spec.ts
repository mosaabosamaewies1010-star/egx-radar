/**
 * E2E: Auth flows — Login + Register
 */
import { test, expect, Route } from '@playwright/test';

const BASE_API = 'http://localhost:5001';

const fakeUser = { id: 1, email: 'trader@example.com', name: 'محمد', is_pro: false, created_at: '2026-07-07T00:00:00' };

test.describe('Login page', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('EGX Radar')).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('shows link to register page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /سجل الآن/ })).toBeVisible();
  });

  test('shows disclaimer', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/ليست نصيحة استثمارية/)).toBeVisible();
  });

  test('successful login redirects to home', async ({ page }) => {
    await page.route(`${BASE_API}/api/auth/login`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'fake-jwt-token', user: fakeUser }),
      })
    );

    await page.goto('/login');
    await page.fill('[placeholder="you@example.com"]', 'trader@example.com');
    await page.fill('[placeholder="••••••••"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/', { timeout: 8_000 });
  });

  test('failed login shows error alert', async ({ page }) => {
    await page.route(`${BASE_API}/api/auth/login`, (route: Route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }),
      })
    );

    await page.goto('/login');
    await page.fill('[placeholder="you@example.com"]', 'wrong@example.com');
    await page.fill('[placeholder="••••••••"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });

  test('navigating to register link changes URL', async ({ page }) => {
    await page.goto('/login');
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register', { timeout: 5_000 });
  });
});

test.describe('Register page', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('إنشاء حساب')).toBeVisible();
  });

  test('shows name, email and password fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByPlaceholder(/مثال:/)).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('shows link to login page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('link', { name: /ادخل الآن/ })).toBeVisible();
  });

  test('successful registration redirects to home', async ({ page }) => {
    await page.route(`${BASE_API}/api/auth/register`, (route: Route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'new-jwt-token', user: fakeUser }),
      })
    );

    await page.goto('/register');
    await page.fill('[placeholder="you@example.com"]', 'newuser@example.com');
    await page.fill('[placeholder="••••••••"]', 'securepassword1');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/', { timeout: 8_000 });
  });

  test('duplicate email shows error alert', async ({ page }) => {
    await page.route(`${BASE_API}/api/auth/register`, (route: Route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'البريد الإلكتروني مستخدم بالفعل' }),
      })
    );

    await page.goto('/register');
    await page.fill('[placeholder="you@example.com"]', 'dup@example.com');
    await page.fill('[placeholder="••••••••"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
  });

  test('navigating to login link changes URL', async ({ page }) => {
    await page.goto('/register');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login', { timeout: 5_000 });
  });
});
