import Student from "../students/student.model.js";
import Subject from "../subjects/subject.model.js";
import Teacher from "../teachers/teacher.model.js";
import Course from "../courses/course.model.js";
import mongoose from "mongoose";
import Marks from "../performance/marks.model.js";
import Attendance from "../attendance/attendance.model.js";

import { generateStudentReport } from "./report.generator.js";
import {
  attendanceRowsForPercentage,
  countPresentForStats
} from "../../utils/attendanceStats.js";

const toDayKey = (d) => new Date(d).toISOString().slice(0, 10);

const buildDateKeys = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const keys = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    keys.push(toDayKey(d));
  }
  return keys;
};

const findStudentByRollBranchSem = async ({ rollNumber, branch, semester }) => {
  const semNum = Number(semester);
  const roll = String(rollNumber).trim();

  // Current schema: rollNumber + branch(label) + semester
  const direct = await Student.findOne({ rollNumber: roll, branch: String(branch).trim(), semester: semNum });
  if (direct) return direct;

  // Backward-compatible: branch can be a Branch/Course _id (convert to code/name)
  if (branch && mongoose.isValidObjectId(String(branch))) {
    const c = await Course.findById(branch).select("code name").lean();
    const labels = [c?.code, c?.name].filter(Boolean).map((v) => String(v).trim());
    if (labels.length) {
      const labelRegexes = labels.map((l) => {
        const escaped = l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`^\\s*${escaped}\\s*$`, "i");
      });
      const legacy = await Student.findOne({
        rollNumber: roll,
        branch: { $in: [...labels, ...labelRegexes] },
        semester: semNum
      });
      if (legacy) return legacy;
    }
  }

  return null;
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Subjects offered for this student's branch (course match) and semester */
export const resolveProgramSubjects = async (student) => {
  if (!student?.branch || student.semester == null) return [];
  const branch = String(student.branch).trim();
  const sem = Number(student.semester);
  let courseIds = [];
  if (mongoose.isValidObjectId(branch)) {
    courseIds = [new mongoose.Types.ObjectId(branch)];
  } else {
    const courses = await Course.find({
      $or: [
        { code: new RegExp(`^\\s*${escapeRegex(branch)}\\s*$`, "i") },
        { name: new RegExp(`^\\s*${escapeRegex(branch)}\\s*$`, "i") }
      ]
    })
      .select("_id")
      .lean();
    courseIds = courses.map((c) => c._id);
  }
  if (!courseIds.length) return [];
  return Subject.find({
    course: { $in: courseIds },
    semester: sem,
    isActive: { $ne: false }
  })
    .select("name code")
    .sort({ name: 1 })
    .lean();
};

/** ObjectIds of subjects in this student's branch/course and semester (the “current semester” course load). */
export const resolveProgramSubjectIds = async (student) => {
  const subs = await resolveProgramSubjects(student);
  return subs.map((s) => s._id).filter(Boolean);
};

export const resolveProgramSubjectIdsByStudentId = async (studentId) => {
  const student = await Student.findById(studentId).select("branch semester").lean();
  if (!student) return [];
  return resolveProgramSubjectIds(student);
};

export const getStudentReport = async (studentId) => {
  const student = await Student.findById(studentId).select("-password").lean();
  if (!student) throw new Error("Student not found");

  const programSubjects = await resolveProgramSubjects(student);
  const programIdSet = new Set(
    programSubjects.map((s) => String(s._id))
  );
  const inProgram = (row) => {
    if (!programIdSet.size) return true;
    const sid = row.subject?._id != null ? String(row.subject._id) : String(row.subject ?? "");
    return programIdSet.has(sid);
  };

  const marksAll = await Marks.find({ student: studentId })
    .populate("subject", "name code")
    .sort({ examDate: -1 })
    .lean();

  const attendanceAll = await Attendance.find({ student: studentId })
    .populate("subject", "name code")
    .sort({ date: -1 })
    .lean();

  const marks = programIdSet.size ? marksAll.filter(inProgram) : marksAll;
  const attendance = programIdSet.size ? attendanceAll.filter(inProgram) : attendanceAll;

  return generateStudentReport(student, marks, attendance, programSubjects);
};

export const getMyStudentReport = async (userId) => {
  const user = await (await import("../users/user.model.js")).default.findById(userId).select("email");
  const student = user ? await Student.findOne({ email: user.email }) : null;
  if (!student) throw new Error("Student profile not found");
  return getStudentReport(student._id);
};

