import { useEffect, useState } from "react";
import { fetchBranches } from "../../api/branchApi.js";

const StudentForm = ({ initialData = {}, onSubmit, loading }) => {
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBranchesLoading(true);
    const load = async () => {
      try {
        const list = await fetchBranches();
        if (!cancelled) setBranches(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("[EduTrack] Failed to load branches:", err?.message || err);
        if (!cancelled) setBranches([]);
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.semester = Number(payload.semester || 1);
    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="edu-panel-deep space-y-3 p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Name</label>
          <input
            name="name"
            defaultValue={initialData.name}
            required
            className="edu-input"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={initialData.email}
            required
            className="edu-input"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Roll number</label>
          <input
            name="rollNumber"
            defaultValue={initialData.rollNumber}
            required
            className="edu-input"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Branch</label>
          <select
            name="courseId"
            defaultValue={initialData.courseId || initialData.course?._id || ""}
            required
            className="edu-input"
            disabled={branchesLoading}
          >
            <option value="">
              {branchesLoading ? "Loading branches..." : "Select branch"}
            </option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} {b.code ? `(${b.code})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Semester</label>
          <input
            type="number"
            min={1}
            max={12}
            name="semester"
            defaultValue={initialData.semester || 1}
            required
            className="edu-input"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save student"}
      </button>
    </form>
  );
};

export default StudentForm;