import { useCallback, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "cronlens-theme";

const getStoredTheme = (): Theme | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
};

const getPreferredTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(
    () => getStoredTheme() ?? getPreferredTheme(),
  );

  const toggleTheme = useCallback(
    (originX?: number, originY?: number) => {
      const next: Theme = theme === "dark" ? "light" : "dark";

      const update = () => {
        applyTheme(next);
        setTheme(next);
      };

      if (typeof document.startViewTransition !== "function") {
        update();
        return;
      }

      const x = originX ?? window.innerWidth / 2;
      const y = originY ?? window.innerHeight / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      document.documentElement.style.setProperty("--reveal-x", `${x}px`);
      document.documentElement.style.setProperty("--reveal-y", `${y}px`);
      document.documentElement.style.setProperty("--reveal-radius", `${radius}px`);

      document.startViewTransition(update);
    },
    [theme],
  );

  return { theme, toggleTheme };
};
