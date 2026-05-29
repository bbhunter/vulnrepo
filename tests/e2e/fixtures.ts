import { Page, expect } from '@playwright/test';

export const STRONG_KEY = 'Vulnr3p0_E2E!Key';

export function uniqueReportTitle(prefix = 'E2E Report'): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function clearAppState(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    try { sessionStorage.clear(); } catch {}
    try { localStorage.clear(); } catch {}
    if (window.indexedDB && typeof indexedDB.databases === 'function') {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs
          .filter(d => !!d.name)
          .map(d => new Promise<void>(resolve => {
            const req = indexedDB.deleteDatabase(d.name!);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          }))
      );
    } else {
      await new Promise<void>(resolve => {
        const req = indexedDB.deleteDatabase('vulnrepo-db');
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
      });
    }
  });
}

export async function createReport(
  page: Page,
  title: string,
  key: string = STRONG_KEY,
): Promise<void> {
  await page.goto('/new-report');
  await expect(page.getByRole('heading', { name: 'New Report' })).toBeVisible();

  await page.getByPlaceholder('e.g. External penetration testing report').fill(title);
  await page.getByPlaceholder('Min. 8 characters').fill(key);
  await page.getByPlaceholder('Re-enter security key').fill(key);

  await page.getByRole('button', { name: /Save report/i }).click();

  await expect(page).toHaveURL(/\/my-reports$/);
  await expect(page.getByRole('link', { name: title })).toBeVisible();
}
