# CronLens
CronLens is a tiny client-only developer tool. It provides you a schedule meaning based on a cron expression input.
For instance: `*/15 * * * *` -> Every 15 minutes

### Acceptance Criteria
Expression Input
AC 1: The page has a text input labelled "Cron expression".
AC 2: Results update as the user types, debounced, no submit button required.
AC 3: Leading/trailing whitespace is ignored, multiple spaces between fields are treated as one.

Description
AC 4: For a valid expression, a region labelled "Description" shows the `cronstrue` text in 24-hour format (e.g: "At 9:00, Monday through Friday")

Next runs
AC 5: For a valid expression, a list labelled "Next runs" shows exactly 5 upcoming run times, in chronological order.
AC 6: Each run is formatted in the selected timezone as "Mon, 19 Oct 2026, 09:00" and also shows its UTC offset.
AC 7: The first run shows a relative label, e.g: "in 10 minutes".

Timezone:
AC 8: A selected "Timezone" lists all IANA zones
AC 9: On first load (no URL param), the timezone defaults to the browser's timezone
AC 10: Changing the timezone recomputes the next runs. The cron expression is interpreted in that timezone.

Validation
AC 11: An invalid expression shows an error message in an element with role="alert", and hides the Description and the Next runs.
AC 12: Expressions with 6 fields show the specific error: "CronLens supports 5-field expressions (no seconds)"
AC 13: An empty input shows no error and no results, just the hint "Enter a cron expression"
AC 14: The input gets `aria-invalid="true"` while the expression is invalid

### Local Development

Requires Node `^20.19.0` or `>=22.12.0` (per Vite's engine requirement).

Install dependencies:
```shell
npm install
```

Run the app:
```shell
npm run dev
```
The app is served at `http://localhost:5173`.

Build for production:
```shell
npm run build
```

Lint:
```shell
npm run lint
```

Run the end-to-end tests (Playwright):
```shell
npm run dev        # in one terminal, the tests expect the app already running on :5173
npx playwright test # in another terminal
```