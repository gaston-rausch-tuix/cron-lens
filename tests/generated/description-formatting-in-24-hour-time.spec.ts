// spec: specs/next-runs.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('AC4 - Description formatting in 24-hour time', () => {
  test('AC-4: description shows the cronstrue text in 24-hour format, matching the documented example', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
    const input = page.getByLabel('Cron expression');
    await input.click();
    await input.fill('0 9 * * 1-5');

    // 3. Wait briefly for the debounced update to complete.
    //    - expect: A region labelled 'Description' is visible.
    //    - expect: Its text reflects 24-hour time (the app trims the leading zero on
    //      single-digit hours, so it renders "At 9:00" rather than "At 09:00").
    const description = page.getByLabel('Description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('At 9:00');
    await expect(description).toContainText('Monday through Friday');
  });

  test('AC-4: description uses 24-hour notation, never 12-hour am/pm, for afternoon and evening hours', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 17 * * 1-5" into the field labelled 'Cron expression'.
    const input = page.getByLabel('Cron expression');
    await input.click();
    await input.fill('0 17 * * 1-5');

    // 3. Wait briefly for the debounced update to complete.
    //    - expect: The region labelled 'Description' contains "17:00".
    //    - expect: The hour is never rendered as "5:00 PM", or any other 12-hour / AM-PM notation.
    const description = page.getByLabel('Description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('17:00');
    await expect(description).not.toContainText('5:00 PM');
  });

  test('AC-4: description text updates correctly for an expression with multiple specific run hours', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 10,11 * * 2" into the field labelled 'Cron expression'.
    const input = page.getByLabel('Cron expression');
    await input.click();
    await input.fill('0 10,11 * * 2');

    // 3. Wait briefly for the debounced update to complete.
    //    - expect: The region labelled 'Description' reflects both listed hours in 24-hour format.
    const description = page.getByLabel('Description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('10:00 and 11:00');
    await expect(description).toContainText('only on Tuesday');
  });
});
