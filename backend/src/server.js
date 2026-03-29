import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import { startJobs } from "./jobs/scheduler.js";

// Load environment variables
dotenv.config();

// ----------------------------
// Connect to MongoDB
// ----------------------------
connectDB();


// ----------------------------
// Start Background Jobs
// ----------------------------
startJobs();


// ----------------------------
// Server Port
// ----------------------------
const PORT = env.PORT || 5000;


// ----------------------------
// Start Express Server
// ----------------------------
const server = app.listen(PORT, () => {
  console.log(`🚀 EduTrack API running on port ${PORT}`);
});


// ----------------------------
// Handle Unhandled Rejections
// ----------------------------
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});


// ----------------------------
// Handle Uncaught Exceptions
// ----------------------------
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});