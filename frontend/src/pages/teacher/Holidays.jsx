import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchBranches } from "../../api/branchApi.js";
import { fetchSubjects } from "../../api/subjectApi.js";
import {
  createHoliday,
  listHolidays,
  removeHoliday
} from "../../api/holidayApi.js";

const fmtYmd = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (!Number.isFinite(x.getTime())) return "";
  return x.toISOString().slice(0, 10);
};

const TeacherHolidays = () => {
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [subjectId, setSubjectId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBranches();
        const list = Array.isArray(data) ? data : data?.data;
        setBranches(Array.isArray(list) ? list : []);
      } catch {
        setBranches([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!branch || semester === "" || !subjectId) {
      setHolidays([]);
      return;
    }
    let cancelled = false;
    setLoadingList(true);
    (async () => {
      try {
        const rows = await listHolidays(branch, semester, subjectId || null);
        if (!cancelled) setHolidays(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setHolidays([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branch, semester, subjectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSubjects(true);
      try {
        if (!branch || semester === "") {
          if (!cancelled) {
            setSubjects([]);
            setSubjectId("");
          }
          return;
        }
        const subsRaw = await fetchSubjects({
          course: branch,
          semester: Number(semester)
        });
        const list = Array.isArray(subsRaw) ? subsRaw : subsRaw?.data || [];
        if (cancelled) return;
        setSubjects(list);
        setSubjectId((prev) => {
          const stillValid = prev && list.some((s) => String(s._id) === String(prev));
          return stillValid ? prev : list[0]?._id || "";
        });
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setSubjectId("");
        }
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branch, semester]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branch || semester === "" || !subjectId || !date) {
      toast.error("Select branch, semester, subject, and date.");
      return;
    }
    setSaving(true);
    try {
      const res = await createHoliday({
        courseId: branch,
        semester: Number(semester),
        date,
        note: note.trim(),
        subjectId
      });
      toast.success(res?.message || "Holiday saved");
      setNote("");
      const rows = await listHolidays(branch, semester, subjectId || null);
      setHolidays(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Could not save holiday"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (holidayDate) => {
    if (!branch || semester === "" || !subjectId || !holidayDate) return;
    const ok = window.confirm(
      "Remove this holiday? Attendance for that day will be reset to absent for affected rows in this semester."
    );
    if (!ok) return;
    try {
      await removeHoliday({
        courseId: branch,
        semester: Number(semester),
        date: holidayDate,
        subjectId
      });
      toast.success("Holiday removed");
      const rows = await listHolidays(branch, semester, subjectId || null);
      setHolidays(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Could not remove"
      );
    }
  };

  const listReady = Boolean(branch && semester !== "" && subjectId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="edu-page-title">Holidays</h2>
        <p className="edu-muted mt-1 text-xs">
          Choose <strong className="font-medium text-slate-800 dark:text-slate-200">branch</strong>,{" "}
          <strong className="font-medium text-slate-800 dark:text-slate-200">semester</strong>, and{" "}
          <strong className="font-medium text-slate-800 dark:text-slate-200">subject</strong> and{" "}
          <strong className="font-medium text-slate-800 dark:text-slate-200">date</strong>. Students in
          that cohort get{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">H</span> for this subject on
          that day. Holiday rows are excluded from attendance percentage.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="edu-panel-deep space-y-4 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                Semester {s}
              </option>
            ))}
          </select>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            disabled={!branch || semester === "" || loadingSubjects || subjects.length === 0}
            className="edu-input disabled:opacity-60"
          >
            <option value="">
              {loadingSubjects
                ? "Loading subjects..."
                : !branch || semester === ""
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
            onChange={(e) => {
              const v = e.target.value;
              setDate(v);
            }}
            required
            className="edu-input"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="edu-input"
          />
        </div>
        <button
          type="submit"
            disabled={saving || !branch || semester === "" || !subjectId}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Mark as holiday"}
        </button>
      </form>

      <div className="edu-panel-deep p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400">
          Saved holidays{" "}
          {!listReady ? "(select branch, semester, and subject)" : null}
        </p>
        {loadingList && (
          <p className="mt-3 text-xs text-slate-500">Loading…</p>
        )}
        {!loadingList && listReady && holidays.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">No holidays recorded for this cohort yet.</p>
        )}
        {!loadingList && holidays.length > 0 && (
          <ul className="mt-3 space-y-2">
            {holidays.map((h) => {
              const key = h._id || `${h.date}-${h.semester}`;
              const ymd = fmtYmd(h.date);
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {ymd || "—"}
                    {h.semester != null ? (
                      <span className="edu-muted ml-2 font-normal">
                        · Sem {h.semester}
                      </span>
                    ) : null}
                    {h.note ? (
                      <span className="edu-muted ml-2 font-normal">
                        {h.note}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(h.date)}
                    className="rounded-lg border border-rose-200/90 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-950/40"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherHolidays;
