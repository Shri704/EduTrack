import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EduTrackLogo from "../components/common/EduTrackLogo.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import { logout } from "../store/authSlice.js";

function dashboardPathForRole(role) {
  if (role === "admin" || role === "superadmin") return "/admin";
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/auth/login";
}

/* ───── Scroll-triggered reveal (mobile-friendly motion) ───── */
const Reveal = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} motion-safe:transition-[opacity,transform] motion-safe:duration-[680ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: active ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

/* ───── Animated Counter Component ───── */
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = 0;
          const startTime = performance.now();
          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
};

/* ───── Floating Particle ───── */
const Particle = ({ style }) => (
  <div
    className="absolute h-1 w-1 rounded-full bg-emerald-500/35 dark:bg-emerald-400/40"
    style={{
      ...style,
      animation: `particleDrift ${3 + Math.random() * 4}s ease-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    }}
  />
);

/* ───── Wave Bars Visualizer ───── */
const WaveBars = () => (
  <div className="flex items-end gap-[3px] h-8">
    {[0, 0.15, 0.3, 0.45, 0.6, 0.3, 0.15].map((d, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 origin-bottom"
        style={{
          height: `${14 + Math.random() * 18}px`,
          animation: `wave 1.2s ease-in-out infinite`,
          animationDelay: `${d}s`,
        }}
      />
    ))}
  </div>
);

/* ───── Feature icons ───── */
const FiIcon = ({ children }) => (
  <span className="text-emerald-600 dark:text-emerald-400 [&>svg]:h-6 [&>svg]:w-6">{children}</span>
);

/* ───── Feature Card ───── */
const FeatureCard = ({ icon, title, desc }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-md shadow-slate-900/[0.04] backdrop-blur-xl motion-safe:transition-all motion-safe:duration-500 motion-safe:hover:-translate-y-1 sm:p-6 hover:border-teal-300/70 hover:bg-white hover:shadow-xl hover:shadow-teal-500/[0.08] dark:border-slate-800/80 dark:bg-slate-950/60 dark:shadow-none dark:hover:border-emerald-500/35 dark:hover:bg-slate-900/70 dark:hover:shadow-[0_20px_50px_-24px_rgba(16,185,129,0.15)] active:scale-[0.99]">
    <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-teal-500/10 group-hover:via-transparent group-hover:to-cyan-500/10 dark:group-hover:from-emerald-500/10 dark:group-hover:to-cyan-500/5" />
    <div className="relative z-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 ring-1 ring-teal-200/50 transition-transform duration-500 group-hover:scale-105 group-hover:shadow-md dark:from-emerald-500/15 dark:to-cyan-500/10 dark:ring-emerald-500/20 dark:group-hover:shadow-[0_0_24px_-6px_rgba(16,185,129,0.35)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-200">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
        {desc}
      </p>
    </div>
  </div>
);

/* ───── Orbiting Dot ───── */
const OrbitDot = ({ size, color, animClass, ring }) => (
  <div className={`absolute inset-0 ${animClass}`}>
    <div
      className={`absolute rounded-full ${color} shadow-lg`}
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        marginTop: `-${parseInt(size) / 2}px`,
        marginLeft: `${ring}px`,
      }}
    />
  </div>
);

/* ═══════════════════ HOME COMPONENT ═══════════════════ */
const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardTo = user ? dashboardPathForRole(user.role) : null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const particles = Array.from({ length: 14 }, (_, i) => ({
    left: `${3 + Math.random() * 94}%`,
    top: `${5 + Math.random() * 90}%`,
  }));

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-teal-50/40 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-900 selection:bg-teal-400/25 selection:text-slate-900 dark:from-[#020617] dark:via-[#030712] dark:to-[#020617] dark:text-slate-100 dark:selection:bg-emerald-500/25 dark:selection:text-white">
      {/* ─── Animated gradient background ─── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_10%_10%,rgba(13,148,136,0.18),transparent_50%),radial-gradient(1000px_circle_at_85%_15%,rgba(6,182,212,0.14),transparent_45%),radial-gradient(600px_circle_at_50%_80%,rgba(20,184,166,0.1),transparent_50%)] dark:bg-[radial-gradient(1200px_circle_at_10%_10%,rgba(16,185,129,0.12),transparent_50%),radial-gradient(1000px_circle_at_85%_15%,rgba(56,189,248,0.10),transparent_45%),radial-gradient(600px_circle_at_50%_80%,rgba(139,92,246,0.08),transparent_50%)]" />

      {/* ─── Noise overlay ─── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply dark:opacity-[0.04] dark:mix-blend-overlay">
        <div className="h-full w-full bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')] bg-repeat" />
      </div>

      {/* ─── Floating orbs ─── */}
      <div className="pointer-events-none absolute -top-32 right-[-6rem] h-[38rem] w-[38rem] animate-float rounded-full bg-emerald-400/25 blur-[100px] dark:bg-emerald-500/[0.07]" />
      <div className="pointer-events-none absolute -bottom-40 left-[-8rem] h-[42rem] w-[42rem] animate-float-delay rounded-full bg-cyan-400/20 blur-[120px] dark:bg-cyan-500/[0.07]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] animate-float rounded-full bg-violet-400/15 blur-[100px] dark:bg-violet-500/[0.04]" />

      {/* ─── Floating Particles (sm+ only — calmer on phone) ─── */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
        {particles.map((p, i) => (
          <Particle key={i} style={p} />
        ))}
      </div>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-30 border-b border-teal-100/60 bg-white/85 pt-[env(safe-area-inset-top,0px)] shadow-sm shadow-teal-900/[0.03] backdrop-blur-xl motion-safe:animate-fade-down dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-none">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-8 sm:py-4 md:gap-4 md:px-10">
          <div className="min-w-0 shrink pr-2">
            <EduTrackLogo variant="hero" compactHero />
          </div>

          <nav
            className="hidden min-w-0 flex-1 justify-center gap-1 md:flex md:gap-2"
            aria-label="Page sections"
          >
            <a
              href="#features"
              className="rounded-full px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
            >
              Features
            </a>
            <a
              href="#cta"
              className="rounded-full px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
            >
              Get started
            </a>
          </nav>

          <nav className="hidden shrink-0 items-center gap-2 md:flex sm:gap-3" aria-label="Account">
          <ThemeToggle />
          {user && dashboardTo ? (
            <>
              <span className="max-w-[160px] truncate rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                {user.name ?? user.email}
                <span className="ml-1 uppercase text-teal-700 dark:text-emerald-400">
                  · {user.role}
                </span>
              </span>
              <Link
                to={dashboardTo}
                className="relative overflow-hidden rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 px-4 py-2 text-xs font-bold text-white shadow-[0_10px_30px_-12px_rgba(13,148,136,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(13,148,136,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 focus-visible:ring-offset-2 dark:from-emerald-400 dark:via-cyan-400 dark:to-sky-400 dark:text-slate-950"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="relative overflow-hidden rounded-full border border-teal-200/90 bg-white/90 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-teal-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-50 group dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-200 dark:shadow-none dark:hover:border-slate-500/60 dark:hover:bg-slate-900/60 dark:hover:text-white dark:focus-visible:ring-emerald-400/50 dark:focus-visible:ring-offset-slate-950"
              >
                <span className="relative z-10">Sign in</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-teal-200/50 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-white/5" />
              </Link>
              <Link
                to="/auth/register"
                className="relative overflow-hidden rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 px-4 py-2 text-xs font-bold text-white shadow-[0_10px_30px_-12px_rgba(13,148,136,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(13,148,136,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-50 group dark:from-emerald-400 dark:via-cyan-400 dark:to-sky-400 dark:text-slate-950 dark:shadow-[0_10px_30px_-12px_rgba(16,185,129,0.7)] dark:focus-visible:ring-offset-slate-950 dark:hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.9)]"
              >
                <span className="relative z-10">Get started</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200/90 bg-white/90 text-teal-900 shadow-sm transition hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:bg-slate-900"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[70] flex w-[min(300px,90vw)] flex-col border-l border-teal-100/90 bg-white/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-4 shadow-2xl shadow-teal-900/15 motion-safe:animate-sheet-in motion-reduce:animate-none dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-bold text-teal-900 dark:text-slate-100">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-600 hover:bg-teal-50 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-2.5">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[48px] rounded-xl border border-slate-200/80 py-3 text-center text-sm font-medium text-slate-800 transition active:scale-[0.98] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/50"
              >
                Features
              </a>
              <a
                href="#cta"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[48px] rounded-xl border border-slate-200/80 py-3 text-center text-sm font-medium text-slate-800 transition active:scale-[0.98] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/50"
              >
                Get started
              </a>
              <div className="my-1 border-t border-slate-200/80 dark:border-slate-700" />
              {user && dashboardTo ? (
                <>
                  <Link
                    to={dashboardTo}
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-teal-500/25 active:scale-[0.98] dark:from-emerald-500 dark:to-cyan-500"
                  >
                    Go to dashboard
                  </Link>
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    {user.name ?? user.email} · {user.role}
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-rose-200 bg-rose-50 py-3 text-center text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] rounded-xl border border-teal-200/80 bg-teal-50/50 py-3 text-center text-sm font-medium text-teal-950 transition active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-teal-500/25 active:scale-[0.98] dark:from-emerald-500 dark:to-cyan-500"
                  >
                    Get started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}

      {/* ═══ HERO SECTION ═══ */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-10 sm:px-8 md:px-10">
        <section className="flex flex-col items-center gap-8 pt-6 text-center sm:gap-12 sm:pt-12 md:flex-row md:items-center md:gap-16 md:pt-20 md:text-left">
          {/* Left content */}
          <div className="w-full max-w-xl md:max-w-none md:w-1/2">
            {/* Status badge */}
            <Reveal delay={0}>
            <div className="inline-flex max-w-full items-center justify-center gap-2.5 rounded-full border border-slate-200/90 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-xl sm:inline-flex sm:justify-start sm:px-4 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-none">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75 dark:bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] dark:bg-emerald-400 dark:shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </span>
              <span className="text-[10px] font-medium text-slate-600 sm:text-[11px] dark:text-slate-300">
                Live attendance · Smart alerts · Deep analytics
              </span>
            </div>
            </Reveal>

            {/* Headline */}
            <Reveal delay={70}>
            <h1 className="mt-5 text-[1.625rem] font-extrabold leading-[1.14] tracking-tight sm:mt-6 sm:text-4xl sm:leading-tight md:text-5xl lg:text-6xl">
              <span className="block text-slate-900 dark:text-slate-50">One dashboard for</span>
              <span className="block mt-1">
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-cyan-300 dark:to-sky-300">
                    every student&apos;s
                  </span>
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 opacity-70 blur-[1px] dark:from-emerald-400 dark:via-cyan-400 dark:to-sky-400 dark:opacity-60" />
                </span>{" "}
                <span className="text-slate-900 dark:text-slate-50">journey.</span>
              </span>
            </h1>
            </Reveal>

            {/* Subtitle */}
            <Reveal delay={140}>
            <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-slate-600 sm:mt-5 sm:text-base md:mx-0 md:text-lg dark:text-slate-400">
              EduTrack brings together attendance, marks, and performance
              analytics into a single, real-time platform for{" "}
              <span className="font-medium text-emerald-700 dark:text-emerald-300/90">admins</span>,{" "}
              <span className="font-medium text-cyan-700 dark:text-cyan-300/90">teachers</span>,
              and{" "}
              <span className="font-medium text-sky-700 dark:text-sky-300/90">students</span>.
            </p>
            </Reveal>

            {/* CTA buttons */}
            <Reveal delay={210}>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:justify-start">
              {user && dashboardTo ? (
                <Link
                  to={dashboardTo}
                  className="group relative inline-flex w-full min-h-[3rem] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[0_14px_36px_-16px_rgba(16,185,129,0.8)] transition-all duration-300 active:scale-[0.98] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_50px_-16px_rgba(16,185,129,1)] sm:w-auto"
                >
                  <span className="relative z-10">Go to your dashboard</span>
                  <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/register"
                    className="group relative inline-flex w-full min-h-[3rem] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[0_14px_36px_-16px_rgba(16,185,129,0.8)] transition-all duration-300 active:scale-[0.98] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_50px_-16px_rgba(16,185,129,1)] sm:w-auto"
                  >
                    <span className="relative z-10">Start for free</span>
                    <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>
                  <Link
                    to="/auth/login"
                    className="group relative flex w-full min-h-[3rem] items-center justify-center overflow-hidden rounded-2xl border border-slate-300/90 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition-all duration-300 active:scale-[0.98] hover:border-slate-400 hover:bg-white dark:border-slate-700/60 dark:bg-slate-950/30 dark:text-slate-100/90 dark:shadow-none dark:hover:border-slate-500/60 dark:hover:bg-slate-900/50 dark:hover:text-white sm:w-auto"
                  >
                    <span className="relative z-10">Sign in →</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-200/50 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-white/5" />
                  </Link>
                </>
              )}
            </div>
            </Reveal>

            {/* Stat counters */}
            <Reveal delay={280}>
            <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-3 gap-2 sm:mt-10 sm:gap-4 md:mx-0">
              {[
                { value: 5000, suffix: "+", label: "Students", color: "from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-500" },
                { value: 98, suffix: "%", label: "Uptime", color: "from-cyan-600 to-cyan-500 dark:from-cyan-400 dark:to-cyan-500" },
                { value: 150, suffix: "+", label: "Institutes", color: "from-sky-600 to-sky-500 dark:from-sky-400 dark:to-sky-500" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-slate-200/90 bg-white/70 p-2.5 shadow-sm backdrop-blur-xl transition-all duration-500 sm:rounded-2xl sm:p-4 hover:border-emerald-300/60 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:shadow-none dark:hover:border-emerald-500/20 dark:hover:bg-slate-900/40"
                >
                  <p className={`text-xl font-extrabold tabular-nums bg-gradient-to-r ${stat.color} bg-clip-text text-transparent sm:text-3xl`}>
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-[9px] font-medium uppercase leading-tight tracking-wide text-slate-500 transition-colors group-hover:text-slate-600 sm:text-[11px] sm:tracking-[0.2em] dark:group-hover:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            </Reveal>
          </div>

          {/* Right – Dashboard preview card */}
          <div className="w-full min-w-0 md:w-1/2">
            <div className="relative mx-auto w-full max-w-[min(100%,24rem)] motion-safe:animate-scale-in motion-reduce:animate-none sm:max-w-md">
              {/* Orbiting elements (tablet+) — less noise on phone */}
              <div className="absolute inset-0 hidden items-center justify-center pointer-events-none md:flex">
                <div className="relative h-64 w-64">
                  {/* orbit ring */}
                  <div className="absolute inset-4 rounded-full border border-dashed border-slate-300/60 animate-spin-slow dark:border-slate-800/40" />
                  <OrbitDot size="8px" color="bg-emerald-400" animClass="animate-orbit" ring={80} />
                  <OrbitDot size="6px" color="bg-cyan-400" animClass="animate-orbit-reverse" ring={100} />
                </div>
              </div>

              {/* Main card */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_24px_50px_-20px_rgba(56,189,248,0.18)] backdrop-blur-2xl sm:rounded-3xl sm:p-5 sm:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_28px_60px_-24px_rgba(56,189,248,0.2)] dark:border-slate-800/60 dark:bg-slate-950/60 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_80px_-40px_rgba(56,189,248,0.25)]">
                <div className="pointer-events-none absolute -top-16 right-[-2rem] h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl animate-float dark:bg-emerald-500/10" />
                <div className="pointer-events-none absolute -bottom-16 left-[-2rem] h-36 w-36 rounded-full bg-cyan-400/15 blur-3xl animate-float-delay dark:bg-cyan-500/10" />

                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                    <WaveBars />
                    <span className="truncate text-[10px] text-slate-600 sm:text-xs dark:text-slate-400">Today&apos;s snapshot</span>
                  </div>
                  <span className="animate-pulse inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-wider dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-blink" />
                    Live
                  </span>
                </div>

                {/* Stat tiles */}
                <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
                  {[
                    { label: "Attendance", value: 92, suffix: "%", gradient: "from-emerald-500/12 to-white dark:from-emerald-500/20 dark:to-emerald-500/5" },
                    { label: "Avg Score", value: 78, suffix: "%", gradient: "from-cyan-500/12 to-white dark:from-cyan-500/20 dark:to-cyan-500/5" },
                    { label: "Alerts", value: 12, suffix: "", gradient: "from-amber-500/12 to-white dark:from-amber-500/20 dark:to-amber-500/5" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`group rounded-xl border border-slate-200/80 bg-gradient-to-b p-2.5 transition-all duration-500 sm:rounded-2xl sm:p-4 hover:scale-[1.03] hover:border-slate-300 dark:border-slate-800/60 dark:hover:border-slate-700/60 ${s.gradient}`}
                    >
                      <p className="text-[8px] font-medium uppercase leading-tight tracking-wide text-slate-600 sm:text-[10px] sm:tracking-[0.22em] dark:text-slate-500">
                        {s.label}
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 sm:mt-2 sm:text-3xl dark:text-slate-50">
                        <AnimatedCounter end={s.value} suffix={s.suffix} duration={1500} />
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mini bar chart */}
                <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-800/50 dark:bg-slate-950/70 sm:mt-4 sm:rounded-2xl sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
                    <span className="text-[10px] font-semibold text-slate-800 sm:text-[11px] dark:text-slate-200">Weekly Attendance</span>
                    <span className="shrink-0 text-[9px] font-medium text-emerald-600 sm:text-[10px] dark:text-emerald-400">↑ 3.2%</span>
                  </div>
                  <div className="flex h-14 items-end gap-1 sm:h-16 sm:gap-2">
                    {[65, 78, 82, 70, 92, 88, 95].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-emerald-500/70 to-cyan-500/70 transition-all duration-700 hover:from-emerald-500 hover:to-cyan-400 dark:from-emerald-500/60 dark:to-cyan-400/60 dark:hover:from-emerald-400 dark:hover:to-cyan-300"
                          style={{
                            height: `${h * 0.6}%`,
                            animation: `fadeUp 0.5s ease both`,
                            animationDelay: `${0.8 + i * 0.1}s`,
                          }}
                        />
                        <span className="text-[8px] text-slate-500 dark:text-slate-600">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role cards */}
                <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-800/50 dark:bg-slate-950/70 sm:mt-4 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] font-semibold text-slate-800 sm:text-[11px] dark:text-slate-100">
                    🎯 Role-based dashboards
                  </p>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600 sm:text-[11px] dark:text-slate-500">
                    Admins see the whole institute, teachers manage classes, students
                    track their personal journey.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { role: "Admin", color: "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/20" },
                      { role: "Teacher", color: "border-cyan-500/30 bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/20" },
                      { role: "Student", color: "border-sky-500/30 bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/20" },
                    ].map((r, i) => (
                      <span
                        key={i}
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${r.color} transition-transform duration-300 hover:scale-105`}
                      >
                        {r.role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES SECTION ═══ */}
        <section id="features" className="mt-14 mb-16 scroll-mt-28 sm:mt-20 sm:mb-20 md:mt-28">
          <Reveal delay={0}>
            <div className="text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/70 px-4 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-400 dark:shadow-none">
                Why EduTrack
              </p>
              <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900 sm:mt-5 sm:text-3xl md:text-4xl dark:text-slate-50">
                Everything you need,{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-cyan-300 dark:to-sky-300">
                  nothing you don&apos;t
                </span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl px-1 text-sm text-slate-600 sm:text-base dark:text-slate-500">
                A modern analytics platform designed for educational institutions of every size.
              </p>
            </div>
          </Reveal>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 sm:mt-12 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0}>
              <FeatureCard
                icon={
                  <FiIcon>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12v4m6-8v8m6-4v0M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
                    </svg>
                  </FiIcon>
                }
                title="Real-time Analytics"
                desc="Interactive charts and reports update as data flows in. Know exactly where every student stands."
              />
            </Reveal>
            <Reveal delay={60}>
              <FeatureCard
                icon={
                  <FiIcon>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9h.01M12 17h.01" />
                    </svg>
                  </FiIcon>
                }
                title="One-click Attendance"
                desc="Mark attendance for entire classes in seconds. Automatic low-attendance alerts keep everyone informed."
              />
            </Reveal>
            <Reveal delay={120}>
              <FeatureCard
                icon={
                  <FiIcon>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </FiIcon>
                }
                title="Role-based Access"
                desc="Secure, granular permissions for admins, teachers, and students. Everyone sees only what they need."
              />
            </Reveal>
            <Reveal delay={40}>
              <FeatureCard
                icon={
                  <FiIcon>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M10.5 8.25h3l-1.5-3-1.5 3Z" />
                    </svg>
                  </FiIcon>
                }
                title="Smart Notifications"
                desc="Automated email alerts for low attendance, poor performance, and important announcements."
              />
            </Reveal>
            <Reveal delay={100}>
              <FeatureCard
                icon={
                  <FiIcon>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625a1.125 1.125 0 0 0-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </FiIcon>
                }
                title="CSV Upload"
                desc="Bulk upload student data and marks via CSV. Save hours of manual data entry with smart parsing."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={
                  <FiIcon>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V3.375Z" />
                    </svg>
                  </FiIcon>
                }
                title="Performance Trends"
                desc="Track student progress over semesters with visual trend analysis and predictive insights."
              />
            </Reveal>
          </div>
        </section>

        {/* ═══ CTA BANNER ═══ */}
        <Reveal delay={80}>
        <section id="cta" className="relative mb-14 scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 text-center shadow-sm backdrop-blur-2xl sm:mb-20 sm:rounded-3xl sm:p-14 dark:border-slate-800/50 dark:from-slate-950/80 dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-none">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[80px] animate-float dark:bg-emerald-500/10" />
          <h2 className="relative text-[1.35rem] font-bold leading-snug text-slate-900 sm:text-2xl md:text-3xl dark:text-slate-50">
            Ready to transform your institution?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Join hundreds of schools and colleges already using EduTrack to make data-driven decisions.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="group relative inline-flex min-h-[3rem] w-full max-w-sm items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_14px_36px_-16px_rgba(16,185,129,0.8)] transition-all duration-300 active:scale-[0.98] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_50px_-16px_rgba(16,185,129,1)] sm:w-auto sm:max-w-none"
            >
              <span className="relative z-10">Get started — it&apos;s free</span>
              <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </div>
        </section>
        </Reveal>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 mt-6 border-t border-slate-200/90 bg-gradient-to-b from-white/90 via-slate-50/80 to-slate-100/60 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl dark:from-slate-950/90 dark:via-slate-950/85 dark:to-[#020617] dark:border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-10 sm:py-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <EduTrackLogo variant="hero" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Attendance, marks, and analytics in one calm dashboard — built for schools that care about every student.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800 dark:text-emerald-400/90">Product</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#features" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Features</a>
                </li>
                <li>
                  <Link to="/auth/register" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Create account</Link>
                </li>
                <li>
                  <Link to="/auth/login" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Sign in</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800 dark:text-emerald-400/90">Support</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#cta" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Get started</a>
                </li>
                <li>
                  <a href="mailto:hello@edutrack.app" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Contact us</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800 dark:text-emerald-400/90">Legal</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#privacy-policy" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Privacy</a>
                </li>
                <li>
                  <a href="#terms-of-service" className="transition-colors hover:text-teal-800 dark:hover:text-emerald-300">Terms</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-8 border-t border-slate-200/80 pt-10 dark:border-slate-800/80 md:grid-cols-2">
            <section id="privacy-policy" tabIndex={-1} className="scroll-mt-28">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Privacy</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                EduTrack collects only the data your institution needs to run attendance and academics. Review your
                organization&apos;s policy for retention and sharing. For product questions, email{" "}
                <a href="mailto:hello@edutrack.app" className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-emerald-400">hello@edutrack.app</a>.
              </p>
            </section>
            <section id="terms-of-service" tabIndex={-1} className="scroll-mt-28">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Terms</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                By using EduTrack you agree to follow your institute&apos;s acceptable-use rules. The platform is provided as-is;
                availability and features may change. Administrators are responsible for user access and uploaded data.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-8 text-[11px] text-slate-500 sm:flex-row dark:border-slate-800/60 dark:text-slate-600">
            <p>© {new Date().getFullYear()} EduTrack. Built for educators, by technologists.</p>
            <p className="text-center sm:text-right">Teal · cyan · calm analytics</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
