import AppRoutes from "./routes/AppRoutes.jsx";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext.jsx";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-dvh overflow-x-hidden bg-gradient-to-br from-slate-100 via-teal-50/30 to-cyan-50/35 text-slate-950 motion-safe:transition-colors motion-safe:duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "!rounded-2xl !border !border-teal-100/90 !bg-white/95 !text-slate-900 !text-sm !shadow-lg !shadow-teal-500/10 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-50 dark:!shadow-emerald-500/15 sm:!max-w-sm",
            duration: 4000,
            style: {
              maxWidth: "min(100vw - 1.5rem, 22rem)",
            },
            success: {
              iconTheme: {
                primary: "#0d9488",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#fb7185",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
