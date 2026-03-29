import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { getMyStudentReport } from "../../api/reportApi.js";
import {
  downloadTextFile,
  formatDateYMD,
  rowsToCsv,
} from "../../utils/csvExport.js";
import {
  buildStudentAttendanceWideExport,
  buildStudentMarksWideRows,
  MARKS_CSV_HEAD_STUDENT,
  pctMarks,
  subjectLabel,
} from "../../utils/reportRows.js";
import { downloadStudentReportPdf } from "../../utils/reportPdf.js";

const btnPrimary =
  "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0c1e3d] via-[#152c55] to-[#1e4976] px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-900/25 transition motion-safe:duration-200 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:from-[#1e3a8a] dark:via-[#1d4ed8] dark:to-[#2563eb]";

const btnSecondary =
  "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200/90 bg-white px-3 py-2.5 text-xs font-semibold text-teal-950 shadow-sm transition motion-safe:duration-200 hover:border-teal-400 hover:bg-teal-50/80 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800";

function DownloadTile({
  title,
  desc,
  format,
  onClick,
  disabled,
  variant = "secondary",
}) {
  const Btn = variant === "primary" ? btnPrimary : btnSecondary;
  return (
    <div className="edu-dl-tile motion-safe:animate-fade-up">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <span className="shrink-0 rounded-lg bg-teal-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-900 dark:bg-teal-500/15 dark:text-teal-200">
          {format}
        </span>
      </div>
      <p className="min-h-[2.5rem] text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
        {desc}
      </p>
      <button type="button" onClick={onClick} disabled={disabled} className={Btn}>
        Download
      </button>
    </div>
  );
}

const StudentReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyStudentReport();
      setReport(data);
    } catch (e) {
      setReport(null);
      setError(
        e.response?.data?.message ||
          e.message ||
          "Could not load your report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stamp = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [report]
  );

  const student = report?.student;
  const marks = Array.isArray(report?.marks) ? report.marks : [];
  const attendance = Array.isArray(report?.attendance) ? report.attendance : [];
  const programSubjects = Array.isArray(report?.programSubjects)
    ? report.programSubjects
    : [];

  const attendancePct = Number(report?.attendancePercent ?? 0);
  const avgScore = Number(
    report?.averagePercent ?? report?.averageScore ?? 0
  );

  const canExportAttendance =
    attendance.length > 0 || programSubjects.length > 0;

  const downloadAttendanceCsv = () => {
    const { head, body } = buildStudentAttendanceWideExport(
      attendance,
      programSubjects,
      { excelCsv: true, marks }
    );
    downloadTextFile(`attendance-records-${stamp}.csv`, rowsToCsv(head, body));
    toast.success("Attendance CSV downloaded");
  };

  const downloadMarksCsv = () => {
    const body = buildStudentMarksWideRows(marks, { excelCsv: true });
    downloadTextFile(
      `marks-${stamp}.csv`,
      rowsToCsv(MARKS_CSV_HEAD_STUDENT, body)
    );
    toast.success("Marks CSV downloaded");
  };

  const downloadFullReportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      summary: {
        attendancePercent: attendancePct,
        averageScore: avgScore,
        classesTaken: report?.classesTaken ?? attendance.length,
        classesAttended: report?.classesAttended,
      },
      student: student
        ? {
            name: student.name,
            rollNumber: student.rollNumber,
            email: student.email,
            branch: student.branch,
            semester: student.semester,
          }
        : null,
      programSubjects,
      attendance: attendance.map((a) => ({
        date: formatDateYMD(a.date),
        subject: subjectLabel(a),
        status:
          String(a.status ?? "").toLowerCase() === "holiday" ? "H" : a.status,
        remarks: a.remarks || "",
      })),
      marks: marks.map((m) => ({
        subject: subjectLabel(m),
        examType: m.examType,
        marksObtained: m.marksObtained,
        totalMarks: m.totalMarks,
        percentage: pctMarks(m),
        grade: m.grade,
        examDate: formatDateYMD(m.examDate),
        remarks: m.remarks || "",
      })),
    };
    downloadTextFile(
      `edutrack-report-${stamp}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
    toast.success("Full report JSON downloaded");
  };

  const downloadStudentPdf = () => {
    const att = buildStudentAttendanceWideExport(attendance, programSubjects);
    downloadStudentReportPdf({
      stamp,
      student,
      attendancePct,
      avgScore,
      attendanceHead: att.head,
      attendanceBody: att.body,
      marksHead: MARKS_CSV_HEAD_STUDENT,
      marksBody: buildStudentMarksWideRows(marks),
    });
    toast.success("PDF downloaded");
  };

  if (loading) {
    return (
      <div className="space-y-4 motion-safe:animate-pulse">
        <div className="h-10 w-52 rounded-xl bg-teal-100/60 dark:bg-slate-800" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-gradient-to-br from-teal-50/80 to-white dark:from-slate-800 dark:to-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 motion-safe:animate-fade-up">
        <div>
          <h2 className="edu-page-title">Report downloads</h2>
          <p className="edu-muted mt-1 text-xs">
            This page only prepares files — open them in Excel or a PDF viewer.
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="motion-safe:animate-fade-down">
          <h2 className="edu-page-title">Report downloads</h2>
          <p className="edu-muted mt-1 max-w-2xl text-xs sm:text-sm">
            Everything here is for <strong>export only</strong>. Use{" "}
            <strong>Dashboard</strong>, <strong>Attendance</strong>, and{" "}
            <strong>Marks</strong> to explore charts and tables. Below: CSV, JSON,
            and a combined PDF with attendance + marks (same layout as CSV).
          </p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-500">
            Data loaded · {attendance.length} attendance rows · {marks.length}{" "}
            marks · {programSubjects.length} program subjects (attendance CSV) ·{" "}
            <button
              type="button"
              onClick={load}
              className="font-semibold text-teal-700 underline-offset-2 transition hover:text-teal-900 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
            >
              Refresh
            </button>
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DownloadTile
          title="Attendance"
          desc="One row per calendar day: Sl no, date, then each subject — name, that day’s status, overall attendance % for that subject."
          format="CSV"
          onClick={downloadAttendanceCsv}
          disabled={!canExportAttendance}
        />
        <DownloadTile
          title="Marks"
          desc="One row per subject: Sl no, Subject, obtained marks (sum), total marks (sum), last updated."
          format="CSV"
          onClick={downloadMarksCsv}
          disabled={marks.length === 0}
        />
        <DownloadTile
          title="Full data (JSON)"
          desc="Machine-readable bundle: summary, student info, attendance and marks arrays."
          format="JSON"
          onClick={downloadFullReportJson}
          disabled={false}
        />
        <DownloadTile
          title="Printable PDF"
          desc="Single file: your summary plus attendance table and marks (same columns as CSV) — ready to share."
          format="PDF"
          onClick={downloadStudentPdf}
          disabled={false}
          variant="primary"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-teal-200/90 bg-teal-50/40 px-4 py-3 text-xs text-teal-900 dark:border-teal-500/25 dark:bg-teal-950/30 dark:text-teal-100/90 motion-safe:animate-fade-up">
        <strong className="font-semibold">Tip:</strong> open CSV in Excel or Google
        Sheets. If dates look wrong, choose the date column → Format → Date.
      </div>
    </div>
  );
};

export default StudentReports;
