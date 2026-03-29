import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { fetchSubjects } from "../../api/subjectApi.js";
import {
  fetchMyTeacherProfile,
  updateMyTeacherProfile,
} from "../../api/teacherApi.js";

const btnPrimary =
  "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:from-emerald-600 dark:to-cyan-600 dark:shadow-emerald-900/30";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25";

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-teal-100/90 bg-white shadow-md shadow-teal-900/[0.04] ring-1 ring-slate-900/[0.02] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-none dark:ring-white/5">
      <div className="border-b border-teal-50 bg-gradient-to-r from-teal-50/80 to-transparent px-5 py-4 dark:border-slate-700/80 dark:from-slate-800/50 dark:to-transparent">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function catalogLabel(s) {
  if (!s || typeof s !== "object") return "";
  const name = String(s.name || "").trim();
  const code = String(s.code || "").trim();
  if (name && code) return `${name} (${code})`;
  return name || code || "";
}

const TeacherProfile = () => {
  const { user } = useSelector((s) => s.auth);
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [qualification, setQualification] = useState("");
  const [knownSubjects, setKnownSubjects] = useState([]);
  const [customSubject, setCustomSubject] = useState("");
  const [catalogPick, setCatalogPick] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchMyTeacherProfile();
      setDetail(data);
    } catch {
      setDetail(null);
      setLoadError("Could not load teaching profile.");
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSubjects();
        const list = Array.isArray(data) ? data : data?.data || [];
        if (!cancelled) setCatalog(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!detail) return;
    setQualification(String(detail.qualification ?? ""));
    const ks = detail.knownSubjects;
    setKnownSubjects(Array.isArray(ks) ? ks.map((x) => String(x)) : []);
  }, [detail]);

  const displayName = useMemo(() => {
    const u = detail?.user || user;
    if (!u) return "Teacher";
    const fn = u.firstName?.trim();
    const ln = u.lastName?.trim();
    if (fn && ln) return `${fn} ${ln}`;
    if (fn) return fn;
    if (u.name?.trim()) return u.name.trim();
    return u.email || "Teacher";
  }, [detail?.user, user]);

  const email = detail?.user?.email || user?.email || "—";

  const initials = useMemo(() => {
    const n = displayName.trim();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase() || "TC";
  }, [displayName]);

  const assignedSubjectNames = useMemo(() => {
    const subs = detail?.subjects;
    if (!Array.isArray(subs) || !subs.length) return [];
    return subs.map((s) =>
      typeof s === "object" && s?.name ? s.name : String(s)
    );
  }, [detail?.subjects]);

  const catalogOptions = useMemo(() => {
    const seen = new Set(
      knownSubjects.map((k) => k.trim().toLowerCase()).filter(Boolean)
    );
    return catalog
      .map((s) => ({ id: s._id, label: catalogLabel(s) }))
      .filter((o) => o.label && !seen.has(o.label.toLowerCase()));
  }, [catalog, knownSubjects]);

  const addKnown = useCallback((raw) => {
    const t = String(raw ?? "").trim();
    if (!t) return;
    setKnownSubjects((prev) => {
      const lower = t.toLowerCase();
      if (prev.some((p) => p.toLowerCase() === lower)) return prev;
      if (prev.length >= 40) {
        toast.error("You can add at most 40 subject areas.");
        return prev;
      }
      return [...prev, t.slice(0, 80)];
    });
  }, []);

  const removeKnown = useCallback((label) => {
    setKnownSubjects((prev) => prev.filter((p) => p !== label));
  }, []);

  const handleSaveExpertise = async (e) => {
    e.preventDefault();
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await updateMyTeacherProfile({
        qualification: qualification.trim(),
        knownSubjects,
      });
      setDetail(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Could not save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadError && !detail) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-teal-800/30 bg-gradient-to-br from-teal-950 via-emerald-950 to-cyan-950 text-white shadow-xl shadow-teal-950/30 dark:border-teal-900/50 dark:shadow-black/40">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">
            Your profile
          </p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold tracking-tight ring-2 ring-white/25 backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-2 text-sm text-teal-100/90">
                Signed in as{" "}
                <span className="font-medium text-white">{email}</span>
              </p>
              {detail?.employeeId ? (
                <p className="mt-3 text-xs text-teal-100/80">
                  Employee ID:{" "}
                  <span className="font-semibold text-white tabular-nums">
                    {detail.employeeId}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="School record"
            subtitle="Set by your administrator"
          >
            {!detail ? (
              <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700/60 sm:flex-row sm:justify-between">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Department
                  </dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">
                    {detail.department || "—"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Assigned subjects
                  </dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">
                    {assignedSubjectNames.length
                      ? assignedSubjectNames.join(", ")
                      : "—"}
                  </dd>
                </div>
              </dl>
            )}
          </SectionCard>

          <SectionCard
            title="Your expertise"
            subtitle="Qualification and subject areas you know — visible to your school when reviewing your profile"
          >
            {!detail ? (
              <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : (
              <form onSubmit={handleSaveExpertise} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Qualification
                  </label>
                  <textarea
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. M.Sc. Computer Science, B.Ed."
                    className={`${inputClass} min-h-[5rem] resize-y`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {qualification.length}/500
                  </p>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Subjects you know
                  </span>
                  <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Add from the school catalog or type your own (e.g. Python,
                    Data Structures). This is separate from subjects officially
                    assigned to you.
                  </p>

                  {knownSubjects.length ? (
                    <ul className="mb-3 flex flex-wrap gap-2">
                      {knownSubjects.map((tag) => (
                        <li key={tag}>
                          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/90 bg-teal-50/90 pl-2.5 pr-1 py-0.5 text-xs font-medium text-teal-950 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-100">
                            <span className="max-w-[200px] truncate">{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeKnown(tag)}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-teal-800 transition hover:bg-teal-200/80 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                              aria-label={`Remove ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-3 text-xs italic text-slate-500 dark:text-slate-400">
                      No subjects listed yet.
                    </p>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        From catalog
                      </label>
                      <select
                        value={catalogPick}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCatalogPick("");
                          if (v) addKnown(v);
                        }}
                        className={inputClass}
                      >
                        <option value="">Choose a subject…</option>
                        {catalogOptions.map((o) => (
                          <option key={o.id || o.label} value={o.label}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0 flex-[1.2]">
                      <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Custom
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKnown(customSubject);
                              setCustomSubject("");
                            }
                          }}
                          maxLength={80}
                          placeholder="Add a subject or skill"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addKnown(customSubject);
                            setCustomSubject("");
                          }}
                          className="shrink-0 rounded-2xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900 transition hover:bg-teal-100 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {knownSubjects.length}/40 areas
                  </p>
                </div>

                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? "Saving…" : "Save expertise"}
                </button>
              </form>
            )}
          </SectionCard>

          <SectionCard
            title="Account"
            subtitle="Password and login email are managed separately"
          >
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
              Password changes use the same reset flow as students: from the
              login screen, choose <strong>Forgot password</strong> for your
              email.
            </p>
          </SectionCard>
        </div>

        <section className="rounded-3xl border border-teal-100/90 bg-gradient-to-br from-white to-teal-50/40 p-5 shadow-md shadow-teal-900/[0.04] dark:border-slate-700/80 dark:from-slate-900/80 dark:to-slate-900/40 dark:shadow-none">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Quick links
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                to="/teacher"
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-slate-700 transition hover:border-teal-200 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
              >
                <span className="font-semibold text-slate-900 dark:text-white">
                  Dashboard
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/teacher/students"
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-slate-700 transition hover:border-teal-200 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
              >
                <span className="font-semibold text-slate-900 dark:text-white">
                  Student roster
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default TeacherProfile;
