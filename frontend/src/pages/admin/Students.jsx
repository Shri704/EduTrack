import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  promoteStudents
} from "../../api/studentApi.js";
import { fetchBranches } from "../../api/branchApi.js";
import StudentForm from "../../components/forms/StudentForm.jsx";
import StudentTable from "../../components/tables/StudentTable.jsx";

const AdminStudents = ({ hidePromote = false } = {}) => {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [filterBranch, setFilterBranch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterRollNumber, setFilterRollNumber] = useState("");
  const [filterKeyword, setFilterKeyword] = useState("");

  const [promoteBranch, setPromoteBranch] = useState("");
  const [promoteSemester, setPromoteSemester] = useState("");
  const [excludeRolls, setExcludeRolls] = useState("");
  const [promoteLoading, setPromoteLoading] = useState(false);

  const sortByRollNumberAsc = (list) => {
    const arr = Array.isArray(list) ? [...list] : [];
    const getKey = (v) => String(v ?? "").trim();
    const cmp = (a, b) => {
      const ar = getKey(a?.rollNumber);
      const br = getKey(b?.rollNumber);
      const an = Number.parseInt(ar, 10);
      const bn = Number.parseInt(br, 10);
      const aIsNum = Number.isFinite(an) && String(an) === ar;
      const bIsNum = Number.isFinite(bn) && String(bn) === br;
      if (aIsNum && bIsNum) return an - bn;
      return ar.localeCompare(br, undefined, { numeric: true, sensitivity: "base" });
    };
    arr.sort(cmp);
    return arr;
  };

  const load = async (overrideFilters = {}) => {
    try {
      const effectiveFilters = {
        filterBranch,
        filterSemester,
        filterRollNumber,
        filterKeyword,
        ...overrideFilters
      };

      const params = {};
      if (effectiveFilters.filterBranch) params.course = effectiveFilters.filterBranch;
      if (effectiveFilters.filterSemester !== "") {
        params.semester = Number(effectiveFilters.filterSemester);
      }

      const data = await fetchStudents(params);
      const list = Array.isArray(data) ? data : data?.data;

      let arr = Array.isArray(list) ? list : [];

      // Client-side filters because backend currently supports only branch+semester.
      const rollNeedle = String(effectiveFilters.filterRollNumber || "").trim();
      if (rollNeedle) {
        arr = arr.filter((s) =>
          String(s?.rollNumber || "")
            .trim()
            .toLowerCase()
            .includes(rollNeedle.toLowerCase())
        );
      }

      const kw = String(effectiveFilters.filterKeyword || "").trim().toLowerCase();
      if (kw) {
        arr = arr.filter((s) => {
          const name = String(s?.name || "").toLowerCase();
          const email = String(s?.email || "").toLowerCase();
          return name.includes(kw) || email.includes(kw);
        });
      }

      setStudents(sortByRollNumberAsc(arr));
    } catch {
      setStudents([]);
    }
  };

  useEffect(() => {
    load({
      filterBranch: "",
      filterSemester: "",
      filterRollNumber: "",
      filterKeyword: ""
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBranchesLoading(true);
    const run = async () => {
      try {
        const data = await fetchBranches();
        const list = Array.isArray(data) ? data : data?.data || [];
        if (!cancelled) setBranches(list);
      } catch {
        if (!cancelled) setBranches([]);
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      if (selected) {
        await updateStudent(selected._id, payload);
        toast.success("Student updated");
      } else {
        await createStudent(payload);
        toast.success("Student created");
      }
      setSelected(null);
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to save student. Check backend.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (student) => {
    if (!student._id) return;
    setLoading(true);
    setError("");
    try {
      const details = await deleteStudent(student._id);
      const a = details?.attendanceRecordsRemoved;
      const m = details?.markRecordsRemoved;
      if (typeof a === "number" && typeof m === "number") {
        toast.success(
          `Student removed (${a} attendance rows, ${m} mark rows${
            details?.userAccountRemoved ? ", login account deleted" : ""
          })`
        );
      } else {
        toast.success("Student and related data removed");
      }
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to delete student. Check backend.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    await load({
      filterBranch,
      filterSemester,
      filterRollNumber,
      filterKeyword
    });
  };

  const handleReset = async () => {
    setFilterBranch("");
    setFilterSemester("");
    setFilterRollNumber("");
    setFilterKeyword("");
    await load({
      filterBranch: "",
      filterSemester: "",
      filterRollNumber: "",
      filterKeyword: ""
    });
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!promoteBranch) {
      toast.error("Select a branch for promotion.");
      return;
    }
    if (promoteSemester === "" || promoteSemester == null) {
      toast.error("Select the current semester (cohort to promote).");
      return;
    }
    const sem = Number(promoteSemester);
    if (sem < 1 || sem > 8) {
      toast.error("Semester must be between 1 and 8.");
      return;
    }
    if (sem >= 8) {
      toast.error("Students already in semester 8 cannot move to a next semester.");
      return;
    }

    const excludeHint = excludeRolls.trim()
      ? ` Excluding roll number(s): ${excludeRolls.trim()}.`
      : " No students excluded.";
    const ok = window.confirm(
      `Promote all students in this branch who are currently in semester ${sem} to semester ${sem + 1}?${excludeHint}\n\nThis cannot be undone automatically.`
    );
    if (!ok) return;

    setPromoteLoading(true);
    setError("");
    try {
      const result = await promoteStudents({
        course: promoteBranch,
        semester: sem,
        excludeRollNumbers: excludeRolls.trim() || undefined,
      });
      const p = result?.promoted ?? 0;
      const ex = result?.excluded ?? 0;
      const sk = result?.skippedMaxSemester ?? 0;
      toast.success(
        result?.message ||
          `Promoted ${p} student(s). ${ex} excluded, ${sk} skipped (already semester 8).`
      );
      await load({
        filterBranch,
        filterSemester,
        filterRollNumber,
        filterKeyword,
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Promotion failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPromoteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="edu-page-title">
            Manage students
          </h2>
          <p className="edu-muted mt-1 text-xs">
            Create, update, and remove student records.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </p>
      )}

      <form
        onSubmit={handleApply}
        className="edu-panel-deep grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-1">
          <label className="edu-muted block text-xs">Branch (optional)</label>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="edu-input"
          >
            <option value="">All branches</option>
            {branchesLoading ? (
              <option value="" disabled>
                Loading...
              </option>
            ) : (
              branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} {b.code ? `(${b.code})` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="edu-muted block text-xs">Semester (optional)</label>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="edu-input"
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="edu-muted block text-xs">Roll no (optional)</label>
          <input
            value={filterRollNumber}
            onChange={(e) => setFilterRollNumber(e.target.value)}
            placeholder="e.g. 1"
            className="edu-input"
          />
        </div>

        <div className="space-y-1">
          <label className="edu-muted block text-xs">Name/Email (optional)</label>
          <input
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="Search name or email"
            className="edu-input"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 disabled:opacity-70"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-900/60"
          >
            Reset
          </button>
        </div>
      </form>

      {!hidePromote ? (
        <div className="edu-card-soft border border-teal-200/80 p-4 dark:border-teal-500/20">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Promote students
          </h3>
          <p className="edu-muted mt-1 text-xs leading-relaxed">
            Moves everyone in the selected{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              branch
            </strong>{" "}
            and{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              current semester
            </strong>{" "}
            up by one (e.g. semester 1 → 2, 2 → 3). Enter one or more{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              roll numbers to exclude
            </strong>{" "}
            — those students stay in the same semester; all others in that cohort
            are promoted. Students already in semester 8 are skipped.
          </p>
          <form
            onSubmit={handlePromote}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-1">
              <label className="edu-muted block text-xs">Branch</label>
              <select
                value={promoteBranch}
                onChange={(e) => setPromoteBranch(e.target.value)}
                className="edu-input"
                required
              >
                <option value="">Select branch</option>
                {branchesLoading ? (
                  <option value="" disabled>
                    Loading...
                  </option>
                ) : (
                  branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.code ? `(${b.code})` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="edu-muted block text-xs">
                Current semester (cohort)
              </label>
              <select
                value={promoteSemester}
                onChange={(e) => setPromoteSemester(e.target.value)}
                className="edu-input"
                required
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <option key={s} value={s}>
                    Semester {s} → {s + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <label className="edu-muted block text-xs">
                Exclude roll number(s) (optional)
              </label>
              <input
                value={excludeRolls}
                onChange={(e) => setExcludeRolls(e.target.value)}
                placeholder="e.g. 101 or 101, 102 103"
                className="edu-input"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={promoteLoading}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-teal-900/20 disabled:opacity-60 dark:from-teal-500 dark:to-emerald-500"
              >
                {promoteLoading ? "Promoting…" : "Promote cohort to next semester"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <StudentForm
          initialData={selected || {}}
          onSubmit={handleSubmit}
          loading={loading}
        />
        <StudentTable
          students={students}
          branches={branches}
          onEdit={setSelected}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default AdminStudents;