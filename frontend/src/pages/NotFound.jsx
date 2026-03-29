import { Link } from "react-router-dom";
import EduTrackLogo from "../components/common/EduTrackLogo.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <EduTrackLogo variant="auth" className="mb-4" />
      <div className="relative mb-6">
        <span className="absolute -inset-10 animate-pulse rounded-full bg-emerald-500/10 blur-3xl" />
        <p className="relative text-7xl font-black tracking-tight text-slate-300 dark:text-slate-800">
          404
        </p>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        The page you are looking for might have been moved or
        deleted.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:scale-[1.02]"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;