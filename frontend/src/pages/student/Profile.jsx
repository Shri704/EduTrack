import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  fetchMyProfile,
  updateMyProfile,
  updateMyPassword,
} from "../../api/studentApi.js";

const btnPrimary =
  "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:from-emerald-600 dark:to-cyan-600 dark:shadow-emerald-900/30";

const btnSecondary =
  "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700";

const profileInput =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25";

function formatLongDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatMemberSince(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function DetailRow({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 last:border-0 dark:border-slate-700/60 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 shrink-0 sm:w-[40%]">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {hint ? (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
      <span className="min-w-0 text-sm font-medium text-slate-900 dark:text-slate-100 sm:text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

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

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [editRollNumber, setEditRollNumber] = useState("");
  const [editName, setEditName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadError(null);
      try {
        const me = await fetchMyProfile();
        if (cancelled) return;
        setProfile(me);
        setEditRollNumber(String(me?.rollNumber ?? ""));
        setEditName(String(me?.name ?? ""));
      } catch {
        if (!cancelled) {
          setProfile(null);
          setLoadError("Could not load your profile.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const safeProfile = useMemo(() => {
    if (!profile || typeof profile !== "object") return null;
    const { password: _p, ...rest } = profile;
    return rest;
  }, [profile]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const initials = useMemo(() => {
    const n = String(safeProfile?.name || "Student").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase() || "ST";
  }, [safeProfile?.name]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage("");

    const roll = String(editRollNumber ?? "").trim();
    if (!roll) {
      const msg = "Roll number is required.";
      setProfileMessage(msg);
      toast.error(msg);
      return;
    }

    const name = String(editName ?? "").trim();

    setProfileSaving(true);
    try {
      const updated = await updateMyProfile({ rollNumber: roll, name });
      setProfile(updated);
      setEditRollNumber(String(updated?.rollNumber ?? ""));
      toast.success("Profile updated");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setProfileMessage(msg);
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      const msg = "All password fields are required.";
      setPasswordMessage(msg);
      toast.error(msg);
      return;
    }

    if (String(newPassword) !== String(confirmNewPassword)) {
      const msg = "New password and confirm password do not match.";
      setPasswordMessage(msg);
      toast.error(msg);
      return;
    }

    setPasswordSaving(true);
    try {
      await updateMyPassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password updated");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password";
      setPasswordMessage(msg);
      toast.error(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loadError && !safeProfile) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
        {loadError}
      </div>
    );
  }

  if (!safeProfile) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-3xl bg-gradient-to-br from-teal-100/80 to-cyan-100/60 dark:from-slate-800 dark:to-slate-900" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-800 lg:col-span-2" />
          <div className="h-48 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const created = safeProfile.createdAt
    ? formatLongDate(safeProfile.createdAt)
    : "—";
  const updated = safeProfile.updatedAt
    ? formatLongDate(safeProfile.updatedAt)
    : "—";
  const memberSince = formatMemberSince(safeProfile.createdAt);
  const semLabel =
    safeProfile.semester != null ? `Semester ${safeProfile.semester}` : "—";

  return (
    <div className="space-y-8 pb-10">
      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-800/30 bg-gradient-to-br from-teal-950 via-emerald-950 to-cyan-950 text-white shadow-xl shadow-teal-950/30 dark:border-teal-900/50 dark:shadow-black/40">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">
            {todayLabel}
          </p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold tracking-tight ring-2 ring-white/25 backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {safeProfile.name || "Student"}
              </h1>
              <p className="mt-2 text-sm text-teal-100/90">
                Signed in as{" "}
                <span className="font-medium text-white">{safeProfile.email}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  <span className="text-emerald-200/90">Roll</span>
                  <span className="tabular-nums text-white">
                    {safeProfile.rollNumber ?? "—"}
                  </span>
                </span>
                {safeProfile.branch ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                    <span className="text-emerald-200/90">Branch</span>
                    <span>{safeProfile.branch}</span>
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  <span className="text-emerald-200/90">Semester</span>
                  <span className="tabular-nums">
                    {safeProfile.semester ?? "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Academic record"
            subtitle="Details stored with your enrollment (read-only fields are set by your school)"
          >
            <DetailRow
              label="Full name"
              value={safeProfile.name}
              hint="Shown on reports and attendance"
            />
            <DetailRow label="Roll number" value={safeProfile.rollNumber} />
            <DetailRow
              label="Branch / program"
              value={safeProfile.branch || "—"}
              hint="Contact admin if this should change"
            />
            <DetailRow label="Current semester" value={semLabel} />
          </SectionCard>

          <SectionCard
            title="Account"
            subtitle="Login identity and when your record last changed"
          >
            <DetailRow
              label="Email"
              value={safeProfile.email}
              hint="Used to sign in; managed by your institution"
            />
            <DetailRow label="Account type" value="Student" />
            <DetailRow
              label="Member since"
              value={memberSince}
              hint="Approximate start of your record in EduTrack"
            />
            <DetailRow
              label="Account created"
              value={created}
            />
            <DetailRow label="Last updated" value={updated} />
            <p className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-xs leading-relaxed text-teal-900 dark:border-teal-500/20 dark:bg-teal-950/25 dark:text-teal-100/90">
              You can change your <strong>display name</strong> and{" "}
              <strong>roll number</strong> below when your school allows it.
              Email, branch, and semester updates go through your administrator.
            </p>
          </SectionCard>

          <SectionCard
            title="Update name & roll"
            subtitle="Save button applies changes to your student record"
          >
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Roll number
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={editRollNumber}
                    onChange={(e) => setEditRollNumber(e.target.value)}
                    className={profileInput}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={profileInput}
                  />
                </div>
              </div>
              {profileMessage && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
                  {profileMessage}
                </p>
              )}
              <button type="submit" disabled={profileSaving} className={btnPrimary}>
                {profileSaving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="Security"
            subtitle="Change the password you use to sign in"
          >
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Current password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={profileInput}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={profileInput}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={profileInput}
                  />
                </div>
              </div>
              {passwordMessage && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
                  {passwordMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={passwordSaving}
                className={btnSecondary}
              >
                {passwordSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-teal-100/90 bg-gradient-to-br from-white to-teal-50/40 p-5 shadow-md shadow-teal-900/[0.04] dark:border-slate-700/80 dark:from-slate-900/80 dark:to-slate-900/40 dark:shadow-none">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Quick links
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/student/reports"
                  className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-slate-700 transition hover:border-teal-200 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900 dark:text-white">Reports</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Export CSV, JSON, or PDF</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/student/attendance"
                  className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-slate-700 transition hover:border-teal-200 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900 dark:text-white">Attendance</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Review sessions by subject</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/student/marks"
                  className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-slate-700 transition hover:border-teal-200 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-200">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75v12m0 0-4.5-4.5m4.5 4.5 4.5-4.5M4.5 20.25h15" />
                    </svg>
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900 dark:text-white">Marks</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">IA and exam results</span>
                  </span>
                </Link>
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/40 p-5 dark:border-teal-500/25 dark:bg-teal-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200">
              Need a correction?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-teal-900/85 dark:text-teal-100/85">
              Phone, address, and guardian details are not stored in EduTrack.
              If your <strong>branch</strong> or <strong>semester</strong> is wrong, contact your
              administrator.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
