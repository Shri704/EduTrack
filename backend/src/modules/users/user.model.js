import mongoose from "mongoose";
import { hashPassword } from "../../utils/passwordHasher.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["superadmin", "admin", "teacher", "student"],
      default: "student"
    },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    // OTP-based signup verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;