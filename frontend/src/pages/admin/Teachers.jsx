import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchTeachers,
  createTeacher,
  deleteTeacher
} from "../../api/teacherApi.js";
import { createUser } from "../../api/userApi.js";

/** Returns a user-facing message if the email is incomplete or invalid; otherwise null. */
function getEmailFormatError(raw) {
  const email = (raw ?? "").trim();
  if (!email) return "Enter an email address.";
  if (!email.includes("@")) {
    return "This email is missing @. Use a full address like name@school.com.";
  }
  const parts = email.split("@");
  if (parts.length !== 2) {
    return "Use exactly one @ in the email (for example: name@school.com).";
  }
  const [local, domain] = parts;
  if (!local) {
    return "Add the part before @ (for example: priya in priya@school.com).";
  }
  if (!domain) {
    return "Add the part after @ with a domain like gmail.com or school.edu.";
  }
  if (!domain.includes(".")) {
    return "Add a domain with a dot after @ (for example .com, .in, or .edu — like school.com).";
  }
  const afterLastDot = domain.slice(domain.lastIndexOf(".") + 1);
  if (!afterLastDot || afterLastDot.length < 2) {
    return "Finish the domain after the dot (for example .com or .org).";
  }
  if (/\s/.test(email)) {
    return "Remove spaces from the email address.";
  }
  return null;
}

const AdminTeachers = () => {
  const { user } = useSelector((state) => state.auth);

  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: ""
  });
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    try {
      const data = await fetchTeachers();
      const list = Array.isArray(data) ? data : data?.data;
      setTeachers(Array.isArray(list) ? list : []);
    } catch {
      setTeachers([
        {
          _id: "t1",
          name: "Prof. Kumar",
          email: "kumar@example.com",
          department: "CSE"
        }
      ]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTeacherChange = (e) => {
    const { name, value } = e.target;
    if (name === "email" && error) setError("");
    setTeacherForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    if (name === "email" && adminError) setAdminError("");
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const emailErr = getEmailFormatError(teacherForm.email);
    if (emailErr) {
      setError(emailErr);
      toast.error(emailErr);
      return;
    }
    setLoading(true);
    const email = teacherForm.email.trim();
    try {
      await createTeacher({
        firstName: teacherForm.firstName,
        lastName: teacherForm.lastName,
        email,
        department: teacherForm.department,
        password: teacherForm.password
      });
      toast.success("Teacher created");
      setTeacherForm({
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        password: ""
      });
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to create teacher. Check backend.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError("");
    const emailErr = getEmailFormatError(adminForm.email);
    if (emailErr) {
      setAdminError(emailErr);
      toast.error(emailErr);
      return;
    }
    setAdminLoading(true);
    const email = adminForm.email.trim();
    try {
      await createUser({
        firstName: adminForm.firstName,
        lastName: adminForm.lastName,
        email,
        password: adminForm.password,
        role: "admin"
      });
      toast.success("Admin created");
      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        password: ""
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to create admin. Check backend.";
      setAdminError(msg);
      toast.error(msg);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteTeacher = async (t) => {
    const id = t?._id;
    if (!id) return;
    const name =
      t?.name ||
      t?.user?.name ||
      `${t?.user?.firstName ?? ""} ${t?.user?.lastName ?? ""}`.trim() ||
      t?.email ||
      "this teacher";
    const ok = window.confirm(
      `Delete ${name}?\n\nThis removes the teacher profile, login account, and related attendance/marks links where applicable.`
    );
    if (!ok) return;
    setDeletingId(id);
    try {
      await deleteTeacher(id);
      toast.success("Teacher removed");
      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete teacher."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="edu-page-title">
          Manage staff
        </h2>
        <p className="edu-muted mt-1 text-xs">
          Create new teachers and (super admin only) new admins, and view existing teachers.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </p>
      )}
      {adminError && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
          {adminError}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <form
            noValidate
            onSubmit={handleTeacherSubmit}
            className="edu-panel-deep space-y-3 p-4 text-xs"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Add teacher
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="firstName"
                value={teacherForm.firstName}
                onChange={handleTeacherChange}
                placeholder="First name"
                required
                className="edu-input text-xs"
              />
              <input
                name="lastName"
                value={teacherForm.lastName}
                onChange={handleTeacherChange}
                placeholder="Last name"
                required
                className="edu-input text-xs"
              />
              <input
                type="email"
                name="email"
                value={teacherForm.email}
                onChange={handleTeacherChange}
                placeholder="name@school.com"
                autoComplete="email"
                required
                className="edu-input text-xs"
              />
              <input
                name="department"
                value={teacherForm.department}
                onChange={handleTeacherChange}
                placeholder="Department"
                required
                className="edu-input text-xs"
              />
              <input
                type="password"
                name="password"
                value={teacherForm.password}
                onChange={handleTeacherChange}
                placeholder="Temporary password"
                required
                className="edu-input text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create teacher"}
            </button>
          </form>

          {user?.role === "superadmin" && (
            <form
              noValidate
              onSubmit={handleAdminSubmit}
              className="edu-panel-deep space-y-3 p-4 text-xs"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Add admin (super admin only)
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  name="firstName"
                  value={adminForm.firstName}
                  onChange={handleAdminChange}
                  placeholder="First name"
                  required
                  className="edu-input text-xs"
                />
                <input
                  name="lastName"
                  value={adminForm.lastName}
                  onChange={handleAdminChange}
                  placeholder="Last name"
                  required
                  className="edu-input text-xs"
                />
                <input
                  type="email"
                  name="email"
                  value={adminForm.email}
                  onChange={handleAdminChange}
                  placeholder="name@school.com"
                  autoComplete="email"
                  required
                  className="edu-input text-xs"
                />
                <input
                  type="password"
                  name="password"
                  value={adminForm.password}
                  onChange={handleAdminChange}
                  placeholder="Temporary password"
                  required
                  className="edu-input text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={adminLoading}
                className="mt-1 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/40 disabled:opacity-70"
              >
                {adminLoading ? "Creating..." : "Create admin"}
              </button>
            </form>
          )}
        </div>

        <div className="edu-table-wrap">
          <table className="edu-table-text min-w-full">
            <thead className="edu-thead">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr
                  key={t._id}
                  className="edu-tr"
                >
                  <td className="px-4 py-2.5">
                    {t?.name ||
                      t?.user?.name ||
                      `${t?.user?.firstName ?? ""} ${t?.user?.lastName ?? ""}`.trim() ||
                      "—"}
                  </td>
                  <td className="px-4 py-2.5">{t?.email || t?.user?.email || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {t?.department || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteTeacher(t)}
                      disabled={deletingId === t._id}
                      className="rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-50"
                    >
                      {deletingId === t._id ? "Deleting…" : "Delete"}
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

export default AdminTeachers;