/**
 * Production: set `VITE_API_URL` in Vercel to your Render API root, e.g.
 * `https://your-service.onrender.com/api`
 * (Vite inlines env at build time — redeploy after changing variables.)
 */
export function getApiBaseURL() {
  const raw =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined;
  const trimmed = raw != null ? String(raw).trim() : "";
  if (trimmed) {
    return trimmed.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://127.0.0.1:5000/api";
}
