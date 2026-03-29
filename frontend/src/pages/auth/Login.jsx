import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { login as loginApi } from "../../api/authApi.js";
import { loginSuccess } from "../../store/authSlice.js";
import EduTrackLogo from "../../components/common/EduTrackLogo.jsx";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // If user is logged in, clear any stale error message
    if (token && user) {
      setError("");
    }
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // clear any existing toasts before new attempt
      toast.dismiss();

      const data = await loginApi(email, password); // { token, user }

      dispatch(loginSuccess({ token: data.token, user: data.user }));

      toast.success("Welcome back to EduTrack!");

      const role = data.user.role;
      const from = location.state?.from?.pathname;

      if (from) {
        navigate(from, { replace: true });
      } else if (role === "superadmin" || role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.dismiss();
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
            Sign in
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Enter your email and password. We&apos;ll take you to your dashboard
            when you&apos;re signed in.
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
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300">Password</label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Forgot password
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="edu-auth-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-center text-xs text-slate-600 dark:text-slate-500">
              Don&apos;t have an account?{" "}
              <Link to="/auth/register" className="text-emerald-600 hover:underline dark:text-emerald-400">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;