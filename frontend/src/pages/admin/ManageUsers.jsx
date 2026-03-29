import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { fetchUsers, deleteUser } from "../../api/userApi.js";

function displayName(u) {
  const fn = u?.firstName?.trim();
  const ln = u?.lastName?.trim();
  if (fn && ln) return `${fn} ${ln}`;
  if (fn) return fn;
  return u?.email || "—";
}

const roleBadgeClass = {
  superadmin:
    "bg-violet-100 text-violet-900 ring-violet-200/80 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30",
  admin:
    "bg-teal-100 text-teal-900 ring-teal-200/80 dark:bg-teal-500/15 dark:text-teal-200 dark:ring-teal-500/30",
  teacher:
    "bg-cyan-100 text-cyan-900 ring-cyan-200/80 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-500/30",
  student:
    "bg-slate-100 text-slate-800 ring-slate-200/80 dark:bg-slate-700/50 dark:text-slate-200 dark:ring-slate-500/25",
};

const deleteBtnClass =
  "inline-flex items-center justify-center rounded-lg border border-red-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition motion-safe:duration-200 hover:border-red-400 hover:bg-red-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 dark:border-red-500/30 dark:bg-slate-900/60 dark:text-red-300 dark:hover:bg-red-950/40";

const AdminManageUsers = () => {
  const { user: current } = useSelector((s) => s.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await fetchUsers();
        if (!cancelled) setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setError(
            e.response?.data?.message ||
              "Could not load users. Check that you are signed in as an admin."
          );
          setUsers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuper = current?.role === "superadmin";
  const isAdmin = current?.role === "admin";
  const canUseDeleteColumn = isSuper || isAdmin;
  const currentId = current?._id || current?.id;

  const superadminCount = useMemo(
    () => users.filter((x) => x.role === "superadmin").length,
    [users]
  );

  const handleDelete = async (u) => {
    const id = u._id || u.id;
    if (!id) return;
    if (String(id) === String(currentId)) {
      toast.error("You cannot delete your own account.");
      return;
    }
    const name = displayName(u);
    const ok = window.confirm(
      `Delete ${name} permanently?\n\nThis removes their login and all related records (attendance, marks, profile data, notifications) where applicable. This cannot be undone.`
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await deleteUser(id);
      toast.success(res?.message || "User removed");
      setUsers((prev) => prev.filter((x) => String(x._id || x.id) !== String(id)));
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        e.message ||
        "Could not delete this user.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Manage users
        </h1>
        <p className="edu-muted mt-1 text-sm">
          Accounts that can sign in to EduTrack. Passwords are never shown here.
        </p>
        {isAdmin && !isSuper ? (
          <p className="mt-2 rounded-xl border border-teal-200/90 bg-teal-50/80 px-3 py-2 text-sm text-teal-950 dark:border-teal-500/25 dark:bg-teal-950/35 dark:text-teal-100/90">
            You can delete <strong className="font-medium">student</strong> and{" "}
            <strong className="font-medium">teacher</strong> accounts from this list. Creating users
            or removing admins/super admins is reserved for super admin.
          </p>
        ) : isSuper ? (
          <p className="edu-muted mt-2 text-xs">
            Delete removes the account and linked data: students lose roster, attendance, and marks;
            teachers lose profile-linked attendance and marks rows.
          </p>
        ) : null}
      </div>

      <div className="edu-card-soft overflow-hidden border border-slate-200/80 dark:border-slate-700/60">
        {error ? (
          <p className="p-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/90 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                {canUseDeleteColumn ? (
                  <th className="px-4 py-3 text-right">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canUseDeleteColumn ? 5 : 4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={canUseDeleteColumn ? 5 : 4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const role = u.role || "student";
                  const badge =
                    roleBadgeClass[role] || roleBadgeClass.student;
                  const rowId = u._id || u.id;
                  const isSelf = String(rowId) === String(currentId);
                  const canDeleteThisRow = (() => {
                    if (isSelf) return false;
                    if (isAdmin)
                      return role === "student" || role === "teacher";
                    if (isSuper)
                      return role !== "superadmin" || superadminCount > 1;
                    return false;
                  })();
                  return (
                    <tr
                      key={rowId}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {displayName(u)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {u.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badge}`}
                        >
                          {role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {u.isActive === false ? (
                          <span className="text-amber-700 dark:text-amber-400">Inactive</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">Active</span>
                        )}
                        {u.isVerified === false ? (
                          <span className="ml-2 text-xs text-slate-500">· unverified</span>
                        ) : null}
                      </td>
                      {canUseDeleteColumn ? (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className={deleteBtnClass}
                            disabled={deletingId === rowId || !canDeleteThisRow}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : !canDeleteThisRow
                                  ? isAdmin
                                    ? "Admins can only delete student or teacher accounts"
                                    : "Cannot delete the only super admin account"
                                  : "Delete user and related data"
                            }
                            onClick={() => handleDelete(u)}
                          >
                            {deletingId === rowId ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminManageUsers;
