import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import apiClient from "../../api/axios.js";
import { fetchMyProfile } from "../../api/studentApi.js";
import AttendanceChart from "../../components/charts/AttendanceChart.jsx";
import SubjectWiseChart from "../../components/charts/SubjectWiseChart.jsx";

const REFRESH_MS = 60_000;

const unwrap = (res) => res.data?.data ?? res.data;

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

/**
 * @param {Array<Record<string, unknown>>} rows
 */
function subjectsNeedingAttention(rows) {
  const ATT_MIN = 75;
  const SCORE_WEAK = 50;
  /** @type {{ subject: string; lines: string[] }[]} */
  const out = [];
  for (const r of rows || []) {
    const name = String(r.subject || "Subject");
    const classes = Number(r.classesRecorded) || 0;
    const att = r.attendancePercent;
    const attN = att != null && Number.isFinite(Number(att)) ? Number(att) : null;
    const exams = Number(r.examCount) || 0;
    const sc = r.avgScorePercent;
    const scN = sc != null && Number.isFinite(Number(sc)) ? Number(sc) : null;
    const lines = [];
    if (classes > 0 && attN != null && attN < ATT_MIN) {
      lines.push(`Attendance ${attN.toFixed(1)}% (aim for ${ATT_MIN}%+)`);
    }
    if (exams > 0 && scN != null && scN < SCORE_WEAK) {
      lines.push(`Avg exam score ${scN.toFixed(1)}% in this subject`);
    }
    if (lines.length) out.push({ subject: name, lines });
  }
  return out.slice(0, 5);
}

function IconAlert() {
  return (
    <svg
      className="h-6 w-6 text-amber-700 dark:text-amber-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

const StudentDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [brRes, prof] = await Promise.all([
          apiClient.get("/analytics/subjects/breakdown"),
          fetchMyProfile().catch(() => null),
        ]);
        if (cancelled) return;
        const br = unwrap(brRes);
        setBreakdown(Array.isArray(br) ? br : []);
        setProfile(prof && typeof prof === "object" ? prof : null);
      } catch {
        if (!cancelled) setBreakdown([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const attention = useMemo(
    () => subjectsNeedingAttention(breakdown),
    [breakdown]
  );

  const displayName =
    (profile?.name && String(profile.name).trim().split(/\s+/)[0]) ||
    user?.firstName?.trim() ||
    (user?.name && String(user.name).trim().split(/\s+/)[0]) ||
    "there";

  const metaParts = [];
  if (profile?.rollNumber)
    metaParts.push({ k: "Roll", v: String(profile.rollNumber) });
  if (profile?.branch) metaParts.push({ k: "Branch", v: String(profile.branch) });
  if (profile?.semester != null && profile.semester !== "")
    metaParts.push({ k: "Semester", v: String(profile.semester) });

  const hasSubjects = breakdown.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome — deep gradient panel, motion-safe staggered entrance + floating accents */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-950/40 bg-gradient-to-br from-teal-950 via-emerald-950 to-cyan-950 shadow-xl shadow-teal-950/35 ring-1 ring-white/10 dark:border-teal-900/60 dark:from-slate-950 dark:via-teal-950 dark:to-emerald-950 dark:shadow-black/50">
        <div
          className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl motion-safe:animate-float motion-reduce:animate-none"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl motion-safe:animate-float motion-safe:[animation-delay:1.5s] motion-reduce:animate-none"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[12%] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-teal-400/10 blur-2xl motion-safe:animate-glow-soft motion-reduce:animate-none"
          aria-hidden
        />
        <div
          className="relative h-1 w-full overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
          aria-hidden
        >
          <div className="absolute inset-0 motion-safe:animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%]" />
        </div>
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/90 motion-safe:animate-fade-up motion-reduce:animate-none motion-safe:[animation-fill-mode:backwards]"
                style={{ animationDelay: "0ms" }}
              >
                {greetingForHour()}
              </p>
              <h1
                className="mt-3 text-2xl font-bold tracking-tight text-white motion-safe:animate-fade-up motion-reduce:animate-none motion-safe:[animation-fill-mode:backwards] sm:text-3xl"
                style={{ animationDelay: "90ms" }}
              >
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-cyan-200 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p
                className="mt-2 text-sm text-teal-100/85 motion-safe:animate-fade-up motion-reduce:animate-none motion-safe:[animation-fill-mode:backwards]"
                style={{ animationDelay: "180ms" }}
              >
                {formatToday()}
              </p>
              {user?.email ? (
                <p
                  className="mt-1.5 truncate text-xs text-teal-200/70 motion-safe:animate-fade-up motion-reduce:animate-none motion-safe:[animation-fill-mode:backwards]"
                  style={{ animationDelay: "240ms" }}
                >
                  {user.email}
                </p>
              ) : null}

              {metaParts.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {metaParts.map(({ k, v }, i) => (
                    <li
                      key={k}
                      className="inline-flex items-baseline gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs shadow-lg shadow-black/10 backdrop-blur-md motion-safe:animate-fade-up motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-[1.02] motion-reduce:animate-none motion-reduce:hover:scale-100 motion-safe:[animation-fill-mode:backwards]"
                      style={{ animationDelay: `${280 + i * 70}ms` }}
                    >
                      <span className="font-semibold uppercase tracking-wide text-teal-200/80">
                        {k}
                      </span>
                      <span className="font-semibold tabular-nums text-white">
                        {v}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div
              className="flex shrink-0 flex-col items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-md motion-safe:animate-slide-right motion-reduce:animate-none motion-safe:[animation-fill-mode:backwards] lg:items-end lg:text-right"
              style={{ animationDelay: "420ms" }}
            >
              <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                Home
              </span>
              <p className="max-w-[14rem] text-xs leading-relaxed text-teal-100/85">
                Your charts refresh while you&apos;re on this page. Scroll to
                compare subjects and view recent attendance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {attention.length > 0 ? (
        <div
          className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm dark:border-amber-500/25 dark:from-amber-950/30 dark:to-slate-900/80 sm:p-6"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20"
              aria-hidden
            >
              <IconAlert />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">
                Subjects to focus on
              </h2>
              <p className="mt-0.5 text-xs text-amber-900/70 dark:text-amber-200/70">
                When attendance is under 75% or average exams are under 50% in a
                subject.
              </p>
              <ul className="mt-4 space-y-3">
                {attention.map(({ subject, lines }) => (
                  <li
                    key={subject}
                    className="rounded-2xl border border-amber-200/70 bg-white/90 px-4 py-3 dark:border-amber-500/15 dark:bg-slate-900/60"
                  >
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {subject}
                    </span>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {lines.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : hasSubjects && !loading ? (
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white p-5 dark:border-emerald-500/20 dark:from-emerald-950/25 dark:to-slate-900/80 sm:p-6">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
            Nice — nothing flagged right now.
          </p>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Keep checking attendance and marks as new grades come in.
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Subject comparison
        </h2>
        <p className="edu-muted mt-1 text-xs leading-relaxed">
          Green: attendance % per subject (semester to date). Blue: your
          average exam % there.
        </p>
        <div className="mt-4">
          <SubjectWiseChart embedData={breakdown} embedLoading={loading} />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Recent attendance
        </h2>
        <p className="edu-muted mt-1 text-xs leading-relaxed">
          Last five calendar days — share of sessions marked present across your
          program subjects.
        </p>
        <div className="mt-4">
          <AttendanceChart />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