export const getClassReport = async (courseId) => {
  const subjectIds = (await Subject.find({ course: courseId }).select("_id")).map((s) => s._id);
  if (subjectIds.length === 0) return { marks: [], attendance: [] };

  const marks = await Marks.find({ subject: { $in: subjectIds } })
    .populate("student")
    .populate("subject");
  const attendance = await Attendance.find({ subject: { $in: subjectIds } })
    .populate("student")
    .populate("subject");

  return { marks, attendance };
};

export const getAttendanceReport = async (filters) => {
  const { startDate, endDate, branch, semester, rollNumber, includeRecords } =
    filters;
  const wantFlat =
    includeRecords === true ||
    includeRecords === "true" ||
    includeRecords === "1";

  if (!branch || !semester) {
    throw new Error("branch and semester are required");
  }

  const hasDateRange = Boolean(startDate && endDate);
  const start = hasDateRange ? new Date(startDate) : null;
  const end = hasDateRange ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const rollFilter =
    rollNumber != null && String(rollNumber).trim() !== ""
      ? String(rollNumber).trim()
      : null;

  let students;
  if (rollFilter) {
    const s = await findStudentByRollBranchSem({
      rollNumber: rollFilter,
      branch,
      semester
    });
    if (!s) throw new Error("Student not found for given roll number, branch, and semester");
    students = [s];
  } else {
    // Branch can be label or Branch _id (handled in student.service; here we mimic)
    if (mongoose.isValidObjectId(String(branch))) {
      const c = await Course.findById(branch).select("code name").lean();
      const labels = [c?.code, c?.name].filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
      const labelRegexes = labels.map((l) => {
        const escaped = l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`^\\s*${escaped}\\s*$`, "i");
      });
      students = await Student.find({ branch: { $in: [...labels, ...labelRegexes] }, semester: Number(semester) }).sort({ rollNumber: 1 });
    } else {
      students = await Student.find({ branch: String(branch).trim(), semester: Number(semester) }).sort({ rollNumber: 1 });
    }
  }

  const results = [];
  const programIdsCache = new Map();

  for (const student of students) {
    const cacheKey = `${String(student.branch)}|${Number(student.semester)}`;
    let programIds = programIdsCache.get(cacheKey);
    if (programIds === undefined) {
      programIds = await resolveProgramSubjectIds(student);
      programIdsCache.set(cacheKey, programIds);
    }

    const semAttQuery = { student: student._id };
    if (programIds.length) semAttQuery.subject = { $in: programIds };
    const semesterAttendance = await Attendance.find(semAttQuery);
    const totalClasses = semesterAttendance.length;
    const presentClasses = semesterAttendance.filter((a) => a.status === "present").length;
    const attendancePercent = totalClasses ? (presentClasses / totalClasses) * 100 : 0;

    const marksQuery = { student: student._id };
    if (programIds.length) marksQuery.subject = { $in: programIds };
    const marksRecords = await Marks.find(marksQuery).populate("subject", "name code");

    const totalObtained = marksRecords.reduce((s, m) => s + (m.marksObtained || 0), 0);
    const totalMax = marksRecords.reduce((s, m) => s + (m.totalMarks || 100), 0);
    const averageMarks = marksRecords.length ? totalObtained / marksRecords.length : 0;
    const averagePercent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    const name = student.name || student.rollNumber;

    results.push({
      student: {
        _id: student._id,
        rollNumber: student.rollNumber,
        name,
        email: student.email,
        branch: student.branch,
        semester: student.semester
      },
      classesTaken: totalClasses,
      classesAttended: presentClasses,
      attendancePercent,
      marks: marksRecords,
      averageMarks,
      averagePercent
    });
  }

  let flatAttendance = [];
  let flatMarks = [];
  if (wantFlat && students.length) {
    const studentIds = students.map((s) => s._id);
    const attQ = { student: { $in: studentIds } };
    if (hasDateRange) attQ.date = { $gte: start, $lte: end };
    flatAttendance = await Attendance.find(attQ)
      .populate("student", "rollNumber name email branch semester")
      .populate("subject", "name code")
      .sort({ date: -1 })
      .lean();
    flatMarks = await Marks.find({ student: { $in: studentIds } })
      .populate("student", "rollNumber name email branch semester")
      .populate("subject", "name code")
      .sort({ examDate: -1 })
      .lean();
  }

  return {
    startDate: startDate || null,
    endDate: endDate || null,
    branch,
    semester,
    results,
    ...(wantFlat ? { flatAttendance, flatMarks } : {})
  };
};

