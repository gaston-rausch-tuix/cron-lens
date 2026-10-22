// spec: specs/next-runs.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Cross-cutting update flow', () => {
  // AC4 ("For a valid expression, a region labelled 'Description' shows the cronstrue text in
  // 24-hour format (e.g: 'At 09:00, Monday through Friday')") expects a zero-padded hour, e.g.
  // "09:00". The app actually renders "At 9:00, Monday through Friday" — the leading zero is
  // dropped because src/App.tsx calls cronstrue.toString(..., { trimHoursLeadingZero: true }).
  // This is a genuine spec/implementation discrepancy (see specs/next-runs.md), not a test bug.
  test.fixme('AC-2, AC-4, AC-5: switching to a different valid expression fully replaces the description and next runs, with no leftovers and no submit action', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    const cronExpression = page.getByLabel('Cron expression');
    const description = page.getByLabel('Description');
    const nextRunsList = page.getByRole('list');
    const nextRunsItems = page.getByRole('listitem');
    const anyButton = page.getByRole('button');

    // No submit/apply button exists anywhere on the page, from the very start.
    await expect(anyButton).toHaveCount(0);

    // 2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression' and wait briefly for the debounced update.
    await cronExpression.fill('0 9 * * 1-5');

    await expect(description).toContainText('09:00');
    await expect(description).toContainText('Monday through Friday');
    await expect(nextRunsItems).toHaveCount(5);
    await expect(nextRunsList).toContainText('09:00');
    await expect(anyButton).toHaveCount(0);

    // 3. Without reloading the page, select all the text in the 'Cron expression' field and type over it with the different valid expression "0 0 1 * *", then wait briefly for the debounced update.
    await cronExpression.click();
    await page.keyboard.press('ControlOrMeta+a');
    await cronExpression.pressSequentially('0 0 1 * *');

    // 4. Observe the Description and Next runs after the second debounced update.
    await expect(description).toContainText('0:00');
    await expect(description).toContainText('on day 1 of the month');
    await expect(description).not.toContainText('09:00');
    await expect(description).not.toContainText('Monday through Friday');
    await expect(nextRunsItems).toHaveCount(5);
    await expect(nextRunsList).toContainText('0:00');
    await expect(nextRunsList).not.toContainText('09:00');
    await expect(anyButton).toHaveCount(0);
  });
});
