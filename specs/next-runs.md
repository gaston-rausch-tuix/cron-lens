# CronLens - Live Updates, Whitespace Handling, Description, and Next Runs (AC2-AC5)

## Application Overview

CronLens is a tiny client-only React app at http://localhost:5173 that takes a cron expression and shows a human-readable description plus the next upcoming run times. This plan covers exactly four acceptance criteria from the project README:

- AC2: Results update as the user types, debounced, with no submit button required.
- AC3: Leading/trailing whitespace is ignored, and multiple spaces between fields are treated as one.
- AC4: For a valid expression, a region labelled "Description" shows the cronstrue text in 24-hour format (e.g. "At 09:00, Monday through Friday").
- AC5: For a valid expression, a list labelled "Next runs" shows exactly 5 upcoming run times, in chronological order.

All scenarios use valid cron expressions only; invalid-expression/error-path behavior (AC11-AC14), timezone selection (AC8-AC10), relative-time labelling (AC7), and UTC-offset formatting (AC6) are explicitly out of scope for this plan. Every test assumes a fresh page load of http://localhost:5173 with an empty "Cron expression" field, and locates elements the same way the repo's existing hand-written tests do: page.getByLabel('Cron expression') for the input and page.getByLabel('Description') for the description. Expected outcomes throughout this plan are written to match the README's documented behavior (including its 24-hour, zero-padded-hour example and the "Description"/"Next runs" labelling), even in places where the currently running app was observed to diverge from that text; see the separate discrepancy notes delivered alongside this plan for exactly where those gaps were found.

## Test Scenarios

### 1. AC2 - Live, debounced updates without a submit button

**Seed:** `seed.spec.ts`

#### 1.1. Results appear automatically while typing, without any submit action [AC2]

**File:** `tests/next-runs/ac2-auto-update-no-submit.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load, with the 'Cron expression' field empty.
    - expect: The 'Cron expression' textbox is empty.
    - expect: No 'Description' region and no 'Next runs' list are shown yet; only the 'Enter a cron expression' hint is visible.
  2. Inspect the page for any submit, apply, calculate, or 'Go'-style button associated with evaluating the cron expression.
    - expect: No such button exists anywhere on the page. The only interactive controls present are the 'Cron expression' textbox, the 'Timezone' dropdown, and the dark-mode toggle switch.
  3. Click into the field labelled 'Cron expression' and type the valid expression "0 9 * * 1-5" one character at a time, without pressing Enter and without interacting with any other control.
  4. Stop typing and wait briefly (under one second) without performing any further action.
    - expect: A region labelled 'Description' appears, showing a human-readable description of the schedule.
    - expect: A list labelled 'Next runs' appears, showing upcoming run times.
    - expect: Both appeared purely as a result of typing - no click, Enter key press, blur, or other submission step was required.

#### 1.2. Rapid sequential edits are debounced so only the final expression is evaluated [AC2]

**File:** `tests/next-runs/ac2-debounced-rapid-edits.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression', then, without any pause, immediately continue editing the same field (e.g. by replacing the "9" with "10") so it reads "0 10 * * 1-5" - performing both edits as one uninterrupted burst of typing.
    - expect: The app is not required to display a result for the intermediate value "0 9 * * 1-5" before the edit to "0 10 * * 1-5" completes.
  3. Stop typing and wait briefly for the debounce window to elapse.
    - expect: The region labelled 'Description' shows the text for the final expression only: "At 10:00, Monday through Friday".
    - expect: No trace of a result corresponding to the earlier, intermediate expression "0 9 * * 1-5" is shown, confirming the rapid edits were coalesced into a single debounced evaluation rather than one evaluation per keystroke.

#### 1.3. Debounced result still appears correctly after focus leaves the input [AC2]

**File:** `tests/next-runs/ac2-result-after-blur.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
  3. Immediately after the last keystroke, move focus away from the expression field (for example, by clicking into the 'Timezone' dropdown) without waiting for any result to appear first.
  4. Wait briefly for the debounce window to elapse.
    - expect: The region labelled 'Description' shows "At 09:00, Monday through Friday".
    - expect: The list labelled 'Next runs' shows 5 entries.
    - expect: The debounced update completes correctly even though focus moved away from the field, confirming the update is driven by the typing activity itself and not by keeping the field focused.

### 2. AC3 - Whitespace normalization

**Seed:** `seed.spec.ts`

#### 2.1. Leading and trailing whitespace around a valid expression is ignored [AC3]

**File:** `tests/next-runs/ac3-trims-leading-trailing-whitespace.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the expression "   0 9 * * 1-5   " (three leading spaces and three trailing spaces) into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: The region labelled 'Description' shows exactly "At 09:00, Monday through Friday", with no error and no empty-input hint.
    - expect: The list labelled 'Next runs' shows exactly 5 entries.
    - expect: This output is identical to what the same expression produces with no surrounding spaces, confirming the leading and trailing whitespace was ignored.

