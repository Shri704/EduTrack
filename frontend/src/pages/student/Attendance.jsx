import { useEffect, useMemo, useState } from "react";
import { getMyAttendanceFiltered } from "../../api/attendanceApi.js";
import { fetchBranches } from "../../api/branchApi.js";
import { fetchMyProfile } from "../../api/studentApi.js";
import { fetchSubjects } from "../../api/subjectApi.js";
import AttendanceTable from "../../components/tables/AttendanceTable.jsx";
import { useSelector } from "react-redux";
import {
  attendanceStatusLetter,
  attendanceStatusTitle
} from "../../utils/attendanceDisplay.js";

const resolveCourseId = (branches, branchField) => {
  if (branchField == null || branchField === "") return null;
  const list = Array.isArray(branches) ? branches : [];
  const raw = String(branchField).trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  const byId = list.find((c) => String(c._id) === raw);
  if (byId) return byId._id;

  const hit = list.find(
    (c) =>
      String(c.code || "").trim().toLowerCase() === lower ||
      String(c.name || "").trim().toLowerCase() === lower ||
      String(c.department || "").trim().toLowerCase() === lower
  );
  return hit?._id ?? null;
};

const mergeSubjectOptions = (apiSubjects, recordSubjects) => {
  const map = new Map();
  for (const s of apiSubjects) {
    const id = s?._id;
    if (!id) continue;
    const parts = [s.name, s.code].filter(Boolean);
    const label = parts.length ? parts.join(" · ") : "Subject";
    map.set(String(id), label);
  }
  for (const o of recordSubjects) {
    if (o?.value && !map.has(String(o.value))) {
      map.set(String(o.value), o.label);
    }
  }
  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const StudentAttendance = () => {
  const { user } = useSelector((s) => s.auth);
  const [records, setRecords] = useState([]);
  /** All classes in current semester program subjects (full term to date). */
  const [semesterSummary, setSemesterSummary] = useState(null);
  const [semesterStatsLoading, setSemesterStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [lastApplied, setLastApplied] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profile, branchesRaw] = await Promise.all([
          fetchMyProfile(),
          fetchBranches()
        ]);
        if (!cancelled) setStudentProfile(profile || null);
        const branches = Array.isArray(branchesRaw)
          ? branchesRaw
          : branchesRaw?.data || [];
        const courseId = resolveCourseId(branches, profile?.branch);
        const sem = profile?.semester;
        if (courseId != null && sem != null) {
          const subsRaw = await fetchSubjects({
            course: courseId,
            semester: Number(sem)
          });
          const subs = Array.isArray(subsRaw) ? subsRaw : subsRaw?.data || [];
          if (!cancelled) setEnrolledSubjects(subs);
        }
      } catch {
        if (!cancelled) {
          setEnrolledSubjects([]);
          setStudentProfile(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSemesterStatsLoading(true);
      try {
        const data = await getMyAttendanceFiltered({ summaryOnly: "1" });
        const raw = Array.isArray(data) ? null : data;
        const s = raw?.semesterSummary;
        if (!cancelled && s) {
          setSemesterSummary({
            total: Number(s.total || 0),
            present: Number(s.present || 0),
            absent: Number(s.absent || 0),
            percentage: Number(s.percentage || 0)
          });
        }
      } catch {
        if (!cancelled) setSemesterSummary(null);
      } finally {
        if (!cancelled) setSemesterStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toDayKey = (d) => {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    return x.toISOString().slice(0, 10);
  };

  const buildDateKeys = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    if (s > e) return [];
    const out = [];
    const cur = new Date(s);
    while (cur <= e) {
      out.push(toDayKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const extractSubjects = (recs = []) => {
    const map = new Map();
    for (const r of recs) {
      const id = r?.subject?._id || (typeof r?.subject === "string" ? r.subject : null);
      if (!id) continue;
      const label =
        r?.subject?.name ||
        (r?.subject?.code ? `${r.subject.code}` : "") ||
        r?.subjectName ||
        "Subject";
      map.set(String(id), label);
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const recordSubjectOptions = useMemo(
    () => extractSubjects(records),
    [records]
  );

  useEffect(() => {
    setSubjectOptions(
      mergeSubjectOptions(enrolledSubjects, recordSubjectOptions)
    );
  }, [enrolledSubjects, recordSubjectOptions]);

  const fetchAttendance = async (params, appliedSnapshot = null) => {
    try {
      setError("");
      setLoading(true);
      const data = await getMyAttendanceFiltered(params);
      const list = Array.isArray(data) ? data : data?.records;
      const recs = Array.isArray(list) ? list : [];
      setRecords(recs);
      const sem = Array.isArray(data) ? null : data?.semesterSummary;
      if (sem) {
        setSemesterSummary({
          total: Number(sem.total || 0),
          present: Number(sem.present || 0),
          absent: Number(sem.absent || 0),
          percentage: Number(sem.percentage || 0)
        });
      }
      if (appliedSnapshot) setLastApplied(appliedSnapshot);
    } catch (err) {
      setRecords([]);
      setError(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (e) => {
    e.preventDefault();
    setError("");
    const hasSubject = Boolean(subject);
    const hasAnyDate = Boolean(startDate || endDate);
    if (!hasSubject && !hasAnyDate) {
      setError("Select a subject and/or at least one date, then Apply.");
      return;
    }
    const params = {};
    if (subject) params.subject = subject;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    fetchAttendance(params, {
      subject,
      startDate,
      endDate
    });
  };

  const filterDescription = useMemo(() => {
    if (!lastApplied) {
      return {
        subjLabel: "Not loaded",
        datePart: "—",
        line: "Apply filters to load data"
      };
    }
    const subjLabel = lastApplied.subject
      ? subjectOptions.find((o) => o.value === lastApplied.subject)?.label ||
        "Selected subject"
      : "All subjects (filtered)";
    let datePart = "All dates";
    if (lastApplied.startDate && lastApplied.endDate) {
      datePart = `${lastApplied.startDate} → ${lastApplied.endDate}`;
    } else if (lastApplied.startDate) {
      datePart = `From ${lastApplied.startDate}`;
    } else if (lastApplied.endDate) {
      datePart = `Until ${lastApplied.endDate}`;
    }
    return { subjLabel, datePart, line: `${subjLabel} · ${datePart}` };
  }, [lastApplied, subjectOptions]);

  const appliedClosedRange = Boolean(
    lastApplied?.startDate && lastApplied?.endDate
  );
  const canShowDaily = Boolean(lastApplied?.subject && appliedClosedRange);
  const dailyDates = canShowDaily
    ? buildDateKeys(lastApplied.startDate, lastApplied.endDate)
    : [];
  const statusByDay = (() => {
    if (!canShowDaily) return new Map();
    const m = new Map();
    for (const r of records) {
      const key = toDayKey(r.date);
      if (key) m.set(key, r.status);
    }
    return m;
  })();

  const displayRoll =
    studentProfile?.rollNumber || user?.rollNumber || "—";
  const displayName =
    (studentProfile?.name && String(studentProfile.name).trim()) ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "—";

  const fieldLabel =
    "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-wide sm:text-slate-700 dark:text-slate-500 dark:sm:text-slate-400";

  const fieldControl =
    "edu-input min-h-[44px] text-base sm:min-h-0 sm:text-sm";

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Your attendance
        </h2>
        <div className="mt-2 rounded-xl border border-teal-100/90 bg-gradient-to-br from-teal-50/80 to-white/90 p-3 text-[10px] leading-relaxed text-slate-700 shadow-sm dark:border-slate-700/80 dark:from-slate-900/50 dark:to-slate-900/30 dark:text-slate-400 sm:mt-3 sm:p-4 sm:text-xs sm:leading-relaxed">
          <p>
            Pick a subject and/or dates, then{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              Apply
            </span>
            . Daily P/A grid needs a{" "}
            <span className="font-semibold">subject + both dates</span>.
          </p>
          <p className="mt-2 border-t border-teal-100/80 pt-2 dark:border-slate-700/80">
            <span className="font-semibold text-slate-800 dark:text-slate-300">
              This semester
            </span>{" "}
            totals = all classes in your program subjects (full term), not one
            day only.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleApply}
        className="edu-panel-deep space-y-3 p-3 sm:space-y-4 sm:p-4"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:items-end">
          <div className="space-y-1 sm:space-y-1.5">
            <label className={fieldLabel}>
              <span className="sm:hidden">From · optional</span>
              <span className="hidden sm:inline">From date (optional)</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={fieldControl}
            />
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <label className={fieldLabel}>
              <span className="sm:hidden">To · optional</span>
              <span className="hidden sm:inline">To date (optional)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={fieldControl}
            />
          </div>
          <div className="space-y-1 sm:space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className={fieldLabel}>
              <span className="sm:hidden">Subject · optional</span>
              <span className="hidden sm:inline">Subject (optional)</span>
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={fieldControl}
            >
              <option value="">All subjects</option>
              {subjectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-1 rounded-2xl border border-teal-200/70 bg-gradient-to-br from-white via-teal-50/40 to-cyan-50/30 p-3 shadow-inner shadow-teal-900/5 dark:border-slate-600/60 dark:from-slate-900/50 dark:via-slate-900/40 dark:to-slate-900/30 dark:shadow-none sm:mt-2 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <p className="text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-500 sm:max-w-md sm:flex-1 sm:text-[11px] sm:leading-relaxed">
            Subject list includes your program enrollments and any subject from
            past attendance.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 inline-flex w-full min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-[#0d9488] via-[#059669] to-[#0891b2] px-6 text-sm font-bold tracking-wide text-white shadow-lg shadow-teal-600/25 ring-1 ring-white/10 transition hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-[1.03] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 dark:text-white dark:shadow-emerald-900/40 dark:ring-white/5 sm:mt-0 sm:min-h-[46px] sm:w-auto sm:min-w-[180px] sm:px-8"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 shrink-0 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading…
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 shrink-0 opacity-95"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Apply filters
              </>
            )}
          </button>
        </div>
      </form>

      {!loading && lastApplied && (
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-3 py-2.5 text-[10px] text-slate-800 shadow-sm dark:border-emerald-500/20 dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-emerald-500/5 dark:text-slate-300 dark:shadow-none sm:px-4 sm:py-3 sm:text-xs">
          <p className="font-bold text-teal-900 dark:font-semibold dark:text-emerald-200/90">
            Current view
          </p>
          <p className="mt-1 font-medium text-slate-800 dark:font-normal dark:text-slate-400">
            <span className="text-slate-950 dark:text-slate-200">{filterDescription.subjLabel}</span>
            <span className="text-slate-600 dark:text-slate-500"> · </span>
            <span className="text-slate-950 dark:text-slate-200">{filterDescription.datePart}</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-700 dark:font-normal dark:text-slate-500 sm:text-[11px]">
            {records.length} record{records.length === 1 ? "" : "s"} below.
          </p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-800 dark:font-semibold dark:text-slate-400 sm:text-[11px] sm:tracking-[0.15em]">
          {lastApplied?.subject
            ? "Semester to date · selected subject"
            : "This semester · all program subjects"}
        </p>
        <p className="edu-muted mt-1 text-[9px] leading-snug sm:mt-0.5 sm:text-[10px] sm:leading-normal">
          {lastApplied?.subject
            ? "Totals below are for the subject in your applied filters only (full term to date), not the date range."
            : "Total classes = all sessions recorded from the start of your term through today across enrolled subjects (not the selected day only)."}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="edu-stat-tile px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:font-semibold dark:text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
              Attendance %
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-emerald-800 dark:font-semibold dark:text-emerald-300 sm:mt-2 sm:text-2xl">
              {semesterStatsLoading
                ? "…"
                : semesterSummary && Number.isFinite(semesterSummary.percentage)
                  ? `${Math.round(semesterSummary.percentage)}%`
                  : "—"}
            </p>
          </div>
          <div className="edu-stat-tile px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:font-semibold dark:text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
              Total classes
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-950 dark:font-semibold dark:text-slate-50 sm:mt-2 sm:text-2xl">
              {semesterStatsLoading
                ? "…"
                : semesterSummary != null
                  ? semesterSummary.total
                  : "—"}
            </p>
          </div>
          <div className="edu-stat-tile px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:font-semibold dark:text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
              Present
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-emerald-800 dark:font-semibold dark:text-emerald-200 sm:mt-2 sm:text-2xl">
              {semesterStatsLoading
                ? "…"
                : semesterSummary != null
                  ? semesterSummary.present
                  : "—"}
            </p>
          </div>
          <div className="edu-stat-tile px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:font-semibold dark:text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
              Absent
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-rose-800 dark:font-semibold dark:text-rose-200 sm:mt-2 sm:text-2xl">
              {semesterStatsLoading
                ? "…"
                : semesterSummary != null
                  ? semesterSummary.absent
                  : "—"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-800 dark:text-rose-200 sm:text-xs">
          {error}
        </p>
      )}

      {loading ? (
        <div className="edu-table-wrap px-3 py-5 text-center text-[11px] font-semibold text-slate-800 dark:font-normal dark:text-slate-500 sm:px-4 sm:py-6 sm:text-xs">
          Loading attendance...
        </div>
      ) : !lastApplied ? (
        <div className="edu-panel-deep px-3 py-6 text-center text-xs font-medium leading-relaxed text-slate-800 dark:font-normal dark:text-slate-400 sm:px-4 sm:py-8 sm:text-sm">
          No data yet. Pick filters and tap{" "}
          <span className="font-semibold text-teal-800 dark:text-emerald-300">
            Apply filters
          </span>
          .
        </div>
      ) : canShowDaily && dailyDates.length > 0 ? (
        <div className="edu-table-wrap rounded-2xl">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-800 dark:font-semibold dark:text-slate-400 sm:text-xs sm:tracking-[0.2em]">
                Daily attendance
              </p>
              <p className="mt-0.5 break-words text-[10px] font-medium leading-snug text-slate-700 dark:font-normal dark:text-slate-500 sm:text-[11px] sm:font-semibold">
                {filterDescription.subjLabel} · {filterDescription.datePart}
              </p>
            </div>
            <p className="shrink-0 text-[10px] font-semibold text-slate-700 dark:font-normal dark:text-slate-500 sm:text-xs">
              {dailyDates.length} day(s)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="edu-table-text w-max min-w-full">
              <thead className="edu-thead">
                <tr>
                  <th className="px-3 py-3">Roll</th>
                  <th className="px-3 py-3">Name</th>
                  {dailyDates.map((d) => (
                    <th key={d} className="min-w-[96px] px-3 py-3 text-center">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="edu-tr">
                  <td className="px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-sm dark:font-normal dark:text-slate-400">
                    {displayRoll}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-sm dark:font-normal dark:text-slate-300">
                    <span className="block min-w-[12.5rem] truncate">
                      {displayName}
                    </span>
                  </td>
                  {dailyDates.map((d) => {
                    const hasRecord = statusByDay.has(d);
                    const status = statusByDay.get(d);
                    const present = status === "present";
                    const late = status === "late";
                    const holiday = status === "holiday";
                    return (
                      <td key={d} className="min-w-[96px] px-3 py-2.5 text-center">
                        {!hasRecord ? (
                          <span
                            className="text-[11px] font-semibold text-slate-700 dark:font-normal dark:text-slate-600"
                            title="No attendance record for this day"
                          >
                            —
                          </span>
                        ) : (
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
                            {attendanceStatusLetter(status)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {!records?.length && (
                  <tr className="border-t border-slate-200 dark:border-slate-800/80">
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={2 + dailyDates.length}>
                      No attendance records found for this subject and date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {lastApplied && !canShowDaily && (
            <>
              {lastApplied.subject &&
                (!lastApplied.startDate || !lastApplied.endDate) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-[10px] font-medium leading-snug text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:font-normal dark:text-amber-100/90 sm:px-4 sm:py-3 sm:text-xs sm:leading-normal">
                    Set <span className="font-semibold">both</span> from and to
                    dates, then Apply, for the daily P/A grid.
                  </div>
                )}
              {!lastApplied.subject &&
                (lastApplied.startDate || lastApplied.endDate) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-[10px] font-medium leading-snug text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:font-normal dark:text-amber-100/90 sm:px-4 sm:py-3 sm:text-xs sm:leading-normal">
                    Pick a <span className="font-semibold">subject</span> and{" "}
                    <span className="font-semibold">both</span> dates for the
                    daily grid.
                  </div>
                )}
            </>
          )}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-800 dark:font-semibold dark:text-slate-500 sm:text-[11px] sm:tracking-[0.15em]">
              Record list · {filterDescription.line}
            </p>
            <AttendanceTable records={records} />
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;