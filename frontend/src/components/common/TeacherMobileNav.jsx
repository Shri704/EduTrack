import { NavLink, useLocation } from "react-router-dom";
import { useSidebarDrawer } from "../../context/SidebarDrawerContext.jsx";

const tabClass = (active) =>
  `flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-semibold leading-tight transition-colors active:scale-[0.97] motion-reduce:active:scale-100 sm:text-[11px] ${
    active
      ? "text-teal-700 dark:text-emerald-400"
      : "text-slate-500 dark:text-slate-400"
  }`;

const iconWrapClass = (active) =>
  `flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
    active ? "bg-teal-100 dark:bg-emerald-500/20" : "bg-transparent"
  }`;

const strokeIcon = (pathD) => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.75}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={pathD} />
  </svg>
);

/**
 * Bottom tab bar for teachers — matches student mobile pattern (md:hidden).
 */
const TeacherMobileNav = () => {
  const { open } = useSidebarDrawer();
  const { pathname } = useLocation();

  if (open) return null;

  const a = {
    home: pathname === "/teacher" || pathname === "/teacher/",
    attendance: pathname.startsWith("/teacher/attendance"),
    holidays: pathname.startsWith("/teacher/holidays"),
    marks: pathname.startsWith("/teacher/upload-marks"),
    profile: pathname.startsWith("/teacher/profile"),
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-teal-200/80 bg-white/95 px-1 pt-1 shadow-[0_-8px_30px_-12px_rgba(15,118,110,0.2)] backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40 md:hidden"
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between gap-0.5">
        <li className="min-w-0 flex-1">
          <NavLink to="/teacher" end className={() => tabClass(a.home)}>
            <span className={iconWrapClass(a.home)}>
              {strokeIcon(
                "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              )}
            </span>
            <span className="max-w-[4.5rem] truncate text-center">Home</span>
          </NavLink>
        </li>

        <li className="min-w-0 flex-1">
          <NavLink to="/teacher/attendance" className={() => tabClass(a.attendance)}>
            <span className={iconWrapClass(a.attendance)}>
              {strokeIcon(
                "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              )}
            </span>
            <span className="max-w-[4.5rem] truncate text-center">Attendance</span>
          </NavLink>
        </li>

        <li className="min-w-0 flex-1">
          <NavLink to="/teacher/holidays" className={() => tabClass(a.holidays)}>
            <span className={iconWrapClass(a.holidays)}>
              {strokeIcon(
                "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              )}
            </span>
            <span className="max-w-[4.5rem] truncate text-center">Holidays</span>
          </NavLink>
        </li>

        <li className="min-w-0 flex-1">
          <NavLink to="/teacher/upload-marks" className={() => tabClass(a.marks)}>
            <span className={iconWrapClass(a.marks)}>
              {strokeIcon(
                "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              )}
            </span>
            <span className="max-w-[4.5rem] truncate text-center">Marks</span>
          </NavLink>
        </li>

        <li className="min-w-0 flex-1">
          <NavLink to="/teacher/profile" className={() => tabClass(a.profile)}>
            <span className={iconWrapClass(a.profile)}>
              {strokeIcon(
                "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              )}
            </span>
            <span className="max-w-[4.5rem] truncate text-center">Profile</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default TeacherMobileNav;
