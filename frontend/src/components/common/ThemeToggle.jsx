import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-200/90 bg-gradient-to-br from-white to-teal-50/80 text-teal-800 shadow-sm transition-all duration-200 hover:scale-105 hover:border-teal-300 hover:shadow-md motion-reduce:hover:scale-100 dark:border-slate-700/60 dark:from-slate-950/40 dark:to-slate-900/60 dark:text-amber-200 dark:shadow-none dark:hover:border-slate-600 dark:hover:shadow-none ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm5.657 2.343a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM18 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1Zm-2.929 5.657a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414ZM12 20a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm-5.657-2.343a1 1 0 0 1 0-1.414l.707-.707a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0ZM6 13a1 1 0 1 1 0-2H5a1 1 0 1 1 0 2h1Zm1.343-6.657a1 1 0 0 1 1.414 0l.707.707A1 1 0 0 1 8.05 8.464l-.707-.707a1 1 0 0 1 0-1.414ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      )}
    </button>
  );
}
