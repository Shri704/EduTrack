import mongoose from "mongoose";
import { hashPassword } from "../../utils/passwordHasher.js";

const studentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true, minlength: 6 },
    branch: { type: String, trim: true },
    semester: { type: Number, required: true }
  },
  { timestamps: true }
);

// Hash student password like User does
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // If already a bcrypt hash (copied from `users` collection), keep as-is.
  if (typeof this.password === "string" && this.password.startsWith("$2")) {
    return next();
  }
  this.password = await hashPassword(this.password);
  next();
});

// Roll numbers are unique per branch + semester
studentSchema.index({ branch: 1, semester: 1, rollNumber: 1 }, { unique: true });

const Student = mongoose.model("Student", studentSchema);

export default Student;