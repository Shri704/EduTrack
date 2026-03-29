import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../api/authApi.js";
import EduTrackLogo from "../../components/common/EduTrackLogo.jsx";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      toast.dismiss();
      await forgotPassword(email.trim());
      toast.success("Reset code sent to your email");
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send reset code";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      toast.dismiss();
      await resetPassword({ email: email.trim(), otp, newPassword });
      toast.success("Password reset successfully. You can sign in now.");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password";
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
            {step === 1 ? "Reset your password" : "Set a new password"}
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            {step === 1
              ? "For students, teachers, and admins: enter the email on your EduTrack account. We’ll send a verification code."
              : "Enter the code from your email and choose a new password."}
          </p>

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
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
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-70"
              >
                {loading ? "Sending..." : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                  {error}
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Code sent to <span className="font-medium text-slate-900 dark:text-slate-200">{email}</span>
              </p>
              <div className="space-y-2 text-sm">
                <label className="text-slate-700 dark:text-slate-300">6-digit code</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="edu-auth-input text-center text-lg tracking-[0.4em]"
                  placeholder="123456"
                />
              </div>
              <div className="space-y-2 text-sm">
                <label className="text-slate-700 dark:text-slate-300">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="edu-auth-input"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2 text-sm">
                <label className="text-slate-700 dark:text-slate-300">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="edu-auth-input"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-70"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-500">
            <Link to="/auth/login" className="text-emerald-600 hover:underline dark:text-emerald-400">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
