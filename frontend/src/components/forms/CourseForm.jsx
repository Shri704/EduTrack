const CourseForm = ({ initialData = {}, onSubmit, loading }) => {
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
          <label className="text-slate-700 dark:text-slate-300">Course name</label>
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
          <label className="text-slate-700 dark:text-slate-300">Semester count</label>
          <input
            type="number"
            name="semesters"
            min={1}
            max={12}
            defaultValue={initialData.semesters || 6}
            className="edu-input"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save course"}
      </button>
    </form>
  );
};

export default CourseForm;