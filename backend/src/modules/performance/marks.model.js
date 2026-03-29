import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    examType: {
      type: String,
      enum: [
        "internal",
        "midterm",
        "final",
        "assignment",
        "quiz",
        "ia1",
        "ia2",
        "additionalIA"
      ],
      required: true
    },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    grade: { type: String },
    remarks: { type: String },
    examDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

marksSchema.pre("save", function (next) {
  const percentage = (this.marksObtained / this.totalMarks) * 100;
  if (percentage >= 90) this.grade = "A+";
  else if (percentage >= 80) this.grade = "A";
  else if (percentage >= 70) this.grade = "B+";
  else if (percentage >= 60) this.grade = "B";
  else if (percentage >= 50) this.grade = "C";
  else if (percentage >= 40) this.grade = "D";
  else this.grade = "F";
  next();
});

const Marks = mongoose.model("Marks", marksSchema);

export default Marks;