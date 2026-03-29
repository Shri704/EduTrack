const SubjectForm = ({ initialData = {}, onSubmit, loading, courses = [] }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      new FormData(e.currentTarget).entries()
    );
    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="edu-panel-deep space-y-3 p-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Subject name</label>
          <input
            name="name"
            defaultValue={initialData.name}
            required
            className="edu-input"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Code</label>
          <input
            name="code"
            defaultValue={initialData.code}
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
          >
            <option value="" disabled>
              Select branch
            </option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.department || c.name} {c.code ? `(${c.code})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-slate-700 dark:text-slate-300">Semester</label>
          <input
            name="semester"
            type="number"
            min={1}
            defaultValue={initialData.semester}
            required
            className="edu-input"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/40 transition hover:scale-[1.01] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save subject"}
      </button>
    </form>
  );
};

export default SubjectForm;