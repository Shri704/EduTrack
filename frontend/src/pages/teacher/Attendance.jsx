import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { markAttendance } from "../../api/attendanceApi.js";
import { fetchStudents } from "../../api/studentApi.js";
import { fetchBranches } from "../../api/branchApi.js";
import { fetchSubjects } from "../../api/subjectApi.js";

const TeacherAttendance = () => {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBranches();
        const list = Array.isArray(data) ? data : data?.data;
        setBranches(Array.isArray(list) ? list : []);
      } catch {
        setBranches([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!branch || !semester) {
      setSubjects([]);
      setSubjectId("");
      setRows([]);
      setLoadingSubjects(false);
      setLoadingStudents(false);
      return;
    }

    let cancelled = false;
    setLoadingSubjects(true);
    setLoadingStudents(true);

    const load = async () => {
      try {
        const [subjectsData, studentsData] = await Promise.all([
          fetchSubjects({ course: branch, semester: Number(semester) }),
          fetchStudents({ course: branch, semester: Number(semester) })
        ]);

        if (cancelled) return;

        const subjList = Array.isArray(subjectsData)
          ? subjectsData
          : subjectsData?.data || [];
        setSubjects(Array.isArray(subjList) ? subjList : []);
        setSubjectId("");

        const studList = Array.isArray(studentsData)
          ? studentsData
          : studentsData?.data || [];
        const students = (Array.isArray(studList) ? studList : []).sort((a, b) => {
          const ar = String(a?.rollNumber ?? "").trim();
          const br = String(b?.rollNumber ?? "").trim();
          const an = Number.parseInt(ar, 10);
          const bn = Number.parseInt(br, 10);
          const aIsNum = Number.isFinite(an) && String(an) === ar;
          const bIsNum = Number.isFinite(bn) && String(bn) === br;
          if (aIsNum && bIsNum) return an - bn;
          return ar.localeCompare(br, undefined, { numeric: true, sensitivity: "base" });
        });
        setRows(
          students.map((s) => ({
            studentId: s._id,
            rollNumber: s.rollNumber,
            name:
              s.user?.firstName || s.user?.lastName
                ? `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim()
                : s.name || s.rollNumber || "Student",
            status: "absent"
          }))
        );
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setSubjectId("");
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSubjects(false);
          setLoadingStudents(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [branch, semester]);

  const toggleStatus = (studentId) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, status: r.status === "present" ? "absent" : "present" }
          : r
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (!branch || !semester || !subjectId) {
        throw new Error("Please select branch, semester, and subject.");
      }
      const records = rows.map((r) => ({
        student: r.studentId,
        subject: subjectId,
        date,
        status: r.status
      }));
      await markAttendance({ records });
      setMessage("Attendance saved.");
      toast.success("Attendance saved");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to save attendance";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="edu-page-title">
          Mark attendance
        </h2>
        <p className="edu-muted mt-1 text-xs">
          Quickly record today&apos;s class attendance.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="edu-panel-deep space-y-4 p-4"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
            className="edu-input"
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} {b.code ? `(${b.code})` : ""}
              </option>
            ))}
          </select>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
            className="edu-input"
          >
            <option value="">Select semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            disabled={!branch || !semester || loadingSubjects}
            className="edu-input disabled:opacity-60"
          >
            <option value="">
              {loadingSubjects
                ? "Loading subjects..."
                : !branch || !semester
                  ? "Select branch & semester first"
                  : subjects.length
                    ? "Select subject"
                    : "No subjects found"}
            </option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.code ? `(${s.code})` : ""}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              const v = e.target.value;
              if (v && v > today) {
                toast.error("You can't mark attendance for future dates.");
                setDate(today);
                return;
              }
              setDate(v);
            }}
            required
            className="edu-input"
          />
        </div>

        <div className="edu-table-wrap">
          <table className="edu-table-text min-w-full">
            <thead className="edu-thead">
              <tr>
                <th className="px-4 py-3">Roll no</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingStudents && (
                <tr className="border-t border-slate-200 dark:border-slate-800/80">
                  <td className="px-4 py-5 text-slate-500" colSpan={3}>
                    Loading students...
                  </td>
                </tr>
              )}
              {!loadingStudents && rows.length === 0 && (
                <tr className="border-t border-slate-200 dark:border-slate-800/80">
                  <td className="px-4 py-5 text-slate-500" colSpan={3}>
                    Select branch and semester to load students.
                  </td>
                </tr>
              )}
              {!loadingStudents &&
                rows.map((r) => {
                  const isPresent = r.status === "present";
                  return (
                    <tr
                      key={r.studentId}
                      className="edu-tr"
                    >
                      <td className="px-4 py-2.5 text-slate-400">
                        {r.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-2.5">{r.name}</td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(r.studentId)}
                          className={`relative inline-flex h-8 w-[6.25rem] shrink-0 select-none items-center rounded-full border-2 px-1 text-xs font-extrabold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-slate-900 ${
                            isPresent
                              ? "border-emerald-800 bg-emerald-200 dark:border-emerald-400/80 dark:bg-emerald-950/50"
                              : "border-rose-800 bg-rose-200 dark:border-rose-400/80 dark:bg-rose-950/40"
                          }`}
                          aria-pressed={isPresent}
                          aria-label={isPresent ? "Present, click to mark absent" : "Absent, click to mark present"}
                          title={isPresent ? "Present — click for absent" : "Absent — click for present"}
                        >
                          <span
                            className={`absolute left-2.5 z-[2] ${
                              isPresent
                                ? "text-slate-700 dark:text-emerald-300"
                                : "text-rose-950 dark:text-rose-50"
                            }`}
                          >
                            A
                          </span>
                          <span
                            className={`absolute right-2.5 z-[2] ${
                              isPresent
                                ? "text-emerald-950 dark:text-emerald-50"
                                : "text-slate-700 dark:text-rose-200"
                            }`}
                          >
                            P
                          </span>
                          <span
                            aria-hidden
                            className={`pointer-events-none absolute top-1/2 z-[3] h-[1.375rem] w-[1.375rem] -translate-y-1/2 rounded-full border-2 border-slate-700 bg-white shadow-md transition-[left,box-shadow] dark:border-slate-300 dark:bg-slate-200 dark:shadow-lg ${
                              isPresent
                                ? "left-[calc(100%-1.375rem-0.35rem)]"
                                : "left-[0.35rem]"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>
        {message && (
          <p className="mt-2 text-xs text-slate-400">{message}</p>
        )}
      </form>
    </div>
  );
};

export default TeacherAttendance;