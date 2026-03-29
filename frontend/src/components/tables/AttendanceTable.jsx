import { formatDate } from "../../utils/helpers.js";
import {
  attendanceStatusLetter,
  attendanceStatusTitle
} from "../../utils/attendanceDisplay.js";

const AttendanceTable = ({ records = [] }) => {
  return (
    <div className="edu-table-wrap">
      <table className="edu-table-text min-w-full">
        <thead className="edu-thead">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-5 text-center text-sm font-semibold text-slate-700 dark:text-sm dark:font-normal dark:text-slate-500"
              >
                No attendance records.
              </td>
            </tr>
          )}
          {records.map((r) => {
            const st = String(r.status ?? "").toLowerCase();
            const holiday = st === "holiday";
            const present = st === "present";
            const late = st === "late";
            const display = attendanceStatusLetter(r.status);
            return (
            <tr
              key={r._id || `${r.date}-${r.subject}`}
              className="edu-tr"
            >
              <td className="px-4 py-2.5 text-sm font-semibold text-slate-950 dark:text-xs dark:font-normal dark:text-slate-300">
                {formatDate(r.date)}
              </td>
              <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-xs dark:font-normal dark:text-slate-300">
                {r.subjectName ||
                  r?.subject?.name ||
                  (r?.subject?.code ? `${r.subject.code}` : "") ||
                  (typeof r.subject === "string" ? r.subject : "—")}
              </td>
              <td className="px-4 py-2.5">
                <span
                  title={attendanceStatusTitle(r.status)}
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    holiday
                      ? "bg-sky-200/90 text-sky-950 dark:bg-sky-500/15 dark:text-sky-200"
                      : present
                      ? "bg-emerald-200/90 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : late
                        ? "bg-amber-200/90 text-amber-950 dark:bg-amber-500/15 dark:text-amber-200"
                        : "bg-rose-200/90 text-rose-900 dark:bg-rose-500/15 dark:text-rose-300"
                  }`}
                >
                  {display}
                </span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;