import { test, expect } from '@playwright/test';
import { clearAppState } from './fixtures';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page);
  });

  test('redirects from root to /home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/home$/);
  });

  test('renders hero headline and the primary Download CTA', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: /Vulnerability reports/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download/i }).first()).toBeVisible();
  });

  test('shows the feature highlights section', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: /Feature highlights/i })).toBeVisible();
    await expect(page.getByText('Security-first')).toBeVisible();
    await expect(page.getByText('Encrypted sharing')).toBeVisible();
  });

  test('toolbar logo links back to /home', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveURL(/\/faq$/);
    await page.locator('a.logo-link').click();
    await expect(page).toHaveURL(/\/home$/);
  });
});
