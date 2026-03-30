function resolveCourseLabel(student, branches) {
  const list = Array.isArray(branches) ? branches : [];

  const abbrevFromText = (txt) => {
    const s = String(txt || "").trim();
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower === "computer science" || lower.includes("computer science")) return "CSE";
    if (lower.includes("artificial intelligence") && lower.includes("machine learning")) return "AIML";
    if (lower.includes("information science")) return "ISE";
    if (lower.includes("electronics") && lower.includes("communication")) return "ECE";
    if (lower.includes("electrical") && lower.includes("electronics")) return "EEE";
    if (lower.includes("mechanical")) return "ME";
    if (lower.includes("civil")) return "CE";
    const tokens = s
      .replace(/[^a-z0-9\s]/gi, " ")
      .split(/\s+/)
      .filter(Boolean);
    const letters = tokens.map((w) => w[0]).join("");
    return letters ? letters.toUpperCase() : "";
  };

  const branchId = student?.courseId || student?.course?._id;
  if (branchId) {
    const b = list.find((x) => String(x?._id) === String(branchId));
    if (b) return String(b.code || abbrevFromText(b.name) || b.name || "—");
  }

  const label = String(student?.branch || "").trim();
  if (!label) return "—";

  const byCode = list.find(
    (b) => b?.code && String(b.code).trim().toLowerCase() === label.toLowerCase()
  );
  if (byCode) return String(byCode.code || "—");

  const byName = list.find(
    (b) => b?.name && String(b.name).trim().toLowerCase() === label.toLowerCase()
  );
  if (byName) return String(byName.code || abbrevFromText(byName.name) || byName.name || "—");

  return abbrevFromText(label) || label;
}

const StudentTable = ({ students = [], branches = [], onEdit, onDelete }) => {
  return (
    <div className="edu-table-wrap overflow-x-auto">
      <table className="edu-table-text min-w-full">
        <thead className="edu-thead">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Roll</th>
            <th className="px-4 py-3">Course</th>
            <th className="px-4 py-3">Semester</th>
            <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-5 text-center text-slate-500"
              >
                No students yet.
              </td>
            </tr>
          )}
          {students.map((s) => (
            <tr
              key={s._id || s.rollNumber}
              className="edu-tr"
            >
              <td className="px-4 py-2.5">
                {String(s.name || "—").replace(/\s+User\s*$/i, "").trim() || "—"}
              </td>
              <td className="px-4 py-2.5">{s.email}</td>
              <td className="px-4 py-2.5">{s.rollNumber}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                {resolveCourseLabel(s, branches)}
              </td>
              <td className="px-4 py-2.5">{s.semester}</td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap min-w-[140px]">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit?.(s)}
                    className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] text-slate-800 hover:bg-slate-200 dark:border-transparent dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete?.(s)}
                    className="rounded-full bg-rose-500/90 px-3 py-1 text-[11px] text-slate-950 hover:bg-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;