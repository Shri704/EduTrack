import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Course from "../courses/course.model.js";
import mongoose from "mongoose";
import { comparePassword } from "../../utils/passwordHasher.js";
import { generateUserToken } from "../../utils/generateToken.js";
import { sendEmail } from "../../utils/emailService.js";
import logger from "../../utils/logger.js";

// Self-registration (students only) with OTP verification
export const register = async ({
  firstName,
  lastName,
  name,
  fullName,
  email,
  password,
  rollNumber,
  semester,
  sem,
  branch
}) => {
  const exists = await User.findOne({ email });
  if (exists) throw new Error("Email already registered");

  const full = (fullName || name || "").trim() || "Student User";
  const parts = full.split(" ");
  const derivedFirstName = firstName || parts[0] || "Student";
  const derivedLastName = lastName || (parts.slice(1).join(" ") || "User");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    firstName: derivedFirstName,
    lastName: derivedLastName,
    email,
    password,
    role: "student",
    isVerified: false,
    otp,
    otpExpires
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Your EduTrack verification code",
      transactional: true,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your EduTrack account</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
      text: `Your EduTrack verification code is ${otp}. It is valid for 10 minutes.`
    });
  } catch (emailErr) {
    logger.error(`Registration email failed: ${emailErr.message}`);
    const nonProd = process.env.NODE_ENV !== "production";
    if (nonProd) {
      logger.warn(
        `[${process.env.NODE_ENV || "dev"}] OTP for ${user.email} (email not sent): ${otp}`
      );
      return {
        message:
          "Account created. Email was not sent — use the verification code below or fix Brevo (BREVO_API_KEY, BREVO_FROM_EMAIL) in backend/.env.",
        email: user.email,
        emailSent: false,
        verificationOtp: otp
      };
    }
    await User.deleteOne({ _id: user._id });
    const err = new Error(
      emailErr.message ||
        "Could not send verification email. Set BREVO_API_KEY and a validated BREVO_FROM_EMAIL in backend/.env."
    );
    err.statusCode =
      typeof emailErr.statusCode === "number" ? emailErr.statusCode : 503;
    throw err;
  }

  return {
    message: "Registration successful. OTP sent to your email for verification.",
    email: user.email,
    emailSent: true
  };
};

export const verifyOtp = async ({
  email,
  otp,
  rollNumber,
  semester,
  sem,
  branch
}) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.isVerified) {
    const token = generateUserToken(user);
    return { user, token };
  }

  if (!user.otp || !user.otpExpires) {
    throw new Error("No OTP request found. Please sign up again.");
  }

  if (user.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpires < new Date()) {
    throw new Error("OTP has expired");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.lastLogin = new Date();
  await user.save();

  const semVal = semester ?? sem;
  if (user.role === "student" && rollNumber) {
    // `branch` comes from the registration UI and can be either:
    // - a free-text label (legacy), or
    // - a Branch/Course _id (preferred)
    let courseId = undefined;
    let branchLabel = branch ? String(branch).trim() : undefined;

    if (branchLabel && mongoose.isValidObjectId(branchLabel)) {
      const course = await Course.findById(branchLabel);
      if (course) {
        courseId = course._id;
        branchLabel = (course.code || course.name || "").trim() || branchLabel;
      }
    }

    const existingRoll = await Student.findOne({
      rollNumber: String(rollNumber).trim(),
      branch: branchLabel,
      semester: semVal ? Number(semVal) : 1
    });
    if (existingRoll) throw new Error("Roll number already registered for this branch and semester");

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const studentName =
      (user.lastName || "").trim().toLowerCase() === "user"
        ? String(user.firstName || "").trim()
        : fullName;

    await Student.create({
      rollNumber: String(rollNumber).trim(),
      name: studentName || "Student",
      email: user.email,
      password: user.password, // hashed in User model; Student model keeps bcrypt hashes as-is
      semester: semVal ? Number(semVal) : 1,
      branch: branchLabel,
    });
  }

  const token = generateUserToken(user);

  return { user, token };
};

export const login = async ({ email, password }) => {
  const emailNorm = String(email || "")
    .toLowerCase()
    .trim();
  const user = await User.findOne({ email: emailNorm });
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  if (!user.isActive) throw new Error("Account is deactivated");

  // Enforce OTP verification only for self-registered students.
  // Superadmin, admin and teacher accounts can log in without OTP.
  if (user.role === "student" && !user.isVerified) {
    throw new Error(
      "Please verify your account using the OTP sent to your email."
    );
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateUserToken(user);

  return { user, token };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const updateProfile = async (userId, updates) => {
  const allowedFields = ["firstName", "lastName", "phone", "avatar"];
  const filtered = {};

  allowedFields.forEach((f) => {
    if (updates[f] !== undefined) filtered[f] = updates[f];
  });

  return User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true
  }).select("-password");
};

export const changePassword = async (
  userId,
  { currentPassword, newPassword }
) => {
  const user = await User.findById(userId);
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully" };
};

export const forgotPassword = async ({ email }) => {
  if (!email || !String(email).trim()) throw new Error("Email is required");

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) throw new Error("No account found with this email");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your EduTrack password",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${user.firstName || "there"},</p>
        <p>Use this code to reset your EduTrack password:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
      text: `Your EduTrack password reset code is ${otp}. It is valid for 15 minutes.`
    });
  } catch (emailErr) {
    logger.error(`Password reset email failed: ${emailErr.message}`);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const err = new Error(
      emailErr.message ||
        "Could not send reset email. Check BREVO_API_KEY and validated BREVO_FROM_EMAIL in backend/.env."
    );
    err.statusCode = emailErr.statusCode || 503;
    throw err;
  }

  return { message: "Password reset code sent to your email", email: user.email };
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  if (!email || !otp || !newPassword) {
    throw new Error("Email, OTP, and new password are required");
  }
  if (String(newPassword).length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) throw new Error("User not found");

  if (!user.otp || !user.otpExpires) throw new Error("No reset request found. Please request a new code.");
  if (user.otp !== otp) throw new Error("Invalid or expired code");
  if (user.otpExpires < new Date()) throw new Error("Code has expired. Please request a new one.");

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Keep linked student record password in sync (login uses User; some flows read Student)
  if (user.role === "student") {
    const student = await Student.findOne({ email: user.email });
    if (student) {
      student.password = newPassword;
      await student.save();
    }
  }

  return { message: "Password reset successfully" };
};