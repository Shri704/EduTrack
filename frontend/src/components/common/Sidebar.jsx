import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSidebarDrawer } from "../../context/SidebarDrawerContext.jsx";

const linkBase =
  "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] hover:bg-teal-100/80 hover:text-teal-900 md:min-h-0 dark:hover:bg-slate-800/80 dark:hover:text-emerald-300";

const adminLinks = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/teachers", label: "Teachers" },
  { to: "/admin/branches", label: "Branches" },
  { to: "/admin/subjects", label: "Subjects" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/users", label: "Manage users" },
];

const teacherLinks = [
  { to: "/teacher", label: "Dashboard", end: true },
  { to: "/teacher/attendance", label: "Mark Attendance" },
  { to: "/teacher/holidays", label: "Holidays" },
  { to: "/teacher/upload-marks", label: "Upload Marks" },
  { to: "/teacher/students", label: "Students" },
  { to: "/teacher/profile", label: "Profile" },
];

const studentLinks = [
  { to: "/student", label: "Dashboard", end: true },
  { to: "/student/attendance", label: "Attendance" },
  { to: "/student/marks", label: "Marks" },
  { to: "/student/reports", label: "Reports" },
  { to: "/student/profile", label: "Profile" },
];

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const { close } = useSidebarDrawer();

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  if (!user) return null;

  const role = user.role;

  const links =
    role === "admin" || role === "superadmin"
      ? adminLinks
      : role === "teacher"
        ? teacherLinks
        : studentLinks;

  const sidebarTip =
    role === "admin" || role === "superadmin"
      ? {
          title: "Admin workspace",
          body: "On your phone, use the bottom tabs. This sidebar is the full menu on larger screens.",
        }
      : role === "student"
        ? {
            title: "On your phone",
            body: "Use the bottom tabs to move around. This full menu appears on larger screens.",
          }
        : {
            title: "Today's tip",
            body: "Mark attendance and upload marks on time so students always see up-to-date records.",
          };

  return (
    <div className="hidden h-full w-0 shrink-0 overflow-visible md:block md:w-64 md:shrink-0">
      <aside
        className="relative z-0 flex h-full w-64 flex-col border-r border-teal-100/90 bg-white/95 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800/80 dark:text-slate-500">
            Navigation
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-cyan-500/10 font-medium text-teal-900 shadow-sm shadow-teal-500/10 ring-1 ring-teal-200/60 dark:from-emerald-500/20 dark:via-cyan-500/10 dark:to-transparent dark:text-emerald-300 dark:shadow-emerald-500/15 dark:ring-emerald-500/20"
                    : "text-slate-700 dark:text-slate-300"
                }`
              }
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-teal-100/90 bg-gradient-to-br from-teal-50/90 to-cyan-50/50 p-3 text-xs text-teal-900/85 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-900/40 dark:text-slate-400">
          <p className="font-semibold text-teal-950 dark:text-slate-200">
            {sidebarTip.title}
          </p>
          <p className="mt-1 leading-relaxed">{sidebarTip.body}</p>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
