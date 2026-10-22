import { expect, test } from '@playwright/test';

test.describe('AC1 test - The page has a text input labelled "Cron expression"', () => {
  test('Review that the page has a text input labelled correctly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const input = page.getByLabel('Cron expression')

    await expect(input).toBeVisible();
  });
});
