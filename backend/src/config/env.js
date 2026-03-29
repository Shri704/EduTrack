import dotenv from "dotenv";

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  /** Legacy alias: used as fallback "from" if BREVO_FROM_EMAIL is unset */
  EMAIL_FROM: process.env.EMAIL_FROM,
  /** Brevo transactional API: https://app.brevo.com → SMTP & API → API keys */
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL,
  BREVO_FROM_NAME: process.env.BREVO_FROM_NAME,
  /** Optional: auto-create first superadmin on startup when DB has none (Render / Atlas). */
  AUTO_SEED_SUPERADMIN: process.env.AUTO_SEED_SUPERADMIN,
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  CAMPUS_LAT: process.env.CAMPUS_LAT
    ? Number(process.env.CAMPUS_LAT)
    : undefined,
  CAMPUS_LNG: process.env.CAMPUS_LNG
    ? Number(process.env.CAMPUS_LNG)
    : undefined,
  CAMPUS_RADIUS_METERS: process.env.CAMPUS_RADIUS_METERS
    ? Number(process.env.CAMPUS_RADIUS_METERS)
    : undefined
};

export default env;