import mongoose from "mongoose";
import logger from "../utils/logger.js";

/** Trim and strip accidental quotes from .env (e.g. MONGO_URI="mongodb+srv://..."). */
function normalizeMongoUri(raw) {
  let s = String(raw ?? "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const connectDB = async () => {
  const uri = normalizeMongoUri(process.env.MONGO_URI);
  if (!uri) {
    logger.error(
      "MONGO_URI is not set. Add your MongoDB Atlas connection string to backend/.env (Database → Connect → Drivers)."
    );
    process.exit(1);
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    logger.error(
      'MONGO_URI must start with "mongodb://" or "mongodb+srv://" (Atlas uses mongodb+srv://). ' +
        "Copy the full string from Atlas → Connect → Drivers. No spaces before mongodb."
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    const host = conn.connection.host;
    logger.info(`MongoDB connected: ${host}`);
    if (String(host).includes("mongodb.net")) {
      logger.info("MongoDB Atlas is connected.");
    }
  } catch (error) {
    const msg = String(error?.message || error);
    logger.error(`Database connection error: ${msg}`);
    if (/whitelist|ip address|could not connect to any servers/i.test(msg)) {
      logger.error(
        "Atlas Network Access: open https://cloud.mongodb.com → your Project → Network Access → Add IP Address → " +
          '"Add Current IP Address" (or 0.0.0.0/0 for dev only), then retry.'
      );
    }
    process.exit(1);
  }
};

export default connectDB;