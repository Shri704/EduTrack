import express from "express";
import cors from "cors";
import routes from "./routes.js";

import { requestLogger } from "./middleware/loggerMiddleware.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Prevent 304 responses for API JSON (avoids empty bodies in axios)
app.disable("etag");

// ----------------------------
// Global Middleware
// ----------------------------

// Allow browser requests from Vercel (or any origin) when API is on Render — required for cross-origin API calls.
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Disable caching for API responses
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});


// ----------------------------
// Request Logger
// ----------------------------

app.use(requestLogger);


// ----------------------------
// Health Check Route
// ----------------------------

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "EduTrack API is running 🚀"
  });
});


// ----------------------------
// API Routes
// ----------------------------

app.use("/api", routes);


// ----------------------------
// 404 Route Handler
// ----------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});


// ----------------------------
// Global Error Handler
// ----------------------------

app.use(errorHandler);


export default app;