#### 2.2. Multiple spaces between fields are treated as a single separator [AC3]

**File:** `tests/next-runs/ac3-collapses-multiple-spaces.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the expression "0  9   *    *     1-5" into the field labelled 'Cron expression', using an irregular, increasing number of spaces (2, 3, 4, then 5) between consecutive fields.
  3. Wait briefly for the debounced update to complete.
    - expect: The region labelled 'Description' shows exactly "At 09:00, Monday through Friday" - the same text produced by the single-spaced expression "0 9 * * 1-5".
    - expect: The list labelled 'Next runs' shows the same 5 entries as the single-spaced version.
    - expect: This confirms that runs of multiple spaces between fields are collapsed and treated as a single separator rather than causing an error or a different schedule.

#### 2.3. Debounced result normalizes irregular whitespace while the user types [AC2, AC3]

**File:** `tests/next-runs/ac2-ac3-debounced-whitespace-normalization.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Slowly type, one character at a time and without clicking any other control, the expression "  */15   9-17  *   *  1-5  " (irregular leading, trailing, and inter-field spacing) into the field labelled 'Cron expression'.
  3. Stop typing and wait briefly for the debounced update to settle.
    - expect: Exactly one final, debounced result is produced after typing stops; the app does not need to display a new result after every keystroke while the irregular spacing is still being typed.
    - expect: The region labelled 'Description' shows "Every 15 minutes, between 09:00 and 17:59, Monday through Friday".
    - expect: The list labelled 'Next runs' shows exactly 5 entries.
    - expect: Both match exactly what is produced by typing the equivalent, cleanly single-spaced expression "*/15 9-17 * * 1-5", confirming the irregular whitespace was normalized as part of the same debounced update.

### 3. AC4 - Description formatting in 24-hour time

**Seed:** `seed.spec.ts`

#### 3.1. Description shows the cronstrue text in 24-hour format, matching the documented example [AC4]

**File:** `tests/next-runs/ac4-24-hour-format-leading-zero.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: A region labelled 'Description' is visible.
    - expect: Its text is exactly "At 09:00, Monday through Friday" - 24-hour time with a zero-padded hour, exactly as illustrated in the product documentation's own example.

#### 3.2. Description uses 24-hour notation, never 12-hour AM/PM, for afternoon and evening hours [AC4]

**File:** `tests/next-runs/ac4-24-hour-format-no-am-pm.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 17 * * 1-5" into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: The region labelled 'Description' shows exactly "At 17:00, Monday through Friday".
    - expect: The hour is rendered as "17" and never as "5:00 PM", "5:00", or any other 12-hour / AM-PM notation, confirming the description is formatted in 24-hour time.

#### 3.3. Description text updates correctly for an expression with multiple specific run hours [AC4]

**File:** `tests/next-runs/ac4-multiple-hours-description.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 10,11 * * 2" into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: The region labelled 'Description' shows exactly "At 10:00 and 11:00, only on Tuesday", confirming the cronstrue-generated text reflects both listed hours in 24-hour format.

### 4. AC5 - Next runs list content and ordering

**Seed:** `seed.spec.ts`

#### 4.1. Next runs list shows exactly five entries for a typical valid expression [AC5]

**File:** `tests/next-runs/ac5-exactly-five-entries.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: A list labelled 'Next runs' is visible.
    - expect: It contains exactly 5 entries (list items) - no fewer and no more.

#### 4.2. Next runs list stays capped at five entries even for a very frequent expression [AC5]

**File:** `tests/next-runs/ac5-capped-at-five-high-frequency.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "* * * * *" (fires every minute) into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: The list labelled 'Next runs' shows exactly 5 entries, even though the expression matches far more than 5 times within any short time window.

#### 4.3. Next runs list still shows five entries for an infrequent, yearly expression [AC5]

**File:** `tests/next-runs/ac5-exactly-five-low-frequency.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 0 1 1 *" (fires once a year, on 1 January) into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete.
    - expect: The list labelled 'Next runs' shows exactly 5 entries spanning multiple future years, confirming the app keeps computing upcoming runs until it has exactly 5, rather than stopping early or showing fewer entries because the occurrences are far apart.

