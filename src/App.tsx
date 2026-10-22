import { useRef, useState } from "react";

import "./App.css";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./useTheme";

const TIMEZONES = Intl.supportedValuesOf("timeZone").sort();

const formatRunTime = (date: Date, tz: string): string => {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")
    ?.value.replace("GMT", "UTC");

  return offset ? `${formatted} ${offset}` : formatted;
};

const getRelativeTime = (futureTime: number): string => {
  const nextTime = (futureTime - Date.now()) / (1000 * 60 * 60);

  if (nextTime > 24) {
    return `Runs in ${Math.round(nextTime / 24)} days`;
  } else if (nextTime > 1) {
    return `Runs in ${Math.round(nextTime)} hours`;
  } else if (nextTime * 60 > 1) {
    return `Runs in ${Math.round(nextTime * 60)} minutes`;
  }
  return `Runs in ${Math.round(nextTime * 60 * 60)} seconds`;
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const [nextIntervals, setNextIntervals] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const timeRef = useRef<number | null>(null);
  const expressionRef = useRef("");

  const evaluateExpression = (expression: string, tz: string) => {
    const sanitizedExpression = sanityExpression(expression);

    if (!sanitizedExpression) {
      setError(null);
      setResult(null);
      setNextIntervals([]);
      return;
    }

    if (sanitizedExpression.split(/\s+/).length === 6) {
      setError("CronLens supports 5-field expressions (no seconds)");
      setResult(null);
      setNextIntervals([]);
      return;
    }

    try {
      const interval = CronExpressionParser.parse(sanitizedExpression, { tz });

      setError(null);
      setResult(
        cronstrue.toString(interval.stringify(), {
          use24HourTimeFormat: true,
          trimHoursLeadingZero: true,
        }),
      );

      setNextIntervals(
        interval.take(5).map((val, index) => {
          if (index === 0) {
            return getRelativeTime(val.getTime());
          }
          return formatRunTime(val.toDate(), tz);
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid cron expression");
      setResult(null);
      setNextIntervals([]);
    }
  };

  const sanityExpression = (expression: string): string => {
    if (expression) {
      const newExpression = expression.replaceAll("  ", " ");
      return newExpression.trim();
    }
    return "";
  };

  const onChange = (value: string) => {
    expressionRef.current = value;
    if (timeRef.current) clearTimeout(timeRef.current);
    timeRef.current = setTimeout(() => evaluateExpression(value, timezone), 150);
  };

  const onTimezoneChange = (value: string) => {
    setTimezone(value);
    evaluateExpression(expressionRef.current, value);
  };

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <section id="center" className="panel">
        <header className="panel-header">
          <h1>Cron Lens</h1>
          <p className="subtitle">Parse and preview cron expressions</p>
        </header>

        <div className="field">
          <label htmlFor="expression-input">Cron Expression</label>
          <input
            id="expression-input"
            className="expression-input"
            onInputCapture={(e) => onChange(e.currentTarget.value)}
            type="text"
            aria-label="Cron expression"
            aria-invalid={error !== null}
            placeholder="*/15 9-17 * * 1-5"
          />
        </div>

        <div className="field">
          <label htmlFor="timezone-select">Timezone</label>
          <select
            id="timezone-select"
            className="timezone-select"
            aria-label="Timezone"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.currentTarget.value)}
          >
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>

        {result && (
          <div className="field">
            <label htmlFor="description">Description</label>
            <p id="description" className="description" aria-label="Description">
              {result}
            </p>
          </div>
        )}

        {!error && nextIntervals.length > 0 && (
          <div className="field">
            <label>Next 5 runs</label>
            <ul className="runs-list">
              {nextIntervals.map((value, index) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {!error && !result && nextIntervals.length === 0 && (
          <p className="hint">Enter a cron expression</p>
        )}
      </section>
    </>
  );
}

export default App;
