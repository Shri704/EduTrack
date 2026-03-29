import { Link } from "react-router-dom";

/** Shared mark shell — inline-flex so background + size always paint reliably */
const markShell =
  "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 shadow-lg shadow-teal-500/35 motion-safe:animate-pulse dark:from-emerald-400 dark:via-cyan-500 dark:to-sky-500 dark:shadow-emerald-500/40";

function GradCapIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={`text-slate-900 dark:text-slate-950 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
      />
    </svg>
  );
}

/**
 * Brand logo + wordmark. Use everywhere for consistent EduTrack identity.
 * @param {"inline" | "hero" | "auth"} variant
 */
const EduTrackLogo = ({
  to = "/",
  variant = "inline",
  className = "",
  title = "EduTrack",
  /** Hero only: hide tagline on small screens to fit narrow headers */
  compactHero = false,
}) => {
  if (variant === "hero") {
    return (
      <Link
        to={to}
        className={`group flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}
        title="Go to home"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-12 sm:w-12">
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-sky-400 opacity-90 shadow-[0_0_24px_-4px_rgba(16,185,129,0.6)] transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:shadow-[0_0_32px_-2px_rgba(16,185,129,0.8)]" />
          <span className="absolute inset-0 animate-pulse-ring rounded-2xl" />
          <GradCapIcon className="relative z-10 h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-800 transition-colors group-hover:text-emerald-700 sm:text-sm sm:tracking-[0.22em] dark:text-slate-100 dark:group-hover:text-emerald-200">
            {title}
          </p>
          <p
            className={`text-[10px] tracking-wide text-slate-500 dark:text-slate-500 sm:text-[11px] ${
              compactHero ? "hidden sm:block" : ""
            }`}
          >
            Performance &amp; Attendance Analytics
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "auth") {
    return (
      <Link
        to={to}
        className={`group flex flex-col items-center gap-3 ${className}`}
        title="Go to home"
      >
        <span
          className={`${markShell} h-14 w-14 rounded-2xl`}
          aria-hidden
        >
          <GradCapIcon className="h-7 w-7" />
        </span>
        <div className="text-center">
          <p className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-2xl font-semibold text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
            {title}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Student Performance &amp; Attendance Analytics
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`group flex min-w-0 items-center gap-2 rounded-xl outline-none ring-teal-500/0 transition hover:bg-teal-50/60 focus-visible:ring-2 focus-visible:ring-teal-500/40 dark:hover:bg-slate-800/50 ${className}`}
      title="Go to home"
    >
      <span className={`${markShell} h-8 w-8`} aria-hidden>
        <GradCapIcon className="h-[1.125rem] w-[1.125rem]" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-100">
          {title}
        </p>
        <p className="truncate text-[11px] leading-tight text-slate-600 dark:text-slate-400 sm:text-xs">
          Student Performance &amp; Attendance
        </p>
      </div>
    </Link>
  );
};

export default EduTrackLogo;
