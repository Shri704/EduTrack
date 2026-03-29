import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import SubjectForm from "../../components/forms/SubjectForm.jsx";
import {
  fetchSubjects,
  createSubject,
  deleteSubject
} from "../../api/subjectApi.js";
import { fetchBranches } from "../../api/branchApi.js";

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    try {
      const [subjectsData, branchesData] = await Promise.all([
        fetchSubjects(),
        fetchBranches()
      ]);

      setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData?.data || []);
      setCourses(Array.isArray(branchesData) ? branchesData : branchesData?.data || []);
    } catch {
      setSubjects([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (payload) => {
    setLoading(true);
    try {
      await createSubject({
        name: payload.name,
        code: payload.code,
        courseId: payload.courseId,
        semester: Number(payload.semester)
      });
      toast.success("Subject created");
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not create subject";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (s) => {
    const label = s?.name || s?.code || "this subject";
    if (
      !window.confirm(
        `Delete "${label}" permanently? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(s._id);
    try {
      await deleteSubject(s._id);
      toast.success("Subject deleted");
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not delete subject";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="edu-page-title">
          Manage subjects
        </h2>
        <p className="edu-muted mt-1 text-xs">
          Link subjects to courses and teachers.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <SubjectForm onSubmit={handleCreate} loading={loading} courses={courses} />
        <div className="edu-table-wrap">
          <table className="edu-table-text min-w-full">
            <thead className="edu-thead">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 && (
                <tr className="border-t border-slate-200 dark:border-slate-800/80">
                  <td
                    className="px-4 py-8 text-center text-slate-500"
                    colSpan={5}
                  >
                    No subjects yet. Add one using the form.
                  </td>
                </tr>
              )}
              {subjects.map((s) => (
                <tr
                  key={s._id}
                  className="edu-tr"
                >
                  <td className="px-4 py-2.5">{s.name}</td>
                  <td className="px-4 py-2.5">{s.code}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {s?.course?.department || s?.course?.name || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {s?.semester ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s._id}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === s._id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubjects;