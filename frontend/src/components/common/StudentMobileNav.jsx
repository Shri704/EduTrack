import { NavLink } from "react-router-dom";
import { useSidebarDrawer } from "../../context/SidebarDrawerContext.jsx";

const items = [
  {
    to: "/student",
    label: "Home",
    end: true,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    ),
  },
  {
    to: "/student/attendance",
    label: "Attendance",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    ),
  },
  {
    to: "/student/marks",
    label: "Marks",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    ),
  },
  {
    to: "/student/profile",
    label: "Profile",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    ),
  },
];

/**
 * Fixed bottom tab bar — same routes as the sidebar, optimized for phone widths.
 * Hidden on md+ where the sidebar is always visible.
 */
const StudentMobileNav = () => {
  const { open } = useSidebarDrawer();

  if (open) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-teal-200/80 bg-white/95 px-1 pt-1 shadow-[0_-8px_30px_-12px_rgba(15,118,110,0.2)] backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40 md:hidden"
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5">
        {items.map(({ to, label, icon, end }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-semibold leading-tight transition-colors active:scale-[0.97] motion-reduce:active:scale-100 sm:text-[11px] ${
                  isActive
                    ? "text-teal-700 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-teal-100 dark:bg-emerald-500/20"
                        : "bg-transparent"
                    }`}
                  >
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      aria-hidden
                    >
                      {icon}
                    </svg>
                  </span>
                  <span className="max-w-[4.5rem] truncate text-center">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default StudentMobileNav;
