import { NavLink, useLocation } from "react-router-dom";
import { useSidebarDrawer } from "../../context/SidebarDrawerContext.jsx";

const tabClass = (active) =>
  `flex min-h-[3.5rem] min-w-[3.65rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[9px] font-semibold leading-tight transition-colors active:scale-[0.97] motion-reduce:active:scale-100 sm:min-w-[4.1rem] sm:text-[10px] ${
    active
      ? "text-teal-700 dark:text-emerald-400"
      : "text-slate-500 dark:text-slate-400"
  }`;

const iconWrapClass = (active) =>
  `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
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

/** Matches admin Sidebar: all primary routes in a scrollable bottom bar (md:hidden). */
const ADMIN_TABS = [
  {
    to: "/admin",
    end: true,
    label: "Dashboard",
    icon: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    match: (p) => p === "/admin" || p === "/admin/",
  },
  {
    to: "/admin/students",
    label: "Students",
    icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25-9a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z",
    match: (p) => p.startsWith("/admin/students"),
  },
  {
    to: "/admin/teachers",
    label: "Teachers",
    icon: "M15 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9 10.5a5.25 5.25 0 0 1 10.5 0v.75a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75v-.75Zm12-3a4.5 4.5 0 0 0-4.5-4.5h-1.563M19.5 15.75v.75a.75.75 0 0 1-.75.75h-2.025a.75.75 0 0 1-.75-.75v-1.5c0-.621.504-1.125 1.125-1.125H18.75Z",
    match: (p) => p.startsWith("/admin/teachers"),
  },
  {
    to: "/admin/branches",
    label: "Branches",
    icon: "M2.25 21h19.5M4.5 3h15M9 7.5h6M6.75 21v-9.75A.75.75 0 0 1 7.5 10.5h9a.75.75 0 0 1 .75.75V21M6 21h12",
    match: (p) => p.startsWith("/admin/branches"),
  },
  {
    to: "/admin/subjects",
    label: "Subjects",
    icon: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v15.128A9.757 9.757 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.646A8.967 8.967 0 0 1 18 3.75c1.052 0 2.062.18 3 .512v15.128a9.758 9.758 0 0 0-2.218-.99 9.756 9.756 0 0 0-2.782.99m0 0V7.5m0 10.5v-6",
    match: (p) => p.startsWith("/admin/subjects"),
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
    match: (p) => p.startsWith("/admin/reports"),
  },
  {
    to: "/admin/users",
    label: "Manage users",
    icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25-9a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z",
    match: (p) => p.startsWith("/admin/users"),
  },
];

const AdminMobileNav = () => {
  const { open } = useSidebarDrawer();
  const { pathname } = useLocation();

  if (open) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-teal-200/80 bg-white/95 pt-1 shadow-[0_-8px_30px_-12px_rgba(15,118,110,0.2)] backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40 md:hidden"
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Admin navigation"
    >
      <ul className="flex max-w-full flex-nowrap items-stretch justify-start gap-0.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ADMIN_TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.to} className="shrink-0">
              <NavLink
                to={tab.to}
                end={tab.end}
                title={tab.label}
                aria-current={active ? "page" : undefined}
                className={() => tabClass(active)}
              >
                <span className={iconWrapClass(active)}>{strokeIcon(tab.icon)}</span>
                <span className="line-clamp-2 max-w-[4.75rem] text-center leading-[1.15]">
                  {tab.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AdminMobileNav;
