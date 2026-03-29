import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { register as registerApi } from "../../api/authApi.js";
import { fetchBranches } from "../../api/branchApi.js";
import EduTrackLogo from "../../components/common/EduTrackLogo.jsx";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rollNumber: "",
    fullName: "",
    email: "",
    sem: "",
    branch: "",
    password: ""
  });
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    setBranchesLoading(true);
    const load = async () => {
      try {
        setBranchesError("");
        const list = await fetchBranches();
        if (!cancelled) setBranches(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("[EduTrack] Failed to load branches:", err?.message || err);
        if (!cancelled) {
          setBranches([]);
          setBranchesError(
            "Could not load branches. Check that VITE_API_URL on Vercel points to your Render API (…/api) and redeploy."
          );
        }
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "edutrack_pending_student_profile",
          JSON.stringify({
            rollNumber: form.rollNumber,
            semester: form.sem,
            branch: form.branch,
            email: form.email
          })
        );
      }

      const data = await registerApi({ ...form });

      const fallbackOtp = data?.verificationOtp ?? data?.devOtp;
      if (fallbackOtp) {
        setSuccess(
          `Email was not sent. Your verification code is ${fallbackOtp}.`
        );
        toast.success(`Verification code: ${fallbackOtp}`, { duration: 12000 });
      } else {
        setSuccess(
          "Account created. We have sent an OTP to your email to verify your account."
        );
        toast.success("Account created. Please verify with OTP.");
      }

      const delay = fallbackOtp ? 1200 : 800;
      setTimeout(
        () =>
          navigate("/auth/verify-otp", {
            replace: true,
            state: {
              email: data?.email || form.email,
              rollNumber: form.rollNumber,
              semester: form.sem,
              branch: form.branch,
              devOtp: fallbackOtp
            }
          }),
        delay
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edu-auth-bg">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="edu-auth-card max-w-lg">
        <div className="pointer-events-none absolute -top-24 -right-10 h-56 w-56 animate-pulse rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative">
          <EduTrackLogo variant="auth" />
          <h1 className="mt-6 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-center text-2xl font-semibold text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Fill in your details below. We&apos;ll send a verification code to
            your email to finish setting up your account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {error && (
              <div className="col-span-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="col-span-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
                {success}
              </div>
            )}

            <div className="space-y-1 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Roll number</label>
              <input
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                required
                placeholder="e.g. 21CS001"
                className="edu-auth-input"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Full name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="Your full name"
                className="edu-auth-input"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="edu-auth-input"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Semester</label>
              <input
                name="sem"
                value={form.sem}
                onChange={handleChange}
                required
                placeholder="e.g. 1, 2, 3..."
                min={1}
                max={10}
                type="number"
                className="edu-auth-input"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Branch</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                required
                className="edu-auth-input"
              >
                <option value="">
                  {branchesLoading ? "Loading branches..." : "Select branch"}
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} {b.code ? `(${b.code})` : ""}
                  </option>
                ))}
              </select>
              {branchesError ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">{branchesError}</p>
              ) : null}
              {!branchesLoading &&
              !branchesError &&
              branches.length === 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  No branches in the database yet. Sign in as an admin → Branches to add them, or run{" "}
                  <code className="rounded bg-slate-200 px-1 py-0.5 text-[0.7rem] dark:bg-slate-700">
                    npm run seed:branches
                  </code>{" "}
                  on the server (same DB as production).
                </p>
              ) : null}
            </div>

            <div className="space-y-1 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="edu-auth-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="col-span-full mt-2 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;