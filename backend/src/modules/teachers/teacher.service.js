import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";

export const createTeacher = async (data) => {
  const {
    firstName,
    lastName,
    email,
    password,
    employeeId,
    department,
    qualification,
    experience,
    dateOfJoining
  } = data;
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already registered');

  const finalEmployeeId =
    (employeeId || "").trim() || `EMP${Date.now()}`;

  const existingEmp = await Teacher.findOne({ employeeId: finalEmployeeId });
  if (existingEmp) throw new Error("Employee ID already exists");

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: password || "Teacher@123",
    role: "teacher",
    isVerified: true
  });
  const teacher = await Teacher.create({
    user: user._id,
    employeeId: finalEmployeeId,
    department,
    qualification,
    experience,
    dateOfJoining
  });
  return Teacher.findById(teacher._id).populate('user', '-password').populate('subjects').populate('courses');
};

export const getAllTeachers = async () => {
  return Teacher.find({ isActive: true }).populate('user', '-password').populate('subjects').populate('courses').sort({ createdAt: -1 });
};

export const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id).populate('user', '-password').populate('subjects').populate('courses');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};

export const getTeacherByUserId = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId }).populate('user', '-password').populate('subjects').populate('courses');
  if (!teacher) throw new Error('Teacher profile not found');
  return teacher;
};

const MAX_KNOWN_SUBJECTS = 40;
const MAX_KNOWN_SUBJECT_LEN = 80;
const MAX_QUALIFICATION_LEN = 500;

/**
 * Teachers may only update qualification and self-reported knownSubjects.
 */
export const updateMyTeacherProfile = async (userId, body = {}) => {
  const allowed = {};
  if (body.qualification !== undefined) {
    allowed.qualification = String(body.qualification ?? "").trim().slice(0, MAX_QUALIFICATION_LEN);
  }
  if (body.knownSubjects !== undefined) {
    const raw = Array.isArray(body.knownSubjects) ? body.knownSubjects : [];
    const cleaned = [
      ...new Set(
        raw
          .map((s) => String(s ?? "").trim())
          .filter(Boolean)
          .map((s) => s.slice(0, MAX_KNOWN_SUBJECT_LEN))
      )
    ].slice(0, MAX_KNOWN_SUBJECTS);
    allowed.knownSubjects = cleaned;
  }
  if (Object.keys(allowed).length === 0) {
    const teacher = await Teacher.findOne({ user: userId })
      .populate("user", "-password")
      .populate("subjects")
      .populate("courses");
    if (!teacher) throw new Error("Teacher profile not found");
    return teacher;
  }
  const teacher = await Teacher.findOneAndUpdate(
    { user: userId },
    { $set: allowed },
    { new: true, runValidators: true }
  )
    .populate("user", "-password")
    .populate("subjects")
    .populate("courses");
  if (!teacher) throw new Error("Teacher profile not found");
  return teacher;
};

export const updateTeacher = async (id, data) => {
  const teacher = await Teacher.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('user', '-password').populate('subjects').populate('courses');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};

export const assignSubject = async (teacherId, subjectId) => {
  const teacher = await Teacher.findByIdAndUpdate(
    teacherId, { $addToSet: { subjects: subjectId } }, { new: true }
  ).populate('user', '-password').populate('subjects');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};

export const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!teacher) throw new Error('Teacher not found');
  return { message: 'Teacher deleted successfully' };
};

