import mongoose from "mongoose";
import User from "./user.model.js";
import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";
import Attendance from "../attendance/attendance.model.js";
import Marks from "../performance/marks.model.js";
import Notification from "../notifications/notification.model.js";
import { deleteStudent } from "../students/student.service.js";

export const createUser = async (data) => {
  return await User.create(data);
};

export const getUsers = async () => {
  return await User.find()
    .select("-password -otp -otpExpires")
    .sort({ createdAt: -1 })
    .lean();
};

export const getUserById = async (id) => {
  return await User.findById(id).select("-password -otp -otpExpires").lean();
};

export const updateUser = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, {
    new: true
  });
};

/**
 * Remove a user and all related data:
 * - student → same cascade as deleteStudent (attendance, marks, notifications, Student, User)
 * - teacher → attendance & marks for that teacher, notifications, Teacher profile, User
 * - admin / superadmin → notifications + User
 */
export const deleteUser = async (id, requester) => {
  const uid = String(id);
  if (!mongoose.isValidObjectId(uid)) throw new Error("Invalid user id");

  const requesterId = requester?._id ?? requester;
  const requesterRole = requester?.role;

  if (requesterId && String(requesterId) === uid) {
    throw new Error("You cannot delete your own account");
  }

  const user = await User.findById(uid).lean();
  if (!user) throw new Error("User not found");

  if (requesterRole === "admin") {
    if (user.role !== "student" && user.role !== "teacher") {
      throw new Error(
        "Admins may only delete student or teacher accounts. Ask a super admin to remove other admins."
      );
    }
  }

  if (user.role === "superadmin") {
    const count = await User.countDocuments({ role: "superadmin" });
    if (count <= 1) {
      throw new Error("Cannot delete the only superadmin account");
    }
  }

  if (user.role === "student") {
    const email = String(user.email || "").toLowerCase().trim();
    const student = email
      ? await Student.findOne({ email }).select("_id").lean()
      : null;
    if (student) {
      return await deleteStudent(student._id);
    }
    const notifRes = await Notification.deleteMany({ recipient: uid });
    const uRes = await User.deleteOne({ _id: uid });
    if (!uRes.deletedCount) throw new Error("User not found");
    return {
      message: "User account removed (no student profile was linked)",
      details: {
        notificationsRemoved: notifRes.deletedCount,
        userAccountRemoved: 1,
      },
    };
  }

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: uid }).select("_id").lean();
    if (teacher) {
      const tid = teacher._id;
      const [attRes, marksRes, notifRes] = await Promise.all([
        Attendance.deleteMany({ teacher: tid }),
        Marks.deleteMany({ teacher: tid }),
        Notification.deleteMany({ recipient: uid }),
      ]);
      await Teacher.deleteOne({ _id: tid });
      const uRes = await User.deleteOne({ _id: uid });
      if (!uRes.deletedCount) throw new Error("User not found");
      return {
        message: "Teacher and all related data removed successfully",
        details: {
          attendanceRecordsRemoved: attRes.deletedCount,
          markRecordsRemoved: marksRes.deletedCount,
          notificationsRemoved: notifRes.deletedCount,
          userAccountRemoved: 1,
        },
      };
    }
    const notifRes = await Notification.deleteMany({ recipient: uid });
    const uRes = await User.deleteOne({ _id: uid });
    if (!uRes.deletedCount) throw new Error("User not found");
    return {
      message: "User account removed (no teacher profile was linked)",
      details: {
        notificationsRemoved: notifRes.deletedCount,
        userAccountRemoved: 1,
      },
    };
  }

  const notifRes = await Notification.deleteMany({ recipient: uid });
  const uRes = await User.deleteOne({ _id: uid });
  if (!uRes.deletedCount) throw new Error("User not found");
  return {
    message: "User deleted",
    details: {
      notificationsRemoved: notifRes.deletedCount,
      userAccountRemoved: 1,
    },
  };
};