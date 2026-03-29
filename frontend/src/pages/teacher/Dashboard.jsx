import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchBranches } from "../../api/branchApi.js";
import { fetchSubjects } from "../../api/subjectApi.js";
import { getAttendanceReportTeacher } from "../../api/reportApi.js";
import {
  attendanceStatusLetter,
  attendanceStatusTitle
} from "../../utils/attendanceDisplay.js";

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

function formatTeacherReportScore(m) {
  if (!m) return null;
  if (m.marksObtained !== undefined && m.totalMarks !== undefined) {
    return `${m.marksObtained}/${m.totalMarks}`;
  }
  return m.score != null ? String(m.score) : "—";
}

function formatTeacherReportShortDate(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pickLatestMarkRecord(current, next) {
  if (!next) return current;
  if (!current) return next;
  const ta = new Date(current.examDate || current.updatedAt || 0).getTime();
  const tb = new Date(next.examDate || next.updatedAt || 0).getTime();
  return tb >= ta ? next : current;
}

function latestMarkByExamType(marks, examType) {
  return (marks || []).reduce((acc, m) => {
    if (m.examType !== examType) return acc;
    return pickLatestMarkRecord(acc, m);
  }, null);
}

function TeacherReportIACell({ record }) {
  if (!record) {
    return <span className="text-slate-500">—</span>;
  }
  const dateStr = formatTeacherReportShortDate(record.examDate || record.updatedAt);
  const score = formatTeacherReportScore(record);
  return (
    <div className="space-y-0.5">
      <p className="font-medium text-slate-900 dark:text-slate-100">{score}</p>
      {record.grade ? (
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          {record.grade}
        </p>
      ) : null}
      {dateStr ? (
        <p className="text-[10px] text-slate-500 dark:text-slate-400" title="Recorded on">
          {dateStr}
        </p>
      ) : null}
    </div>
  );
}

function sumIa1Ia2Records(ia1Record, ia2Record) {
  let obtained = 0;
  let total = 0;
  let has = false;
  for (const rec of [ia1Record, ia2Record]) {
    if (
      rec != null &&
      rec.marksObtained !== undefined &&
      rec.totalMarks !== undefined &&
      Number.isFinite(Number(rec.marksObtained)) &&
      Number.isFinite(Number(rec.totalMarks))
    ) {
      has = true;
      obtained += Number(rec.marksObtained);
      total += Number(rec.totalMarks);
    }
  }
  if (!has) return null;
  return { obtained, total, ia1Record, ia2Record };
}

function TeacherReportSumIa12Cell({ ia1Record, ia2Record }) {
  const sum = sumIa1Ia2Records(ia1Record, ia2Record);
  if (!sum) {
    return <span className="text-slate-500">—</span>;
  }
  const breakdown = [ia1Record, ia2Record]
    .map((r) => (r != null ? formatTeacherReportScore(r) : null))
    .filter(Boolean)
    .join(" + ");
  return (
    <div
      className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-2 dark:border-emerald-500/25 dark:bg-emerald-950/35"
      title={breakdown ? `${breakdown} → Σ` : "Sum of 1st + 2nd IA"}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300/90">
        Sum
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
        {sum.obtained}/{sum.total}
      </p>
    </div>
  );
}

const TeacherDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const { hash } = useLocation();
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState("");
  // students preview removed

  const compareRollNumberAsc = (a, b) => {
    const getKey = (v) => String(v ?? "").trim();
    const ar = getKey(a?.rollNumber);
    const br = getKey(b?.rollNumber);
    const an = Number.parseInt(ar, 10);
    const bn = Number.parseInt(br, 10);
    const aIsNum = Number.isFinite(an) && String(an) === ar;
    const bIsNum = Number.isFinite(bn) && String(bn) === br;
    if (aIsNum && bIsNum) return an - bn;
    return ar.localeCompare(br, undefined, { numeric: true, sensitivity: "base" });
  };

  const sortedResults = Array.isArray(report?.results)
    ? [...report.results].sort((ra, rb) => compareRollNumberAsc(ra?.student, rb?.student))
    : [];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBranches();
        setBranches(Array.isArray(data) ? data : data?.data || []);
      } catch {
        setBranches([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!branch || !semester) {
      setSubjects([]);
      setSubject("");
      setSubjectsLoading(false);
      return;
    }
    let cancelled = false;
    setSubjectsLoading(true);
    const load = async () => {
      try {
        const data = await fetchSubjects({ course: branch, semester: Number(semester) });
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data && data.data) ? data.data : [];
        setSubjects(Array.isArray(list) ? list : []);
        setSubject("");
      } catch {
        if (!cancelled) setSubjects([]);
        if (!cancelled) setSubject("");
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [branch, semester]);

  useEffect(() => {
    if (hash !== "#subject-report") return;
    const el = document.getElementById("subject-report");
    if (el) {
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, [hash, loading, report]);

  // students preview removed

  const handleFetch = async (e) => {
    e.preventDefault();
    setError("");
    setReport(null);
    if (!branch || !semester || !subject) {
      setError("Please select branch, semester, and subject.");
      return;
    }
    setLoading(true);
    try {
      const params = { branch, semester, subject };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (rollNumber.trim()) params.rollNumber = rollNumber.trim();
      const data = await getAttendanceReportTeacher(params);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const displayName =
    user?.firstName?.trim() ||
    (user?.name && String(user.name).trim().split(/\s+/)[0]) ||
    "there";

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
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

              <ul className="mt-6 flex flex-wrap gap-2">
                <li
                  className="inline-flex items-baseline gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs shadow-lg shadow-black/10 backdrop-blur-md motion-safe:animate-fade-up motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-[1.02] motion-reduce:animate-none motion-reduce:hover:scale-100 motion-safe:[animation-fill-mode:backwards]"
                  style={{ animationDelay: "280ms" }}
                >
                  <span className="font-semibold uppercase tracking-wide text-teal-200/80">
                    Role
                  </span>
                  <span className="font-semibold capitalize text-white">
                    {user?.role === "teacher" ? "Teacher" : user?.role ?? "Teacher"}
                  </span>
                </li>
              </ul>
            </div>

            <div
              className="flex shrink-0 flex-col items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-md motion-safe:animate-slide-right motion-reduce:animate-none motion-safe:[animation-fill-mode:backwards] lg:items-end lg:text-right"
              style={{ animationDelay: "420ms" }}
            >
              <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                Teacher hub
              </span>
              <p className="max-w-[14rem] text-xs leading-relaxed text-teal-100/85">
                Use the subject report below to review attendance, class totals,
                and marks for any class you teach.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="subject-report" className="edu-card-soft scroll-mt-24 min-w-0 p-3 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Subject report</h3>
        <form onSubmit={handleFetch} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            <div className="space-y-1">
              <label className="edu-muted text-xs">From date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="edu-input"
              />
            </div>
            <div className="space-y-1">
              <label className="edu-muted text-xs">To date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="edu-input"
              />
            </div>
            <div className="space-y-1">
              <label className="edu-muted text-xs">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="edu-input"
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name || b.code}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="edu-muted text-xs">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
                className="edu-input"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="edu-muted text-xs">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="edu-input"
              >
                <option value="">
                  {subjectsLoading
                    ? "Loading subjects..."
                    : branch && semester && subjects.length === 0
                      ? "No subjects for this branch/semester"
                      : "Select subject"}
                </option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="edu-muted text-xs">Roll no (optional)</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Leave empty for all"
                className="edu-input"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 disabled:opacity-70 sm:py-2"
              >
                {loading ? "Loading…" : "Fetch report"}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
        </form>

        {report && (
          <div className="mt-6 space-y-6">
            {report.subject && (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Subject: <span className="font-medium text-emerald-700 dark:text-emerald-300">{report.subject.name}</span> ({report.subject.code})
              </p>
            )}
            {(report.startDate || report.endDate) && (
              <p className="edu-muted text-xs">
                Date range:{" "}
                <span className="text-slate-900 dark:text-slate-200">
                  {report.startDate || "—"} → {report.endDate || "—"}
                </span>
              </p>
            )}

            {Array.isArray(report.dates) && report.dates.length > 0 && (
              <div className="edu-table-wrap">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                    Daily attendance
                  </p>
                  <p className="text-xs text-slate-500">
                    {report.dates.length} day(s)
                  </p>
                </div>
                <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                  <table className="edu-table-text w-max min-w-full">
                    <thead className="edu-thead">
                      <tr>
                        <th className="sticky left-0 z-20 bg-slate-100 px-3 py-3 shadow-[1px_0_0_0_rgb(226,232,240)] dark:bg-slate-900/80 dark:shadow-[1px_0_0_0_rgba(30,41,59,0.8)]">
                          Roll
                        </th>
                        <th className="sticky left-[72px] z-20 bg-slate-100 px-3 py-3 shadow-[1px_0_0_0_rgb(226,232,240)] dark:bg-slate-900/80 dark:shadow-[1px_0_0_0_rgba(30,41,59,0.8)]">
                          Name
                        </th>
                        {report.dates.map((d) => (
                          <th key={d} className="min-w-[96px] px-3 py-3 text-center">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((r, i) => (
                        <tr
                          key={r.student?._id || i}
                          className="edu-tr"
                        >
                          <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-slate-600 shadow-[1px_0_0_0_rgb(226,232,240)] dark:bg-slate-950/60 dark:text-slate-400 dark:shadow-[1px_0_0_0_rgba(30,41,59,0.8)]">
                            <span className="block w-[72px] min-w-[72px] max-w-[72px] truncate">
                              {r.student?.rollNumber || "—"}
                            </span>
                          </td>
                          <td className="sticky left-[72px] z-10 bg-white px-3 py-2.5 shadow-[1px_0_0_0_rgb(226,232,240)] dark:bg-slate-950/60 dark:shadow-[1px_0_0_0_rgba(30,41,59,0.8)]">
                            <span className="block w-[160px] min-w-[160px] max-w-[160px] truncate">
                              {String(r.student?.name || "—").replace(/\s+User\s*$/i, "").trim() || "—"}
                            </span>
                          </td>
                          {report.dates.map((d) => {
                            const day = r.daily?.find((x) => x.date === d);
                            const status = day?.status || "absent";
                            const present = status === "present";
                            const late = status === "late";
                            const holiday = status === "holiday";
                            const letter = attendanceStatusLetter(status);
                            return (
                              <td key={d} className="min-w-[96px] px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${
                                    holiday
                                      ? "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:border-sky-400/30 dark:text-sky-200"
                                      : present
                                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-200"
                                        : late
                                          ? "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:border-amber-500/30 dark:text-amber-200"
                                          : "border-rose-500/40 bg-rose-500/15 text-rose-800 dark:border-rose-500/30 dark:text-rose-200"
                                  }`}
                                  title={attendanceStatusTitle(status)}
                                >
                                  {letter}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {!sortedResults.length && (
                        <tr className="border-t border-slate-200 dark:border-slate-800/80">
                          <td className="px-4 py-6 text-center text-slate-500" colSpan={2 + report.dates.length}>
                            No students found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="edu-table-wrap min-w-0">
              <p className="border-b border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-600 sm:px-4 dark:border-slate-800 dark:text-slate-400">
                Classes taken / attended / % are for this subject for the full
                term to date. If you use a date range, it only affects the daily
                grid above—not these totals.
              </p>
              <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
              <table className="edu-table-text min-w-[28rem] sm:min-w-full">
                <thead className="edu-thead">
                  <tr>
                    <th className="px-4 py-3">Roll no</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Classes taken</th>
                    <th className="px-4 py-3">Attended</th>
                    <th className="px-4 py-3">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r, i) => (
                    <tr key={r.student?._id || i} className="edu-tr">
                      <td className="px-4 py-2.5">{r.student?.rollNumber || "—"}</td>
                      <td className="px-4 py-2.5">
                        {String(r.student?.name || "—").replace(/\s+User\s*$/i, "").trim() || "—"}
                      </td>
                      <td className="px-4 py-2.5">{r.classesTaken ?? "—"}</td>
                      <td className="px-4 py-2.5">{r.classesAttended ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        {r.attendancePercent != null ? `${Math.round(r.attendancePercent)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {!report.results?.length && (
                <p className="px-4 py-6 text-center text-slate-500">No records for the selected subject and filters.</p>
              )}
            </div>

            {sortedResults.length === 1 && sortedResults[0].marks?.length > 0 && (() => {
              const ia1r = latestMarkByExamType(sortedResults[0].marks, "ia1");
              const ia2r = latestMarkByExamType(sortedResults[0].marks, "ia2");
              const iaAr = latestMarkByExamType(sortedResults[0].marks, "additionalIA");
              return (
              <>
              <div className="edu-table-wrap min-w-0 md:hidden">
                <p className="border-b border-slate-200 bg-slate-100/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                  Subject-wise marks (IA)
                </p>
                <div className="space-y-3 p-3">
                  <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Subject
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {report.subject?.name || "—"}
                      {report.subject?.code ? (
                        <span className="edu-muted ml-1 text-xs font-normal">
                          ({report.subject.code})
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        1st IA
                      </p>
                      <div className="mt-2">
                        <TeacherReportIACell record={ia1r} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        2nd IA
                      </p>
                      <div className="mt-2">
                        <TeacherReportIACell record={ia2r} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <TeacherReportSumIa12Cell
                        ia1Record={ia1r}
                        ia2Record={ia2r}
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40 sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Additional IA
                      </p>
                      <div className="mt-2">
                        <TeacherReportIACell record={iaAr} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="edu-table-wrap hidden min-w-0 overflow-hidden md:block">
                <p className="border-b border-slate-200 bg-slate-100/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                  Subject-wise marks (IA)
                </p>
                <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                  <table className="edu-table-text min-w-full">
                    <thead className="edu-thead">
                      <tr>
                        <th className="px-4 py-3 text-left">Subject</th>
                        <th className="px-4 py-3 text-left">1st IA</th>
                        <th className="px-4 py-3 text-left">2nd IA</th>
                        <th className="min-w-[5.5rem] px-4 py-3 text-left">Sum</th>
                        <th className="px-4 py-3 text-left">Additional IA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="edu-tr">
                        <td className="px-4 py-3 align-top text-slate-800 dark:text-slate-200">
                          <span className="font-medium">
                            {report.subject?.name || "—"}
                          </span>
                          {report.subject?.code ? (
                            <span className="edu-muted ml-1 text-xs font-normal">
                              ({report.subject.code})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TeacherReportIACell record={ia1r} />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TeacherReportIACell record={ia2r} />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TeacherReportSumIa12Cell
                            ia1Record={ia1r}
                            ia2Record={ia2r}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <TeacherReportIACell record={iaAr} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
