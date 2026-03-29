import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import { startJobs } from "./jobs/scheduler.js";

dotenv.config();

const PORT = env.PORT || 5000;

function assertJwtSecretConfigured() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  if (secret.length >= 8) return;
  console.error(
    "JWT_SECRET is missing or too short. Set it in Render → Environment (or backend/.env): a long random string (e.g. run: openssl rand -base64 48). Login will fail with 500 until this is set."
  );
  process.exit(1);
}

let server;

const start = async () => {
  assertJwtSecretConfigured();
  await connectDB();
  startJobs();

  server = app.listen(PORT, () => {
    console.log(`🚀 EduTrack API running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err?.message || err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err?.message || err);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err?.message || err);
  process.exit(1);
});