export const getAttendanceReportForTeacher = async (filters, teacherId) => {
  const { startDate, endDate, branch, semester, subject: subjectId, rollNumber } = filters;

  if (!branch || !semester || !subjectId) {
    throw new Error("branch, semester, and subject are required");
  }

  const teacher = await Teacher.findById(teacherId).populate("subjects");
  if (!teacher) throw new Error("Teacher not found");

  const teacherSubjectIds = (teacher.subjects || []).map((s) => (typeof s === "object" ? s._id : s));
  if (teacherSubjectIds.length && !teacherSubjectIds.some((id) => String(id) === String(subjectId))) {
    throw new Error("You do not teach this subject");
  }

  const subject = await Subject.findById(subjectId);
  if (!subject || String(subject.course) !== String(branch) || subject.semester !== Number(semester)) {
    throw new Error("Subject not found for given branch and semester");
  }

  const hasDateRange = Boolean(startDate && endDate);
  const start = hasDateRange ? new Date(startDate) : null;
  const end = hasDateRange ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const dateKeys = hasDateRange ? buildDateKeys(startDate, endDate) : [];

  const rollFilterTeacher =
    rollNumber != null && String(rollNumber).trim() !== ""
      ? String(rollNumber).trim()
      : null;

  let students;
  if (rollFilterTeacher) {
    const s = await findStudentByRollBranchSem({
      rollNumber: rollFilterTeacher,
      branch,
      semester
    });
    if (!s) throw new Error("Student not found for given roll number, branch, and semester");
    students = [s];
  } else {
    if (mongoose.isValidObjectId(String(branch))) {
      const c = await Course.findById(branch).select("code name").lean();
      const labels = [c?.code, c?.name].filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
      const labelRegexes = labels.map((l) => {
        const escaped = l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`^\\s*${escaped}\\s*$`, "i");
      });
      students = await Student.find({ branch: { $in: [...labels, ...labelRegexes] }, semester: Number(semester) }).sort({ rollNumber: 1 });
    } else {
      students = await Student.find({ branch: String(branch).trim(), semester: Number(semester) }).sort({ rollNumber: 1 });
    }
  }

  const results = [];

  for (const student of students) {
    const attBase = { student: student._id, subject: subjectId };
    const attendanceSemester = await Attendance.find(attBase);
    const totalClasses = attendanceRowsForPercentage(attendanceSemester).length;
    const presentClasses = countPresentForStats(attendanceSemester);
    const attendancePercent = totalClasses ? (presentClasses / totalClasses) * 100 : 0;

    const attendanceQuery = { ...attBase };
    if (hasDateRange) attendanceQuery.date = { $gte: start, $lte: end };
    const attendanceInRange = hasDateRange
      ? await Attendance.find(attendanceQuery)
      : attendanceSemester;
    const statusByDay = new Map(
      attendanceInRange.map((r) => [toDayKey(r.date), r.status])
    );

    const marksRecords = await Marks.find({
      student: student._id,
      subject: subjectId
    }).populate("subject", "name code");

    const subjectMarks = marksRecords.filter((m) => String(m.subject?._id || m.subject) === String(subjectId));
    const totalObtained = subjectMarks.reduce((s, m) => s + (m.marksObtained || 0), 0);
    const totalMax = subjectMarks.reduce((s, m) => s + (m.totalMarks || 100), 0);
    const averageMarks = subjectMarks.length ? totalObtained / subjectMarks.length : 0;
    const averagePercent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    const name = student.name || student.rollNumber;

    results.push({
      student: {
        _id: student._id,
        rollNumber: student.rollNumber,
        name,
        branch: student.branch,
        semester: student.semester
      },
      subject: { _id: subject._id, name: subject.name, code: subject.code },
      classesTaken: totalClasses,
      classesAttended: presentClasses,
      attendancePercent,
      ...(hasDateRange
        ? {
            daily: dateKeys.map((k) => ({
              date: k,
              status: statusByDay.get(k) || "absent"
            }))
          }
        : {}),
      marks: marksRecords,
      averageMarks,
      averagePercent
    });
  }

  return {
    startDate: startDate || null,
    endDate: endDate || null,
    branch,
    semester,
    subject: { _id: subject._id, name: subject.name, code: subject.code },
    ...(hasDateRange ? { dates: dateKeys } : {}),
    results
  };
};