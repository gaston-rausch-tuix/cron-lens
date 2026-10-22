import { test, expect } from '@playwright/test';

test.describe('Cron expression - Trimming spaces flow', () => {
  test('Trimming spaces in the input and evaluates value correctly AC#3', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const input = page.getByLabel('Cron expression')

    await input.fill('  0 10,11 *   *     2      ');

    const description = page.getByLabel('Description');
    await expect(description).toHaveText('At 10:00 and 11:00, only on Tuesday');
  });
});