#### 4.4. Next runs entries are listed in strict chronological order [AC5]

**File:** `tests/next-runs/ac5-chronological-order.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression'.
  3. Wait briefly for the debounced update to complete, then read the 5 entries of the list labelled 'Next runs' from first to last.
    - expect: Each entry represents a point in time strictly later than the entry immediately before it.
    - expect: Reading the list top to bottom produces a single ascending timeline with no entry appearing out of order.

### 5. Cross-cutting update flow

**Seed:** `seed.spec.ts`

#### 5.1. Switching to a different valid expression fully replaces the Description and Next runs, with no leftovers and no submit action [AC2, AC4, AC5]

**File:** `tests/next-runs/ac2-ac4-ac5-switch-expression-updates-all.spec.ts`

**Steps:**
  1. Navigate to the CronLens app at http://localhost:5173 on a fresh page load.
  2. Type the valid expression "0 9 * * 1-5" into the field labelled 'Cron expression' and wait briefly for the debounced update.
    - expect: The region labelled 'Description' shows "At 09:00, Monday through Friday".
    - expect: The list labelled 'Next runs' shows exactly 5 entries consistent with a 09:00 weekday schedule.
  3. Without reloading the page, select all the text in the 'Cron expression' field and type over it with the different valid expression "0 0 1 * *", then wait briefly for the debounced update.
  4. Observe the Description and Next runs after the second debounced update.
    - expect: The region labelled 'Description' now shows exactly "At 00:00, on day 1 of the month", fully replacing the previous text.
    - expect: The list labelled 'Next runs' now shows exactly 5 new entries consistent with the monthly schedule; none of the previous weekday/09:00 entries remain.
    - expect: All of this happens purely from typing - no submit button, Enter key, or page reload was used at any point.

## Spec discrepancies

The running app at http://localhost:5173 was checked against the README's AC2-AC5 text. The scenarios above describe the README's intended behavior; this section records where the current implementation (`src/App.tsx`) actually diverges from that text.

1. **AC4 - "Description" is not exposed as a region.** README: "a region labelled \"Description\"". Actual DOM: `<p id="description" aria-label="Description">`, whose implicit ARIA role is `paragraph`, not `region` - there is no `role="region"` anywhere in the markup.

2. **AC4 - single-digit hours lose their leading zero, contradicting the README's own example.** README's example text is literally `"At 09:00, Monday through Friday"`. The app calls `cronstrue.toString(..., { use24HourTimeFormat: true, trimHoursLeadingZero: true })`; the explicit `trimHoursLeadingZero: true` strips the zero padding, so the equivalent real expression (`0 9 * * 1-5`) renders `"At 9:00, Monday through Friday"` instead. Same effect on `*/15 9-17 * * 1-5`, which renders `"...between 9:00 and 17:59..."` rather than `"...between 09:00 and 17:59..."`. Hours that are naturally two digits (10, 11, 17, etc.) are unaffected.

3. **AC5 - the "Next runs" list has no accessible label at all, and even its visible text doesn't match.** README: "a list labelled \"Next runs\"". Actual DOM: `<label>Next 5 runs</label>` as a sibling of `<ul className="runs-list">`, with no `id`/`for`, `aria-label`, or `aria-labelledby` connecting them - `page.getByLabel('Next runs')` and `page.getByLabel('Next 5 runs')` both match 0 elements, so the list can currently only be located by role/structure (e.g. `page.getByRole('list')`), not by label. The visible label text itself also reads "Next 5 runs", not "Next runs".

No discrepancies were found for AC2 (150ms debounce on every keystroke via `setTimeout` in `onChange`, cleared and reset per keystroke; no submit/apply button exists anywhere on the page) or for AC3 (the user-visible result for expressions with irregular interior spacing is identical to the single-spaced equivalent in every case checked, because `cron-parser` tolerates the remaining whitespace even though the internal `sanityExpression` helper's single non-global `replaceAll("  ", " ")` pass only partially collapses runs of 3+ spaces - an internal implementation quirk that does not surface as a user-visible bug).
