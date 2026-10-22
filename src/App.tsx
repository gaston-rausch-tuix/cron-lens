import { useRef, useState } from "react";

import "./App.css";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";

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
  const [nextIntervals, setNextIntervals] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>("");
  const timeRef = useRef<number | null>(null);

  const evaluateExpression = (expression: string) => {
    try {
      const sanitizedExpression = sanityExpression(expression);
      const interval = CronExpressionParser.parse(sanitizedExpression);

      setError(null);
      setResult(
        cronstrue.toString(interval.stringify(), { use24HourTimeFormat: true }),
      );

      setNextIntervals(
        interval.take(5).map((val, index) => {
          if (index === 0) {
            return getRelativeTime(val.getTime());
          }
          return val.toISOString();
        }),
      );
    } catch (error) {
      setResult(null);
      setError(error.message);
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
    if (timeRef.current) clearTimeout(timeRef.current);
    timeRef.current = setTimeout(() => evaluateExpression(value), 150);
  };

  return (
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
          placeholder="*/15 9-17 * * 1-5"
        />
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

      {error && <p className="error-message">{error}</p>}
    </section>
  );
}

export default App;
