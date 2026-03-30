import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createBranch,
  deleteBranch,
  fetchBranches
} from "../../api/branchApi.js";

const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await fetchBranches();
      const list = Array.isArray(data) ? data : data?.data;
      setBranches(Array.isArray(list) ? list : []);
    } catch {
      setBranches([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError("");
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      await createBranch({
        name: payload.name,
        code: payload.code,
        description: payload.description || ""
      });
      toast.success("Branch added");
      form.reset();
      setOpen(false);
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to add branch. Ensure backend is running on port 5000.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branch) => {
    if (!branch?._id) return;
    setLoading(true);
    setError("");
    try {
      await deleteBranch(branch._id);
      toast.success("Branch removed");
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to remove branch. Check backend.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="edu-page-title">Branches</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Add and manage branches (departments/courses).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40"
        >
          Add Branch
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </p>
      )}

      {open && (
        <form
          onSubmit={handleCreate}
          className="edu-panel-deep space-y-3 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300">Branch code</label>
              <input
                name="code"
                placeholder="CSE"
                required
                className="edu-input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300">Branch name</label>
              <input
                name="name"
                placeholder="Computer Science"
                required
                className="edu-input"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-slate-700 dark:text-slate-300">Description (optional)</label>
              <input
                name="description"
                placeholder="4-year program, 8 semesters..."
                className="edu-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/40 disabled:opacity-70"
          >
            {loading ? "Saving..." : "Save Branch"}
          </button>
        </form>
      )}

      <div className="edu-table-wrap">
        <table className="edu-table-text min-w-full">
          <thead className="edu-thead">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr
                key={b._id}
                className="edu-tr"
              >
                <td className="px-4 py-2.5">{b.code || "—"}</td>
                <td className="px-4 py-2.5">{b.name || "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    disabled={loading}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-800 hover:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-200 disabled:opacity-70"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!branches.length && (
              <tr className="border-t border-slate-200 dark:border-slate-800/80">
                <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                  No branches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBranches;

