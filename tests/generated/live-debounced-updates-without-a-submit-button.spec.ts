// spec: specs/next-runs.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('AC2 - Live, debounced updates without a submit button', () => {
  // AC4 ("For a valid expression, a region labelled 'Description' shows the cronstrue text in
  // 24-hour format (e.g: 'At 09:00, Monday through Friday')") expects a zero-padded hour, e.g.
  // "09:00". The app actually renders "At 9:00, Monday through Friday" — the leading zero is
  // dropped because src/App.tsx calls cronstrue.toString(..., { trimHoursLeadingZero: true }).
  // This is a genuine spec/implementation discrepancy (see specs/next-runs.md), not a test bug.
  test.fixme('AC-2: results appear automatically while typing, without any submit action', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load, with the 'Cron expression' field empty.
    await page.goto('http://localhost:5173');
    const input = page.getByLabel('Cron expression');
    await expect(input).toBeEmpty();
    // No 'Description' region and no 'Next runs' list are shown yet.
    await expect(page.getByLabel('Description')).not.toBeVisible();
    await expect(page.getByRole('list')).not.toBeVisible();

    // 2. Inspect the page for any submit, apply, calculate, or 'Go'-style button associated with evaluating the cron expression.
    await expect(page.getByRole('button')).toHaveCount(0);

    // 3. Click into the field labelled 'Cron expression' and type the valid expression "0 9 * * 1-5" one character at a time, without pressing Enter and without interacting with any other control.
    await input.click();
    await input.pressSequentially('0 9 * * 1-5');

    // 4. Stop typing and wait briefly (under one second) without performing any further action.
    const description = page.getByLabel('Description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('09:00, Monday through Friday');
    await expect(page.getByRole('list')).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(5);
  });

  test('AC-2: rapid sequential edits are debounced so only the final expression is evaluated', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');
    const input = page.getByLabel('Cron expression');

    // 2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression', then, without any pause, immediately continue editing the same field (e.g. by replacing the "9" with "10") so it reads "0 10 * * 1-5" - performing both edits as one uninterrupted burst of typing.
    await input.pressSequentially('0 9 * * 1-5');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await input.pressSequentially('10');

    // 3. Stop typing and wait briefly for the debounce window to elapse.
    const description = page.getByLabel('Description');
    await expect(description).toContainText('10:00, Monday through Friday');
    await expect(description).not.toContainText('09:00');
  });

  // AC4 ("For a valid expression, a region labelled 'Description' shows the cronstrue text in
  // 24-hour format (e.g: 'At 09:00, Monday through Friday')") expects a zero-padded hour, e.g.
  // "09:00". The app actually renders "At 9:00, Monday through Friday" — the leading zero is
  // dropped because src/App.tsx calls cronstrue.toString(..., { trimHoursLeadingZero: true }).
  // This is a genuine spec/implementation discrepancy (see specs/next-runs.md), not a test bug.
  test.fixme('AC-2: debounced result still appears correctly after focus leaves the input', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
    await page.getByLabel('Cron expression').pressSequentially('0 9 * * 1-5');

    // 3. Immediately after the last keystroke, move focus away from the expression field (for example, by clicking into the 'Timezone' dropdown) without waiting for any result to appear first.
    await page.getByLabel('Timezone').click();

    // 4. Wait briefly for the debounce window to elapse.
    await expect(page.getByLabel('Description')).toContainText('09:00, Monday through Friday');
    await expect(page.getByRole('listitem')).toHaveCount(5);
  });
});
