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
AC 8: A selected "Timezone" lists all IANA zones from 