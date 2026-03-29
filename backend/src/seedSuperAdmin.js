import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "./modules/users/user.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env") });

const run = async () => {
  try {
    const uri = String(process.env.MONGO_URI || "").trim();
    if (!uri) {
      console.error("MONGO_URI is not set.");
      process.exit(1);
    }

    await mongoose.connect(uri);

    const email = String(
      process.env.SUPERADMIN_EMAIL || "superadmin@edutrack.com"
    )
      .trim()
      .toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Super admin already exists:", email);
      process.exit(0);
    }

    const password =
      process.env.SUPERADMIN_PASSWORD || "ChangeMe123!";

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      email,
      password,
      role: "superadmin",
      isVerified: true,
      isActive: true
    });

    console.log("Super admin created:", email);
    console.log("Sign in with this email and the password from SUPERADMIN_PASSWORD (or default ChangeMe123!).");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed super admin:", err.message);
    process.exit(1);
  }
};

run();
