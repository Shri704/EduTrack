import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    semester: { type: Number, required: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher"
    },
    credits: { type: Number, default: 3 },
    totalClasses: { type: Number, default: 60 },
    passingMarks: { type: Number, default: 40 },
    totalMarks: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;