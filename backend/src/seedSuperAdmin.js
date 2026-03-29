import mongoose from "mongoose";
import env from "./config/env.js";
import User from "./modules/users/user.model.js";

const run = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    const email = env.SUPERADMIN_EMAIL || "superadmin@edutrack.com";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Super admin already exists:", email);
      process.exit(0);
    }

    const user = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email,
      password: env.SUPERADMIN_PASSWORD || "ChangeMe123!",
      role: "superadmin",
      isVerified: true
    });

    console.log("Super admin created:", user.email);
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed super admin:", err.message);
    process.exit(1);
  }
};

run();

