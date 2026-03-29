import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { verifyOtp as verifyOtpApi } from "../../api/authApi.js";
import { loginSuccess } from "../../store/authSlice.js";
import EduTrackLogo from "../../components/common/EduTrackLogo.jsx";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const initialEmail = location.state?.email || "";
  const stateRoll = location.state?.rollNumber;
  const stateSem = location.state?.semester;
  const stateBranch = location.state?.branch;

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(() =>
    String(location.state?.devOtp ?? "")
  );
  const [profile, setProfile] = useState({
    rollNumber: stateRoll || "",
    semester: stateSem || "",
    branch: stateBranch || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile.rollNumber && profile.semester && profile.branch) return;
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("edutrack_pending_student_profile");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setProfile((p) => ({
        rollNumber: p.rollNumber || parsed.rollNumber || "",
        semester: p.semester || parsed.semester || "",
        branch: p.branch || parsed.branch || ""
      }));
      if (!email && parsed.email) setEmail(parsed.email);
    } catch {
      // ignore
    }
  }, [email, profile.branch, profile.rollNumber, profile.semester]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      toast.dismiss();

      const data = await verifyOtpApi({
        email,
        otp,
        rollNumber: profile.rollNumber,
        semester: profile.semester,
        branch: profile.branch
      }); // { token, user }

      // Auto-login after successful verification
      if (data.token && data.user) {
        dispatch(loginSuccess({ token: data.token, user: data.user }));
      }

      toast.success("Account verified successfully!");

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("edutrack_pending_student_profile");
      }

      const role = data.user?.role;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "OTP verification failed";
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
      <div className="edu-auth-card max-w-md">
        <div className="pointer-events-none absolute -top-24 -right-10 h-56 w-56 animate-pulse rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative">
          <EduTrackLogo variant="auth" />
          <h1 className="mt-6 text-center text-xl font-semibold text-slate-900 dark:text-slate-100">
            Verify your email
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            We&apos;ve sent a 6-digit verification code to your email.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <label className="text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="edu-auth-input"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2 text-sm">
              <label className="text-slate-700 dark:text-slate-300">OTP code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="edu-auth-input text-center tracking-[0.35em]"
                placeholder="123456"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-500">
                Enter the 6-digit code sent to your email. It expires in
                10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;

