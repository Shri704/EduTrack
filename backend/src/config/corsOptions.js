/**
 * CORS for Vercel + local dev + optional FRONTEND_URL (comma-separated).
 * Error responses must set these headers too — see errorMiddleware.
 */
export function isOriginAllowed(origin) {
  if (!origin || typeof origin !== "string") return false;
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".vercel.app")) return true;
    const extras = String(process.env.FRONTEND_URL || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (extras.includes(origin)) return true;
    return false;
  } catch {
    return false;
  }
}

/** Used by cors package: reflect allowed origin or callback(null, false). */
export function corsOriginCallback(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }
  if (process.env.NODE_ENV !== "production") {
    return callback(null, true);
  }
  return callback(null, false);
}

export const corsOptions = {
  origin: corsOriginCallback,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204
};

/** Call on error responses so browsers do not hide 401/403 behind a CORS error. */
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  const allow =
    isOriginAllowed(origin) || process.env.NODE_ENV !== "production";
  if (!allow) return;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
}
