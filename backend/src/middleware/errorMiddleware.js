import logger from "../utils/logger.js";
import { applyCorsHeaders } from "../config/corsOptions.js";

export const errorHandler = (err, req, res, next) => {
  applyCorsHeaders(req, res);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    message = "Resource not found";
    statusCode = 404;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
    statusCode = 400;
  }

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    statusCode = 400;
  }

  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // Map common domain errors to appropriate status codes
  if (statusCode === 500) {
    const lower = message.toLowerCase();

    if (lower.includes("invalid email or password")) {
      statusCode = 401;
    } else if (lower.includes("already registered")) {
      statusCode = 400;
    } else if (lower.includes("not found")) {
      statusCode = 404;
    } else if (lower.includes("not authorized") || lower.includes("deactivated")) {
      statusCode = 401;
    }
  }

  logger.error(
    `${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};