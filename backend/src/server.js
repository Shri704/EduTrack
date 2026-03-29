import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import { startJobs } from "./jobs/scheduler.js";

dotenv.config();

const PORT = env.PORT || 5000;

let server;

const start = async () => {
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
