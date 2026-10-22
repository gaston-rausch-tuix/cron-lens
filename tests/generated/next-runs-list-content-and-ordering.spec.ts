// spec: specs/next-runs.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ABSOLUTE_RUN_TIME_PATTERN =
  /^\w{3}, (\d{2}) (\w{3}) (\d{4}), (\d{1,2}):(\d{2}) UTC([+-]\d{2}):(\d{2})$/;

// Parses an absolute "Next runs" entry (e.g. "Fri, 23 Oct 2026, 09:00 UTC-03:00")
// into a UTC epoch millisecond value that can be compared chronologically.
function parseAbsoluteRunTime(text: string): number {
  const match = text.match(ABSOLUTE_RUN_TIME_PATTERN);
  if (!match) {
    throw new Error(`Unexpected absolute run time format: "${text}"`);
  }
  const [, day, monthName, year, hour, minute, offsetHours, offsetMinutes] = match;
  const monthIndex = MONTHS.indexOf(monthName);
  const offsetSign = offsetHours.startsWith('-') ? -1 : 1;
  const offsetTotalMinutes =
    offsetSign * (Math.abs(Number(offsetHours)) * 60 + Number(offsetMinutes));
  const localTimestamp = Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute));
  return localTimestamp - offsetTotalMinutes * 60_000;
}

const RELATIVE_RUN_TIME_PATTERN = /^Runs in (\d+) (second|minute|hour|day)s$/;

const UNIT_MS: Record<string, number> = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

// Parses the first ("relative") "Next runs" entry (e.g. "Runs in 16 hours") into the
// latest point in time it could plausibly represent, accounting for the displayed
// amount being rounded to the nearest whole unit.
function parseRelativeRunTimeUpperBound(text: string, now: number): number {
  const match = text.match(RELATIVE_RUN_TIME_PATTERN);
  if (!match) {
    throw new Error(`Unexpected relative run time format: "${text}"`);
  }
  const [, amount, unit] = match;
  return now + (Number(amount) + 0.5) * UNIT_MS[unit];
}

test.describe('AC5 - Next runs list content and ordering', () => {
  test('AC-5: next runs list shows exactly five entries for a typical valid expression', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
    await page.getByLabel('Cron expression').fill('0 9 * * 1-5');

    // 3. Wait briefly for the debounced update to complete.
    await expect(page.getByRole('list')).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(5);
  });

  test('AC-5: next runs list stays capped at five entries even for a very frequent expression', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "* * * * *" (fires every minute) into the field labelled 'Cron expression'.
    await page.getByLabel('Cron expression').fill('* * * * *');

    // 3. Wait briefly for the debounced update to complete.
    await expect(page.getByRole('listitem')).toHaveCount(5);
  });

  test('AC-5: next runs list still shows five entries for an infrequent, yearly expression', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 0 1 1 *" (fires once a year, on 1 January) into the field labelled 'Cron expression'.
    await page.getByLabel('Cron expression').fill('0 0 1 1 *');

    // 3. Wait briefly for the debounced update to complete.
    const items = page.getByRole('listitem');
    await expect(items).toHaveCount(5);

    const years = new Set(
      (await items.allTextContents())
        .map((text) => text.match(/\b(\d{4})\b/)?.[1])
        .filter((year): year is string => year !== undefined),
    );
    expect(years.size).toBeGreaterThan(1);
  });

  test('AC-5: next runs entries are listed in strict chronological order', async ({ page }) => {
    // 1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
    await page.goto('http://localhost:5173');

    // 2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
    await page.getByLabel('Cron expression').fill('0 9 * * 1-5');

    // 3. Wait briefly for the debounced update to complete, then read the 5 entries of the list from first to last.
    const items = page.getByRole('listitem');
    await expect(items).toHaveCount(5);
    const now = Date.now();
    const [firstEntry, ...absoluteEntries] = await items.allTextContents();

    const absoluteTimestamps = absoluteEntries.map(parseAbsoluteRunTime);
    for (let i = 1; i < absoluteTimestamps.length; i++) {
      expect(absoluteTimestamps[i]).toBeGreaterThan(absoluteTimestamps[i - 1]);
    }

    const firstEntryUpperBound = parseRelativeRunTimeUpperBound(firstEntry, now);
    expect(firstEntryUpperBound).toBeLessThan(absoluteTimestamps[0]);
  });
});
