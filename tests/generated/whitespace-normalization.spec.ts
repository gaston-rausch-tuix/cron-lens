// spec: specs/next-runs.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('AC3 - Whitespace normalization', () => {
  test('AC-3: leading and trailing whitespace around a valid expression is ignored', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    const input = page.getByLabel('Cron expression');
    const description = page.getByLabel('Description');
    const runsList = page.getByRole('list');
    const runItems = page.getByRole('listitem');

    // 2. Type the expression "   0 9 * * 1-5   " (three leading spaces and three trailing spaces) into the field labelled 'Cron expression'.
    await input.click();
    await input.fill('   0 9 * * 1-5   ');

    // 3. Wait briefly for the debounced update to complete.
    // expect: The region labelled 'Description' shows the schedule text, with no error and no empty-input hint.
    await expect(description).toContainText('Monday through Friday');
    // expect: The list labelled 'Next runs' shows exactly 5 entries.
    await expect(runItems).toHaveCount(5);

    const paddedDescriptionText = (await description.textContent()) ?? '';
    const paddedRunsText = (await runsList.textContent()) ?? '';

    // expect: This output is identical to what the same expression produces with no surrounding spaces, confirming the leading and trailing whitespace was ignored.
    await input.fill('0 9 * * 1-5');
    await expect(description).toContainText('Monday through Friday');
    await expect(runItems).toHaveCount(5);
    await expect(description).toHaveText(paddedDescriptionText);
    await expect(runsList).toHaveText(paddedRunsText);
  });

  test('AC-3: multiple spaces between fields are treated as a single separator', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    const input = page.getByLabel('Cron expression');
    const description = page.getByLabel('Description');
    const runsList = page.getByRole('list');
    const runItems = page.getByRole('listitem');

    // 2. Type the expression "0  9   *    *     1-5" into the field labelled 'Cron expression', using an irregular, increasing number of spaces (2, 3, 4, then 5) between consecutive fields.
    await input.click();
    await input.fill('0  9   *    *     1-5');

    // 3. Wait briefly for the debounced update to complete.
    // expect: The region labelled 'Description' shows the same text produced by the single-spaced expression "0 9 * * 1-5".
    await expect(description).toContainText('Monday through Friday');
    // expect: The list labelled 'Next runs' shows the same 5 entries as the single-spaced version.
    await expect(runItems).toHaveCount(5);

    const multiSpaceDescriptionText = (await description.textContent()) ?? '';
    const multiSpaceRunsText = (await runsList.textContent()) ?? '';

    // expect: This confirms that runs of multiple spaces between fields are collapsed and treated as a single separator rather than causing an error or a different schedule.
    await input.fill('0 9 * * 1-5');
    await expect(description).toContainText('Monday through Friday');
    await expect(runItems).toHaveCount(5);
    await expect(description).toHaveText(multiSpaceDescriptionText);
    await expect(runsList).toHaveText(multiSpaceRunsText);
  });

  test('AC-2, AC-3: debounced result normalizes irregular whitespace while the user types', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    const input = page.getByLabel('Cron expression');
    const description = page.getByLabel('Description');
    const runsList = page.getByRole('list');
    const runItems = page.getByRole('listitem');

    // 2. Slowly type, one character at a time and without clicking any other control, the expression "  */15   9-17  *   *  1-5  " (irregular leading, trailing, and inter-field spacing) into the field labelled 'Cron expression'.
    await input.click();
    await input.pressSequentially('  */15   9-17  *   *  1-5  ');

    // 3. Stop typing and wait briefly for the debounced update to settle.
    // expect: Exactly one final, debounced result is produced after typing stops; the app does not need to display a new result after every keystroke while the irregular spacing is still being typed.
    // expect: The region labelled 'Description' shows the normalized schedule text.
    await expect(description).toContainText('Every 15 minutes');
    await expect(description).toContainText('Monday through Friday');
    // expect: The list labelled 'Next runs' shows exactly 5 entries.
    await expect(runItems).toHaveCount(5);

    const irregularDescriptionText = (await description.textContent()) ?? '';
    const irregularRunsText = (await runsList.textContent()) ?? '';

    // expect: Both match exactly what is produced by typing the equivalent, cleanly single-spaced expression "*/15 9-17 * * 1-5", confirming the irregular whitespace was normalized as part of the same debounced update.
    await input.fill('*/15 9-17 * * 1-5');
    await expect(description).toContainText('Every 15 minutes');
    await expect(description).toContainText('Monday through Friday');
    await expect(runItems).toHaveCount(5);
    await expect(description).toHaveText(irregularDescriptionText);
    await expect(runsList).toHaveText(irregularRunsText);
  });
});
