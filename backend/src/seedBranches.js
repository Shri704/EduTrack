import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Course from "./modules/courses/course.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env") });

const DEFAULT_BRANCHES = [
  {
    name: "Computer Science and Engineering",
    code: "CSE",
    description: "CSE",
    totalSemesters: 8
  },
  {
    name: "Electronics and Communication",
    code: "ECE",
    description: "ECE",
    totalSemesters: 8
  },
  {
    name: "Mechanical Engineering",
    code: "ME",
    description: "ME",
    totalSemesters: 8
  },
  {
    name: "Civil Engineering",
    code: "CE",
    description: "CE",
    totalSemesters: 8
  }
];

const run = async () => {
  const uri = String(process.env.MONGO_URI || "").trim();
  if (!uri) {
    console.error("MONGO_URI is not set. Add it to backend/.env (or run on Render with env vars).");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const count = await Course.countDocuments({ isActive: true });
  if (count > 0) {
    console.log(`Branches already exist (${count} active). Nothing to seed.`);
    process.exit(0);
  }

  await Course.insertMany(DEFAULT_BRANCHES);
  console.log(
    "Seeded default branches:",
    DEFAULT_BRANCHES.map((b) => b.code).join(", ")
  );
  process.exit(0);
};

run().catch((err) => {
  console.error("seed:branches failed:", err.message);
  process.exit(1);
});
