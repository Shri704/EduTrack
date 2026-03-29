import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "low_attendance",
        "low_marks",
        "attendance_ia_alert",
        "system",
        "info"
      ],
      default: "info"
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;