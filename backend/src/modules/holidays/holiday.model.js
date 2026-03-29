import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    /** Cohort (program semester) this holiday applies to. */
    semester: { type: Number, required: true, min: 1 },
    /** Calendar day (normalized to local midnight in service). */
    date: { type: Date, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

holidaySchema.index({ course: 1, date: 1, semester: 1 }, { unique: true });

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
