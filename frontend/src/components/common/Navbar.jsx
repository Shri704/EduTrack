import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice.js";
import EduTrackLogo from "./EduTrackLogo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-teal-100/80 bg-white/90 px-3 py-2.5 backdrop-blur-md motion-safe:transition-shadow dark:border-slate-800 dark:bg-slate-900/90 sm:gap-3 sm:px-4 sm:py-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <EduTrackLogo />
      </div>

      <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
        <ThemeToggle />
        {user && (
          <>
            <span className="hidden max-w-[140px] truncate rounded-full border border-teal-100 bg-teal-50/80 px-2.5 py-1 text-xs font-medium text-slate-800 sm:inline-block sm:max-w-[200px] dark:border-transparent dark:bg-slate-800/60 dark:text-slate-300">
              {user.name} ·{" "}
              <span className="uppercase text-teal-700 dark:text-emerald-400">
                {user.role}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-rose-500/30 transition hover:scale-[1.02] hover:shadow-lg motion-reduce:hover:scale-100 sm:px-4"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
