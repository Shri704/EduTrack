import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String },
    qualification: { type: String },
    /** Self-reported subject areas / skills (strings); separate from admin-assigned `subjects` */
    knownSubjects: [{ type: String, trim: true }],
    experience: { type: Number, default: 0 },
    subjects: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }
    ],
    courses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" }
    ],
    dateOfJoining: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;