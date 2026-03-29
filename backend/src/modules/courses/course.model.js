import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: { type: String },
    duration: { type: Number, default: 4 },
    totalSemesters: { type: Number, default: 8 },
    department: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "branches" }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;