import { test, expect } from '@playwright/test';
import { STRONG_KEY, clearAppState, createReport, uniqueReportTitle } from './fixtures';

test.describe('Create a new report', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page);
  });

  test('creates a local report and lands on My Reports with the new entry', async ({ page }) => {
    const title = uniqueReportTitle();

    await createReport(page, title);

    await expect(page.getByRole('heading', { name: 'My Reports' })).toBeVisible();
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  });

  test('persists the newly created report across reloads', async ({ page }) => {
    const title = uniqueReportTitle();
    await createReport(page, title);

    await page.reload();
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  });

  test('opens the created report and shows the encrypted-status badge', async ({ page }) => {
    const title = uniqueReportTitle();
    await createReport(page, title);

    await page.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(/\/report\/.+/);
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('rejects an empty title', async ({ page }) => {
    await page.goto('/new-report');

    await page.getByPlaceholder('Min. 8 characters').fill(STRONG_KEY);
    await page.getByPlaceholder('Re-enter security key').fill(STRONG_KEY);
    await page.getByRole('button', { name: /Save report/i }).click();

    await expect(page.getByText('Title must not be empty!')).toBeVisible();
    await expect(page).toHaveURL(/\/new-report$/);
  });

  test('rejects a security key that is too weak', async ({ page }) => {
    // SeckeyValidatorService treats keys matching /passw.*|12345.*|09876.*|qwert.*|asdfg.*|zxcvb.*/
    // as "Common" (strength 1); the form requires strength >= 2.
    const commonKey = 'password12345';

    await page.goto('/new-report');

    await page.getByPlaceholder('e.g. External penetration testing report').fill(uniqueReportTitle());
    await page.getByPlaceholder('Min. 8 characters').fill(commonKey);
    await page.getByPlaceholder('Re-enter security key').fill(commonKey);
    await page.getByRole('button', { name: /Save report/i }).click();

    await expect(page.getByText('Security key is too weak!').first()).toBeVisible();
    await expect(page).toHaveURL(/\/new-report$/);
  });

  test('rejects mismatched security keys', async ({ page }) => {
    await page.goto('/new-report');

    await page.getByPlaceholder('e.g. External penetration testing report').fill(uniqueReportTitle());
    await page.getByPlaceholder('Min. 8 characters').fill(STRONG_KEY);
    await page.getByPlaceholder('Re-enter security key').fill(STRONG_KEY + 'X');
    await page.getByRole('button', { name: /Save report/i }).click();

    await expect(page.getByText('Keys do not match!').first()).toBeVisible();
    await expect(page).toHaveURL(/\/new-report$/);
  });

  test('Cancel returns to the previous page', async ({ page }) => {
    await page.goto('/my-reports');
    await expect(page).toHaveURL(/\/my-reports$/);

    await page.getByRole('button', { name: /New report/i }).first().click();
    await expect(page).toHaveURL(/\/new-report$/);

    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page).toHaveURL(/\/my-reports$/);
  });
});
