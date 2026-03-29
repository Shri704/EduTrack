import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          emerald: "#10b981",
          cyan: "#06b6d4",
          sky: "#38bdf8",
        },
      },
      keyframes: {
        /* Fade-in upward */
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        /* Fade-in downward */
        fadeDown: {
          "0%":   { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        /* Fade-in (scale) */
        fadeScale: {
          "0%":   { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        /* Slow drift float */
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%":      { transform: "translateY(-14px) rotate(1deg)" },
          "66%":      { transform: "translateY(-7px) rotate(-1deg)" },
        },
        /* Horizontal slow drift */
        floatX: {
          "0%, 100%": { transform: "translateX(0px)" },
          "50%":      { transform: "translateX(12px)" },
        },
        /* Pulsing glow ring */
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.4)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(16,185,129,0)" },
        },
        /* Shimmer / shine sweep */
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        /* Orbit rotation */
        orbit: {
          "0%":   { transform: "rotate(0deg) translateX(90px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(90px) rotate(-360deg)" },
        },
        /* Slide-in from right */
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        /* Spin slow */
        spinSlow: {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        /* Counter count-up (visual trick via opacity) */
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        /* Blink dot */
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.2" },
        },
        /* Gradient border rotation */
        gradientSpin: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        /* Particle drift upward */
        particleDrift: {
          "0%":   { transform: "translateY(0) translateX(0) scale(1)", opacity: "0.7" },
          "100%": { transform: "translateY(-80px) translateX(20px) scale(0)", opacity: "0" },
        },
        /* Typewriter cursor blink */
        cursorBlink: {
          "0%, 100%": { borderColor: "transparent" },
          "50%":      { borderColor: "#34d399" },
        },
        /* Wave bar */
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%":      { transform: "scaleY(1)" },
        },
        /* Slide in from left */
        slideLeft: {
          "0%":   { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        /* Subtle bg pan */
        bgPan: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        /* Page / section enter */
        contentIn: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        /* Soft glow pulse for accents */
        glowSoft: {
          "0%, 100%": { opacity: "0.5" },
          "50%":      { opacity: "1" },
        },
        /* Hero card — soft scale + fade */
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.94) translateY(16px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        /* Drawer / sheet slide */
        sheetIn: {
          "0%":   { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up":        "fadeUp 0.7s ease both",
        "fade-up-slow":   "fadeUp 1s ease both",
        "fade-down":      "fadeDown 0.7s ease both",
        "fade-scale":     "fadeScale 0.6s ease both",
        "float":          "float 6s ease-in-out infinite",
        "float-delay":    "float 8s ease-in-out infinite 1s",
        "float-x":        "floatX 5s ease-in-out infinite",
        "pulse-ring":     "pulseRing 2.5s cubic-bezier(0.4,0,0.6,1) infinite",
        "shimmer":        "shimmer 3s linear infinite",
        "orbit":          "orbit 10s linear infinite",
        "orbit-reverse":  "orbit 14s linear infinite reverse",
        "slide-right":    "slideRight 0.7s ease both",
        "slide-left":     "slideLeft 0.7s ease both",
        "spin-slow":      "spinSlow 20s linear infinite",
        "count-up":       "countUp 0.6s ease both",
        "blink":          "blink 1.4s ease-in-out infinite",
        "gradient-spin":  "gradientSpin 4s ease infinite",
        "particle-drift": "particleDrift 3s ease-out infinite",
        "wave":           "wave 1.2s ease-in-out infinite",
        "bg-pan":         "bgPan 8s ease infinite",
        "content-in":     "contentIn 0.55s ease both",
        "glow-soft":      "glowSoft 4s ease-in-out infinite",
        "scale-in":       "scaleIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both",
        "sheet-in":       "sheetIn 0.4s cubic-bezier(0.32, 0.72, 0, 1) both",
      },
      backgroundSize: {
        "200": "200% auto",
        "300": "300% 300%",
      },
    },
  },
  plugins: [],
};
