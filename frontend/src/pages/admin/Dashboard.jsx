import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import apiClient from "../../api/axios.js";
import { fetchBranches } from "../../api/branchApi.js";
import { fetchSubjects } from "../../api/subjectApi.js";

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

const iconBox =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-900/[0.04] dark:bg-slate-800/80 dark:ring-white/10";

function StatTile({ label, value, loading, hint, icon }) {
  return (
    <div className="edu-card-soft relative overflow-hidden border border-slate-200/80 p-5 shadow-md shadow-slate-300/25 dark:border-slate-700/50 dark:shadow-slate-900/50">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-teal-200/35 via-emerald-200/20 to-transparent opacity-50 blur-2xl dark:from-emerald-500/15 dark:via-cyan-500/10 dark:to-transparent dark:opacity-40" />
      <div className="relative flex items-start gap-4">
        <div className={iconBox}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
            {loading ? "…" : value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-500">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PulseCard({ label, value, loading, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm dark:border-slate-700/80 dark:from-slate-900/80 dark:to-slate-950/60">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {loading ? "…" : value}
      </p>
      {sub ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-500">{sub}</p>
      ) : null}
    </div>
  );
}

const AdminDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    avgAttendance: null,
    avgPerformance: null,
  });
  const [branchCount, setBranchCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return "there";
    const fn = user.firstName?.trim();
    const ln = user.lastName?.trim();
    if (fn && ln) return `${fn} ${ln}`;
    if (fn) return fn;
    if (user.name?.trim()) return user.name.trim();
    return "there";
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const fetchOverview = async () => {
      try {
        const { data } = await apiClient.get("/analytics/admin/overview");
        const payload = data?.data || data;
        if (!cancelled) {
          setStats({
            totalStudents: Number(payload?.totalStudents) || 0,
            totalTeachers: Number(payload?.totalTeachers) || 0,
            avgAttendance:
              payload?.avgAttendance != null
                ? Number(payload.avgAttendance)
                : null,
            avgPerformance:
              payload?.avgPerformance != null
                ? Number(payload.avgPerformance)
                : null,
          });
        }
      } catch {
        if (!cancelled) {
          setStats({
            totalStudents: 0,
            totalTeachers: 0,
            avgAttendance: null,
            avgPerformance: null,
          });
        }
      }
    };

    const loadCatalog = async () => {
      setCatalogError(false);
      try {
        const [branchesRaw, subjectsRaw] = await Promise.all([
          fetchBranches(),
          fetchSubjects(),
        ]);
        if (cancelled) return;
        const branches = Array.isArray(branchesRaw)
          ? branchesRaw
          : branchesRaw?.data || [];
        const subjects = Array.isArray(subjectsRaw)
          ? subjectsRaw
          : subjectsRaw?.data || [];
        setBranchCount(Array.isArray(branches) ? branches.length : 0);
        setSubjectCount(Array.isArray(subjects) ? subjects.length : 0);
      } catch {
        if (!cancelled) {
          setCatalogError(true);
          setBranchCount(0);
          setSubjectCount(0);
        }
      }
    };

    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), loadCatalog()]);
      if (!cancelled) setLoading(false);
    };

    bootstrap();
    const timer = setInterval(fetchOverview, 45_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const studentRatioHint =
    stats.totalTeachers > 0
      ? `~${Math.round(stats.totalStudents / stats.totalTeachers) || 0} students per teacher`
      : "Assign teachers to balance your roster";

  const attPct =
    stats.avgAttendance != null && Number.isFinite(stats.avgAttendance)
      ? `${Number(stats.avgAttendance).toFixed(1)}%`
      : "—";
  const perfPct =
    stats.avgPerformance != null && Number.isFinite(stats.avgPerformance)
      ? `${Number(stats.avgPerformance).toFixed(1)}%`
      : "—";

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-teal-950/35 bg-gradient-to-br from-teal-950 via-emerald-950 to-cyan-950 text-white shadow-xl shadow-teal-950/30 ring-1 ring-white/10 dark:border-teal-900/50 dark:from-slate-950 dark:via-teal-950 dark:to-emerald-950 dark:shadow-black/40">
        <div
          className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative border-b border-white/10 bg-gradient-to-r from-emerald-500/15 to-transparent px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/90">
            {formatToday()}
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {greetingForHour()}, {displayName.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-teal-100/90">
            Your overview below updates from live data. Use the{" "}
            <span className="font-medium text-white">sidebar</span> (desktop) or{" "}
            <span className="font-medium text-white">bottom tabs</span> (phone) to
            open Students, Teachers, Reports, and other tools.
          </p>
        </div>
      </section>

      <section aria-label="Overview metrics">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              At a glance
            </h2>
            <p className="edu-muted text-sm">
              Directory scale. Student and teacher counts refresh automatically.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Students"
            value={stats.totalStudents}
            loading={loading}
            hint={studentRatioHint}
            icon={
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
              </svg>
            }
          />
          <StatTile
            label="Teachers"
            value={stats.totalTeachers}
            loading={loading}
            hint="Active teaching staff on record"
            icon={
              <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9 10.5a5.25 5.25 0 0 1 10.5 0v.75a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75v-.75Zm12-3a4.5 4.5 0 0 0-4.5-4.5h-1.563M19.5 15.75v.75a.75.75 0 0 1-.75.75h-2.025a.75.75 0 0 1-.75-.75v-1.5c0-.621.504-1.125 1.125-1.125H18.75Z" />
              </svg>
            }
          />
          <StatTile
            label="Branches"
            value={branchCount}
            loading={loading}
            hint={
              catalogError
                ? "Could not load branches"
                : "Programs / campus nodes"
            }
            icon={
              <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M4.5 3h15M9 7.5h6M6.75 21v-9.75A.75.75 0 0 1 7.5 10.5h9a.75.75 0 0 1 .75.75V21M6 21h12" />
              </svg>
            }
          />
          <StatTile
            label="Subjects"
            value={subjectCount}
            loading={loading}
            hint={
              catalogError
                ? "Could not load subjects"
                : "Active catalog entries"
            }
            icon={
              <svg className="h-6 w-6 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v15.128A9.757 9.757 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.646A8.967 8.967 0 0 1 18 3.75c1.052 0 2.062.18 3 .512v15.128a9.758 9.758 0 0 0-2.218-.99 9.756 9.756 0 0 0-2.782.99m0 0V7.5m0 10.5v-6" />
              </svg>
            }
          />
        </div>
      </section>

      <section aria-label="Rolling analytics">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          30-day pulse
        </h2>
        <p className="edu-muted mt-1 text-sm">
          Aggregated from attendance sessions and exam marks recorded in the last 30 days — no charts, just the headline numbers.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PulseCard
            label="Attendance rate"
            value={attPct}
            loading={loading}
            sub="Share of present marks across all attendance rows in the window."
          />
          <PulseCard
            label="Avg exam %"
            value={perfPct}
            loading={loading}
            sub="Mean percentage across marks entered in the window (when exam totals are set)."
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="edu-card-soft border border-teal-100/90 p-5 dark:border-slate-700/80 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Semester health
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2 text-left">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <p className="min-w-0 flex-1">
                Align{" "}
                <strong className="font-medium text-slate-800 dark:text-slate-200">
                  branches
                </strong>{" "}
                and{" "}
                <strong className="font-medium text-slate-800 dark:text-slate-200">
                  subjects
                </strong>{" "}
                before teachers schedule classes.
              </p>
            </li>
            <li className="flex items-start gap-2 text-left">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
              <p className="min-w-0 flex-1">
                Pull{" "}
                <strong className="font-medium text-slate-800 dark:text-slate-200">
                  reports
                </strong>{" "}
                before midterms to catch attendance gaps early.
              </p>
            </li>
            <li className="flex items-start gap-2 text-left">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
              <p className="min-w-0 flex-1">
                Nudge teachers to stay current on attendance and marks so student
                dashboards stay trustworthy.
              </p>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-dashed border-teal-200/90 bg-teal-50/40 p-5 dark:border-teal-500/20 dark:bg-teal-950/25 sm:p-6">
          <h2 className="text-sm font-semibold text-teal-950 dark:text-teal-100">
            Did you know?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-teal-900/85 dark:text-teal-100/85">
            Deleting a student from the Students screen removes their attendance rows, marks, notifications,
            and login — not just the roster line. Use exports from Reports before bulk changes if you need a
            backup.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
