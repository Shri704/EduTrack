const IA_TYPES = ["ia1", "ia2", "additionalIA"];

const subjectKey = (m) =>
  String(m?.subject?._id || m?.subject || m?.subjectName || "");

const subjectName = (m) =>
  m?.subject?.name || m?.subjectName || m?.subject || "—";

const formatScore = (m) => {
  if (!m) return "—";
  if (m.marksObtained !== undefined && m.totalMarks !== undefined) {
    return `${m.marksObtained}/${m.totalMarks}`;
  }
  return m.score != null ? String(m.score) : "—";
};

const formatShortDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const pickLatest = (current, next) => {
  if (!next) return current;
  if (!current) return next;
  const ta = new Date(current.examDate || current.updatedAt || 0).getTime();
  const tb = new Date(next.examDate || next.updatedAt || 0).getTime();
  return tb >= ta ? next : current;
};

const groupBySubject = (marks) => {
  const map = new Map();
  for (const m of marks) {
    const name = subjectName(m);
    const key = subjectKey(m) || `name:${name}`;
    if (name === "—" && !subjectKey(m)) continue;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name,
        ia1: null,
        ia2: null,
        additionalIA: null
      });
    }
    const g = map.get(key);
    const t = m.examType;
    if (t === "ia1") g.ia1 = pickLatest(g.ia1, m);
    else if (t === "ia2") g.ia2 = pickLatest(g.ia2, m);
    else if (t === "additionalIA") g.additionalIA = pickLatest(g.additionalIA, m);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

const latestIaDate = (row) => {
  const times = [row.ia1, row.ia2, row.additionalIA]
    .map((m) => m?.examDate || m?.updatedAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (!times.length) return null;
  return new Date(Math.max(...times));
};

function sumIa1Ia2(ia1, ia2) {
  let obtained = 0;
  let total = 0;
  let has = false;
  for (const rec of [ia1, ia2]) {
    if (
      rec != null &&
      rec.marksObtained !== undefined &&
      rec.totalMarks !== undefined &&
      Number.isFinite(Number(rec.marksObtained)) &&
      Number.isFinite(Number(rec.totalMarks))
    ) {
      has = true;
      obtained += Number(rec.marksObtained);
      total += Number(rec.totalMarks);
    }
  }
  if (!has) return null;
  return { obtained, total, ia1, ia2 };
}

const MarksTable = ({ marks = [] }) => {
  const iaOnly = marks.filter((m) => IA_TYPES.includes(m.examType));

  if (marks.length === 0) {
    return (
      <div className="edu-table-wrap px-4 py-8 text-center text-xs text-slate-500">
        No marks available.
      </div>
    );
  }

  const iaRows = groupBySubject(iaOnly);

  const IACell = ({ record }) => {
    if (!record) {
      return <span className="text-slate-500">—</span>;
    }
    const dateStr = formatShortDate(record.examDate || record.updatedAt);
    return (
      <div className="space-y-0.5">
        <p className="font-medium text-slate-900 dark:text-slate-100">{formatScore(record)}</p>
        {dateStr ? (
          <p className="text-[10px] text-slate-500" title="Recorded on">
            {dateStr}
          </p>
        ) : null}
      </div>
    );
  };

  const SumIa12Cell = ({ ia1, ia2 }) => {
    const sum = sumIa1Ia2(ia1, ia2);
    if (!sum) {
      return <span className="text-slate-500">—</span>;
    }
    const breakdown = [ia1, ia2]
      .map((r) => (r != null ? formatScore(r) : null))
      .filter((s) => s && s !== "—")
      .join(" + ");
    return (
      <div
        className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-2 dark:border-emerald-500/25 dark:bg-emerald-950/35"
        title={breakdown ? `${breakdown} → Σ` : "Sum of 1st + 2nd IA"}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300/90">
          Sum
        </p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
          {sum.obtained}/{sum.total}
        </p>
      </div>
    );
  };

  return (
    <div className="edu-table-wrap min-w-0">
      <p className="border-b border-slate-200 bg-slate-100/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600 sm:px-4 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
        Subject-wise marks (IA)
      </p>
      <div className="space-y-3 p-3 md:hidden">
        {iaRows.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">No IA marks yet.</p>
        ) : (
          iaRows.map((row) => {
            const last = latestIaDate(row);
            return (
              <div
                key={row.key}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {row.name}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      1st IA
                    </p>
                    <div className="mt-1.5">
                      <IACell record={row.ia1} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      2nd IA
                    </p>
                    <div className="mt-1.5">
                      <IACell record={row.ia2} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <SumIa12Cell ia1={row.ia1} ia2={row.ia2} />
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Additional IA
                    </p>
                    <div className="mt-1.5">
                      <IACell record={row.additionalIA} />
                    </div>
                  </div>
                </div>
                <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Last updated:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {last ? formatShortDate(last) : "—"}
                  </span>
                </p>
              </div>
            );
          })
        )}
      </div>
      <div className="hidden overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] md:block">
        <table className="edu-table-text min-w-[40rem] w-full md:min-w-full">
          <thead className="edu-thead">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">1st IA</th>
              <th className="px-4 py-3">2nd IA</th>
              <th className="min-w-[5.5rem] px-4 py-3">Sum</th>
              <th className="px-4 py-3">Additional IA</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {iaRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-5 text-center text-slate-500"
                >
                  No IA marks yet.
                </td>
              </tr>
            )}
            {iaRows.map((row) => {
              const last = latestIaDate(row);
              return (
                <tr
                  key={row.key}
                  className="edu-tr"
                >
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="px-4 py-2.5 align-top">
                    <IACell record={row.ia1} />
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <IACell record={row.ia2} />
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <SumIa12Cell ia1={row.ia1} ia2={row.ia2} />
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <IACell record={row.additionalIA} />
                  </td>
                  <td className="px-4 py-2.5 align-top text-[11px] text-slate-600 dark:text-slate-400">
                    {last ? formatShortDate(last) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksTable;
