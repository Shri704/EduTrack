import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { uploadMarks } from "../../api/performanceApi.js";
import { fetchStudents } from "../../api/studentApi.js";
import { fetchSubjects } from "../../api/subjectApi.js";
import { fetchBranches } from "../../api/branchApi.js";
import { fetchMyTeacherProfile } from "../../api/teacherApi.js";

const hasMark = (v) =>
  v !== "" &&
  v !== undefined &&
  v !== null &&
  Number.isFinite(Number(v));

const TeacherUploadMarks = () => {
  const [step, setStep] = useState(1);

  // Step 1: identify the student/class context
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const [branches, setBranches] = useState([]);

  const [teacherSubjectIds, setTeacherSubjectIds] = useState([]);

  // Step 2: marks upload
  const [subjectId, setSubjectId] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [rows, setRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [branchesData, teacherProfile] = await Promise.all([
          fetchBranches().catch(() => []),
          fetchMyTeacherProfile().catch(() => null)
        ]);

        if (cancelled) return;

        const branchList = Array.isArray(branchesData)
          ? branchesData
          : branchesData?.data || [];
        setBranches(Array.isArray(branchList) ? branchList : []);

        const teacherSubjects = teacherProfile?.subjects;
        const ids = new Set(
          Array.isArray(teacherSubjects)
            ? teacherSubjects.map((s) => String(s?._id || s))
            : []
        );
        setTeacherSubjectIds(Array.from(ids));
      } catch {
        if (!cancelled) setBranches([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateIA = (index, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const next = {
          ...r,
          [field]: value === "" ? "" : Number(value)
        };
        if (
          field !== "additionalIA" &&
          hasMark(next.ia1) &&
          hasMark(next.ia2)
        ) {
          next.additionalIA = "";
        }
        return next;
      })
    );
  };

  const buildStudentDisplayName = (s) => {
    const raw =
      s.user?.firstName || s.user?.lastName
        ? `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim()
        : s.name || s.rollNumber || "Student";
    return String(raw).replace(/\s+User\s*$/i, "").trim() || "Student";
  };

  const handleNext = async () => {
    setMessage("");
    if (!rollNumber || !branch || !semester) {
      const msg = "Please enter roll number, branch, and semester.";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    setPreviewLoading(true);
    try {
      const [subjectsData, studentsData] = await Promise.all([
        fetchSubjects({ course: branch, semester: Number(semester) }).catch(
          () => []
        ),
        fetchStudents({ course: branch, semester: Number(semester) }).catch(
          () => []
        )
      ]);

      const subjectsList = Array.isArray(subjectsData)
        ? subjectsData
        : subjectsData?.data || [];
      const idsSet = new Set(teacherSubjectIds);
      const finalSubjects =
        idsSet.size > 0
          ? subjectsList.filter((s) => idsSet.has(String(s._id)))
          : subjectsList;

      if (!Array.isArray(finalSubjects) || finalSubjects.length === 0) {
        setSubjects([]);
        setSubjectId("");
        setRows([]);
        const msg = "No subjects found for the selected branch/semester.";
        setMessage(msg);
        toast.error(msg);
        return;
      }

      setSubjects(finalSubjects);
      setSubjectId(finalSubjects?.[0]?._id ? String(finalSubjects[0]._id) : "");

      const list = Array.isArray(studentsData)
        ? studentsData
        : studentsData?.data || [];
      const students = Array.isArray(list) ? list : [];
      const targetRoll = String(rollNumber).trim();
      const matchedStudents = students.filter(
        (s) => String(s?.rollNumber ?? "").trim() === targetRoll
      );

      if (matchedStudents.length === 0) {
        setRows([]);
        const msg =
          "Student not found for the given roll number, branch, and semester.";
        setMessage(msg);
        toast.error(msg);
        return;
      }

      const student = matchedStudents[0];
      setRows([
        {
          studentId: student._id,
          rollNumber: student.rollNumber,
          name: buildStudentDisplayName(student),
          ia1: "",
          ia2: "",
          additionalIA: ""
        }
      ]);

      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load student.";
      setMessage(msg);
      toast.error(msg);
      setRows([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (!step || step !== 2) {
        throw new Error("Please proceed to the next step first.");
      }

      const rowHasAnyIa = (r) =>
        hasMark(r.ia1) || hasMark(r.ia2) || hasMark(r.additionalIA);
      if (!rows.some(rowHasAnyIa)) {
        throw new Error(
          "Enter at least one IA mark: 1st IA, 2nd IA, or Additional IA."
        );
      }

      for (const r of rows) {
        if (hasMark(r.additionalIA) && hasMark(r.ia1) && hasMark(r.ia2)) {
          throw new Error(
            "Additional IA is only allowed when 1st IA or 2nd IA is left empty (student could not write one of them)."
          );
        }
      }

      await uploadMarks({
        subjectId,
        totalMarks,
        rows: rows.map((r) => ({
          studentId: r.studentId,
          ia1: r.ia1,
          ia2: r.ia2,
          additionalIA: r.additionalIA
        }))
      });
      setMessage("Marks uploaded.");
      toast.success("Marks uploaded");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to upload marks";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const branchLabel =
    branches.find((b) => b._id === branch)?.name ||
    branches.find((b) => b._id === branch)?.code ||
    "—";

  const inputShell =
    "w-full rounded-lg border border-slate-300/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";

  const StepRailItem = ({ n, title, desc, active }) => (
    <div className="relative flex gap-3 pl-1">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            active
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500"
              : "border border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {n}
        </span>
        {n < 2 ? (
          <span
            className={`my-1 block w-px flex-1 min-h-[2rem] ${
              step > n ? "bg-indigo-400 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
            }`}
            aria-hidden
          />
        ) : null}
      </div>
      <div className={n === 1 ? "pb-1" : ""}>
        <p
          className={`text-sm font-semibold ${
            active ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 max-w-[12rem] text-xs leading-snug text-slate-500 dark:text-slate-500">
          {desc}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl min-w-0 space-y-5 sm:space-y-6">
      <header className="border-b border-slate-200/90 pb-4 sm:pb-5 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Marks entry
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
              Upload marks
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Two quick steps: verify who you&apos;re grading, then fill IA
              scores. Your subject list still follows your teaching assignment.
            </p>
          </div>
          <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
            Step {step} of 2
          </p>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,13rem)_1fr] lg:gap-10 lg:items-start">
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] lg:hidden"
          aria-hidden
        >
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              step === 1
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            1 · Lookup
          </span>
          <span className="shrink-0 self-center text-slate-400">→</span>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              step === 2
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            2 · Scores
          </span>
        </div>
        <nav
          className="mb-6 hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50 lg:mb-0 lg:block lg:sticky lg:top-4"
          aria-label="Steps"
        >
          <StepRailItem
            n={1}
            title="Lookup"
            desc="Roll, branch, semester"
            active={step === 1}
          />
          <StepRailItem
            n={2}
            title="Scores"
            desc="Subject & IA marks"
            active={step === 2}
          />
        </nav>

        <div className="min-w-0">
          {step === 1 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
                className="space-y-6 p-5 sm:p-7"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Who are you grading?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    We load subjects and this learner only after these three
                    fields match a real enrollment.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="upload-marks-roll"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Roll number
                    </label>
                    <input
                      id="upload-marks-roll"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 21CS045"
                      inputMode="numeric"
                      autoComplete="off"
                      className={inputShell}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="upload-marks-branch"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Branch
                    </label>
                    <select
                      id="upload-marks-branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                      className={inputShell}
                    >
                      <option value="">Choose branch…</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} {b.code ? `(${b.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="upload-marks-sem"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Semester
                    </label>
                    <select
                      id="upload-marks-sem"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                      className={inputShell}
                    >
                      <option value="">Choose semester…</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  {message ? (
                    <div
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900 dark:border-rose-500/35 dark:bg-rose-950/50 dark:text-rose-200"
                      role="status"
                    >
                      {message}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      Need a different learner? Edit the roll and continue again.
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={previewLoading}
                    className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:min-h-[2.5rem] sm:w-auto"
                  >
                    {previewLoading ? "Resolving…" : "Next — enter marks"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/90 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Selected learner
                  </p>
                  {rows[0] ? (
                    <p className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                      {rows[0].name}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                      Roll <span className="ml-1 tabular-nums">{rollNumber || "—"}</span>
                    </span>
                    <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                      {branchLabel}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                      Sem {semester || "—"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setRows([]);
                    setMessage("");
                  }}
                  className="w-full shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/90 sm:w-auto sm:py-2"
                >
                  ← Back to lookup
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
                <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="upload-marks-subject"
                        className="text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Subject
                      </label>
                      <select
                        id="upload-marks-subject"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        required
                        disabled={subjects.length === 0}
                        className={`${inputShell} disabled:cursor-not-allowed disabled:opacity-55`}
                      >
                        {subjects.length === 0 ? (
                          <option value="">No subjects found</option>
                        ) : (
                          subjects.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name} {s.code ? `(${s.code})` : ""}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="upload-marks-total"
                        className="text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Maximum marks (paper total)
                      </label>
                      <div className="relative">
                        <input
                          id="upload-marks-total"
                          type="number"
                          min={1}
                          value={totalMarks}
                          onChange={(e) =>
                            setTotalMarks(Number(e.target.value || 0))
                          }
                          placeholder="100"
                          required
                          className={`${inputShell} pr-12`}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                          pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      IA marks
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Values should sit within 0 and the maximum you set. Leave
                      blank where no score applies.
                    </p>

                    <div className="mt-4 space-y-4 md:hidden">
                      {rows.map((r, idx) => (
                        <div
                          key={r.studentId}
                          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Roll {r.rollNumber || "—"}
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                First IA
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={r.ia1}
                                onChange={(e) =>
                                  updateIA(idx, "ia1", e.target.value)
                                }
                                className={`${inputShell} py-2 text-sm tabular-nums`}
                                aria-label={`First IA mark for ${r.name}`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Second IA
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={r.ia2}
                                onChange={(e) =>
                                  updateIA(idx, "ia2", e.target.value)
                                }
                                className={`${inputShell} py-2 text-sm tabular-nums`}
                                aria-label={`Second IA mark for ${r.name}`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Additional IA
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={r.additionalIA}
                                disabled={hasMark(r.ia1) && hasMark(r.ia2)}
                                title={
                                  hasMark(r.ia1) && hasMark(r.ia2)
                                    ? "Additional IA is only for students who did not write 1st or 2nd IA"
                                    : undefined
                                }
                                onChange={(e) =>
                                  updateIA(idx, "additionalIA", e.target.value)
                                }
                                className={`${inputShell} py-2 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50`}
                                aria-label={`Additional IA mark for ${r.name}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 [-webkit-overflow-scrolling:touch] dark:border-slate-700 md:block">
                      <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                            <th className="px-3 py-2.5">Student</th>
                            <th className="px-3 py-2.5">First IA</th>
                            <th className="px-3 py-2.5">Second IA</th>
                            <th className="px-3 py-2.5">Add. IA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/40">
                          {rows.map((r, idx) => (
                            <tr key={r.studentId}>
                              <td className="px-3 py-3 align-middle">
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {r.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {r.rollNumber || "—"}
                                </div>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  value={r.ia1}
                                  onChange={(e) =>
                                    updateIA(idx, "ia1", e.target.value)
                                  }
                                  className={`${inputShell} py-2 text-sm tabular-nums`}
                                  aria-label={`First IA mark for ${r.name}`}
                                />
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  value={r.ia2}
                                  onChange={(e) =>
                                    updateIA(idx, "ia2", e.target.value)
                                  }
                                  className={`${inputShell} py-2 text-sm tabular-nums`}
                                  aria-label={`Second IA mark for ${r.name}`}
                                />
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  value={r.additionalIA}
                                  disabled={hasMark(r.ia1) && hasMark(r.ia2)}
                                  title={
                                    hasMark(r.ia1) && hasMark(r.ia2)
                                      ? "Additional IA is only for students who did not write 1st or 2nd IA"
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    updateIA(idx, "additionalIA", e.target.value)
                                  }
                                  className={`${inputShell} py-2 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50`}
                                  aria-label={`Additional IA mark for ${r.name}`}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Additional IA
                    </span>{" "}
                    — use only if 1st or 2nd IA was missed; it disables when both
                    other cells hold marks.
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    {message ? (
                      <div
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          message === "Marks uploaded."
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/35 dark:bg-rose-950/40 dark:text-rose-200"
                        }`}
                        role="status"
                      >
                        {message}
                      </div>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:min-h-[2.5rem] sm:w-auto sm:self-end"
                      disabled={
                        saving ||
                        !subjectId ||
                        !rows?.length ||
                        subjects.length === 0
                      }
                    >
                      {saving ? "Saving…" : "Save marks"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherUploadMarks;
