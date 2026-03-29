import Student from "./student.model.js";
import User from "../users/user.model.js";
import Course from "../courses/course.model.js";
import Attendance from "../attendance/attendance.model.js";
import Marks from "../performance/marks.model.js";
import Notification from "../notifications/notification.model.js";
import mongoose from "mongoose";

export const createStudent = async (data) => {
  const {
    firstName,
    lastName,
    name,
    email,
    password,
    rollNumber,
    branch,
    course,
    semester,
    dateOfBirth,
    gender,
    address,
    parentName,
    parentPhone,
    parentEmail,
    admissionYear
  } = data;
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already registered');
  const existingRoll = await Student.findOne({
    rollNumber,
    branch: branch || undefined,
    semester: semester || 1
  });
  if (existingRoll) throw new Error("Roll number already exists for this branch and semester");
  const full = (name || "").trim();
  const parts = full.split(" ").filter(Boolean);
  const derivedFirstName = firstName || parts[0] || "Student";
  const derivedLastName = lastName || (parts.slice(1).join(" ") || "User");
  const studentName =
    String(derivedLastName).trim().toLowerCase() === "user"
      ? String(derivedFirstName || "").trim()
      : `${derivedFirstName} ${derivedLastName}`.trim();

  const user = await User.create({
    firstName: derivedFirstName,
    lastName: derivedLastName,
    email,
    password: password || "Student@123",
    role: "student"
  });

  let branchLabel = branch ? String(branch).trim() : undefined;
  if (course && mongoose.isValidObjectId(String(course))) {
    const c = await Course.findById(course).select("code name").lean();
    branchLabel = (c?.code || c?.name || branchLabel || "").trim() || branchLabel;
  }

  const student = await Student.create({
    rollNumber: String(rollNumber).trim(),
    name: studentName || "Student",
    email: user.email,
    password: user.password, // store bcrypt hash
    branch: branchLabel,
    semester: Number(semester || 1)
  });

  return student;
};

const branchQueryFromCourse = async (course) => {
  const query = {};
  if (!course) return query;
  if (mongoose.isValidObjectId(String(course))) {
    const c = await Course.findById(course).select("code name").lean();
    const labels = [c?.code, c?.name]
      .filter(Boolean)
      .map((v) => String(v).trim())
      .filter(Boolean);
    const labelRegexes = labels.map((l) => {
      const escaped = l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`^\\s*${escaped}\\s*$`, "i");
    });
    if (labels.length || labelRegexes.length) {
      query.branch = { $in: [...labels, ...labelRegexes] };
    }
  } else {
    query.branch = String(course).trim();
  }
  return query;
};

export const getAllStudents = async (filters = {}, requester = {}) => {
  const query = await branchQueryFromCourse(filters.course);
  if (filters.semester !== undefined && filters.semester !== "") {
    query.semester = Number(filters.semester);
  }
  return Student.find(query).sort({ createdAt: -1 });
};

const MAX_SEMESTER = 8;

const parseExcludeRolls = (input) => {
  if (input == null || input === "") return new Set();
  const parts = Array.isArray(input)
    ? input
    : String(input).split(/[\s,;\n]+/);
  return new Set(
    parts
      .map((r) => String(r).trim().toLowerCase())
      .filter(Boolean)
  );
};

/**
 * Promote all students in a branch + semester cohort to the next semester,
 * except those whose roll numbers are listed in excludeRollNumbers.
 */
export const promoteStudents = async ({
  course,
  semester,
  excludeRollNumbers
}) => {
  const sem = Number(semester);
  if (!Number.isFinite(sem) || sem < 1 || sem > MAX_SEMESTER) {
    const err = new Error("Semester must be between 1 and 8");
    err.statusCode = 400;
    throw err;
  }
  if (!course) {
    const err = new Error("Branch is required");
    err.statusCode = 400;
    throw err;
  }

  const query = await branchQueryFromCourse(course);
  if (!query.branch) {
    const err = new Error("Could not resolve branch for promotion");
    err.statusCode = 400;
    throw err;
  }
  query.semester = sem;

  const students = await Student.find(query).sort({ rollNumber: 1 }).lean();
  const excludeSet = parseExcludeRolls(excludeRollNumbers);

  let promoted = 0;
  let excluded = 0;
  let skippedMaxSemester = 0;

  for (const s of students) {
    const rollKey = String(s.rollNumber ?? "").trim().toLowerCase();
    if (excludeSet.has(rollKey)) {
      excluded++;
      continue;
    }
    if (s.semester >= MAX_SEMESTER) {
      skippedMaxSemester++;
      continue;
    }
    try {
      await Student.updateOne(
        { _id: s._id },
        { $set: { semester: s.semester + 1 } }
      );
      promoted++;
    } catch (e) {
      const err = new Error(
        `Could not promote roll ${s.rollNumber}: ${e.message || "database error"}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return {
    message: `Promoted ${promoted} student(s) from semester ${sem} to ${sem + 1}.`,
    promoted,
    excluded,
    skippedMaxSemester,
    matchedInCohort: students.length
  };
};

export const getStudentById = async (id) => {
  const student = await Student.findById(id);
  if (!student) throw new Error('Student not found');
  return student;
};

export const getStudentByUserId = async (userId) => {
  const user = await User.findById(userId).select("email");
  if (!user) throw new Error("User not found");
  const student = await Student.findOne({ email: user.email });
  if (!student) throw new Error('Student profile not found');
  return student;
};

export const updateStudent = async (id, data) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!student) throw new Error('Student not found');
  return student;
};

/**
 * Permanently remove a student and all related data: attendance, marks,
 * in-app notifications for their user account, the Student document, and
 * the User used to sign in (matched by email + role student).
 */
export const deleteStudent = async (id) => {
  const sid = String(id);
  if (!mongoose.isValidObjectId(sid)) throw new Error("Invalid student id");

  const student = await Student.findById(sid).select("email").lean();
  if (!student) throw new Error("Student not found");

  const email = String(student.email || "").toLowerCase().trim();
  const authUser = email
    ? await User.findOne({ email, role: "student" }).select("_id").lean()
    : null;

  const [attendanceRes, marksRes, notifRes] = await Promise.all([
    Attendance.deleteMany({ student: sid }),
    Marks.deleteMany({ student: sid }),
    authUser?._id
      ? Notification.deleteMany({ recipient: authUser._id })
      : Promise.resolve({ deletedCount: 0 }),
  ]);

  const stuRes = await Student.deleteOne({ _id: sid });
  if (!stuRes.deletedCount) throw new Error("Student not found");

  let userDeleted = 0;
  if (authUser?._id) {
    const u = await User.deleteOne({ _id: authUser._id, role: "student" });
    userDeleted = u.deletedCount;
  }

  return {
    message: "Student and all related data removed successfully",
    details: {
      attendanceRecordsRemoved: attendanceRes.deletedCount,
      markRecordsRemoved: marksRes.deletedCount,
      notificationsRemoved: notifRes.deletedCount,
      userAccountRemoved: userDeleted,
    },
  };
};

export const bulkCreateStudents = async (studentsData) => {
  const results = { created: [], errors: [] };
  for (const data of studentsData) {
    try {
      const student = await createStudent(data);
      results.created.push(student);
    } catch (err) {
      results.errors.push({ data, error: err.message });
    }
  }
  return results;
};

