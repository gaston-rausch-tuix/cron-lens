import { motion } from "framer-motion";
import type { Theme } from "../useTheme";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: (originX?: number, originY?: number) => void;
};

const TRACK_HEIGHT = 40;
const PADDLE_HEIGHT = 20;

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === "light";

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      onToggle(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return;
    }
    onToggle(event.clientX, event.clientY);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isLight}
      aria-label="Toggle dark mode"
      className="theme-toggle"
      onClick={handleClick}
    >
      <span className="theme-toggle__screw" />
      <span className="theme-toggle__track">
        {isLight && (
          <motion.span
            className="theme-toggle__glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <motion.span
          className="theme-toggle__paddle"
          initial={false}
          animate={{
            top: isLight ? 0 : TRACK_HEIGHT - PADDLE_HEIGHT,
            rotateX: isLight ? 0 : 180,
          }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        />
      </span>
      <span className="theme-toggle__screw" />
    </button>
  );
}

export default ThemeToggle;
