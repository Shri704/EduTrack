import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { getAttendanceReport } from "../../api/reportApi.js";
import { fetchBranches } from "../../api/branchApi.js";
import { downloadTextFile, rowsToCsv } from "../../utils/csvExport.js";
import {
  ADMIN_SUMMARY_HEAD,
  buildAdminAttendanceMatrix,
  buildAdminMarksMatrix,
  buildAdminStudentSummaryRows,
} from "../../utils/reportRows.js";
import {
  downloadAdminAttendanceDetailPdf,
  downloadAdminMarksDetailPdf,
  downloadAdminSummaryPdf,
} from "../../utils/reportPdf.js";

const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200/90 bg-white px-3 py-2 text-xs font-semibold text-teal-950 shadow-sm transition motion-safe:duration-200 hover:border-teal-400 hover:bg-teal-50/90 active:scale-[0.98] disabled:opacity-45 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800";

const navyBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1e3d] via-[#152c55] to-[#1e3a6e] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-900/25 transition motion-safe:duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-45 dark:from-[#1e3a8a] dark:via-[#1d4ed8] dark:to-[#2563eb]";

const AdminReports = () => {
  const [branches, setBranches] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBranches();
        const list = Array.isArray(data) ? data : data?.data || [];
        setBranches(list);
      } catch {
        setBranches([]);
      }
    };
    load();
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    setError("");
    setReport(null);
    if (!branch || !semester) {
      setError("Please select branch and semester.");
      return;
    }
    setLoading(true);
    try {
      const params = {
        branch,
        semester,
        includeRecords: "1",
      };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const rollTrim = rollNumber.trim();
      if (rollTrim) params.rollNumber = rollTrim;
      const data = await getAttendanceReport(params);
      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load report."
      );
    } finally {
      setLoading(false);
    }
  };

  const stamp = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [report]
  );

  const metaLines = useMemo(() => {
    if (!report) return [];
    const lines = [
      `Branch/course filter: ${report.branch} · Semester ${report.semester}`,
    ];
    if (report.startDate && report.endDate) {
      lines.push(`Date range: ${report.startDate} → ${report.endDate}`);
    } else {
      lines.push("Date range: all dates (no filter applied)");
    }
    lines.push(`Students: ${report.results?.length ?? 0}`);
    lines.push(
      `Row-level attendance lines: ${report.flatAttendance?.length ?? 0}`
    );
    lines.push(`Row-level marks lines: ${report.flatMarks?.length ?? 0}`);
    if (report.flatMarks?.length) {
      const { bodyRows, subjects } = buildAdminMarksMatrix(report.flatMarks);
      lines.push(
        `Marks pivot: ${bodyRows.length} student row(s) × ${subjects.length} subject column(s)`
      );
    }
    return lines;
  }, [report]);

  const downloadSummaryCsv = () => {
    if (!report?.results?.length) {
      toast.error("Prepare export data first");
      return;
    }
    const body = buildAdminStudentSummaryRows(report.results);
    downloadTextFile(
      `admin-class-summary-${stamp}.csv`,
      rowsToCsv(ADMIN_SUMMARY_HEAD, body)
    );
    toast.success("Summary CSV downloaded");
  };

  const cohortStudentList = useMemo(
    () => (report?.results ?? []).map((r) => r.student).filter(Boolean),
    [report]
  );

  /** One column per subject + totals (wide CSV for Excel). */
  const downloadAttendanceCsv = () => {
    if (!cohortStudentList.length) {
      toast.error("Load export data first (no students in cohort)");
      return;
    }
    const flat = report?.flatAttendance || [];
    const { headRow, bodyRows } = buildAdminAttendanceMatrix(flat, {
      cohortStudents: cohortStudentList,
      excelCsv: true,
    });
    downloadTextFile(
      `admin-attendance-by-subject-${stamp}.csv`,
      rowsToCsv(headRow, bodyRows)
    );
    toast.success("Attendance CSV downloaded (one column per subject)");
  };

  const downloadMarksDetailCsv = () => {
    if (!cohortStudentList.length && !report?.flatMarks?.length) {
      toast.error("No marks data for this query");
      return;
    }
    const flat = report?.flatMarks || [];
    const { headRow, bodyRows } = buildAdminMarksMatrix(flat, {
      cohortStudents: cohortStudentList.length ? cohortStudentList : undefined,
      excelCsv: true,
    });
    downloadTextFile(
      `admin-marks-by-subject-${stamp}.csv`,
      rowsToCsv(headRow, bodyRows)
    );
    toast.success("Marks CSV downloaded (one column per subject)");
  };

  const downloadSummaryPdf = () => {
    if (!report?.results?.length) {
      toast.error("Prepare export data first");
      return;
    }
    downloadAdminSummaryPdf({
      stamp,
      metaLines,
      headRow: ADMIN_SUMMARY_HEAD,
      bodyRows: buildAdminStudentSummaryRows(report.results),
    });
    toast.success("Summary PDF downloaded");
  };

  const downloadAttendancePdf = () => {
    if (!cohortStudentList.length) {
      toast.error("No students in this cohort — check branch and semester");
      return;
    }
    const flat = report?.flatAttendance || [];
    const { headRow, bodyRows } = buildAdminAttendanceMatrix(flat, {
      cohortStudents: cohortStudentList,
    });
    downloadAdminAttendanceDetailPdf({
      stamp,
      metaLines,
      headRow,
      bodyRows,
    });
    toast.success("Attendance matrix PDF downloaded");
  };

  const downloadMarksPdf = () => {
    if (!cohortStudentList.length && !report?.flatMarks?.length) {
      toast.error("No marks data for this query");
      return;
    }
    const flat = report?.flatMarks || [];
    const { headRow, bodyRows } = buildAdminMarksMatrix(flat, {
      cohortStudents: cohortStudentList.length ? cohortStudentList : undefined,
      excelCsv: false,
    });
    downloadAdminMarksDetailPdf({
      stamp,
      metaLines,
      headRow,
      bodyRows,
    });
    toast.success("Marks PDF downloaded (one column per subject)");
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-fade-down">
        <h2 className="edu-page-title">Report downloads</h2>
        <p className="edu-muted mt-1 max-w-3xl text-xs sm:text-sm">
          This area is <strong>export-only</strong>: choose filters, load data,
          then download CSV or PDF. Leave <strong>Roll</strong> empty to include{" "}
          <strong>all students</strong> in the selected branch and semester.{" "}
          <strong>Attendance CSV</strong> and <strong>marks CSV/PDF</strong> use one column per subject.
        </p>
      </div>

      <form
        onSubmit={handleFetch}
        className="edu-panel-deep p-4 text-sm motion-safe:animate-fade-up"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              From date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="edu-input"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              To date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="edu-input"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              Branch
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
              className="edu-input"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name || b.code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
              className="edu-input"
            >
              <option value="">Select</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              Roll (optional)
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Blank = whole class"
              className="edu-input"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110 disabled:opacity-60 dark:from-emerald-500 dark:to-teal-600 dark:text-slate-950"
            >
              {loading ? "Preparing…" : "Load export data"}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>

      {report && (
        <div className="space-y-4 motion-safe:animate-fade-up">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-white to-teal-50/40 px-4 py-3 shadow-md dark:border-slate-700 dark:from-slate-900/70 dark:to-slate-900/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Students
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {report.results?.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-white to-cyan-50/30 px-4 py-3 shadow-md dark:border-slate-700 dark:from-slate-900/70 dark:to-slate-900/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                Attendance rows
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {report.flatAttendance?.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-white to-emerald-50/30 px-4 py-3 shadow-md dark:border-slate-700 dark:from-slate-900/70 dark:to-slate-900/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Marks rows
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {report.flatMarks?.length ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Downloads
            </p>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
              {metaLines.join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={downloadSummaryCsv} className={outlineBtn}>
                Summary CSV
              </button>
              <button
                type="button"
                onClick={downloadAttendanceCsv}
                className={outlineBtn}
                disabled={!cohortStudentList.length}
              >
                Attendance CSV
              </button>
              <button
                type="button"
                onClick={downloadMarksDetailCsv}
                className={outlineBtn}
                disabled={
                  !cohortStudentList.length && !report.flatMarks?.length
                }
              >
                Marks CSV
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={downloadSummaryPdf} className={navyBtn}>
                Summary PDF
              </button>
              <button
                type="button"
                onClick={downloadAttendancePdf}
                className={navyBtn}
                disabled={!cohortStudentList.length}
              >
                Attendance matrix PDF
              </button>
              <button
                type="button"
                onClick={downloadMarksPdf}
                className={navyBtn}
                disabled={
                  !cohortStudentList.length && !report.flatMarks?.length
                }
              >
                Marks PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
