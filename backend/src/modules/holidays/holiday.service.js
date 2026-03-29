import mongoose from "mongoose";
import Holiday from "./holiday.model.js";
import Attendance from "../attendance/attendance.model.js";
import Subject from "../subjects/subject.model.js";
import Teacher from "../teachers/teacher.model.js";
import Student from "../students/student.model.js";
import Course from "../courses/course.model.js";

export function normalizeDayLocal(dateInput) {
  const d = new Date(dateInput);
  if (!Number.isFinite(d.getTime())) throw new Error("Invalid date");
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseSemester(semester) {
  const semNum = Number(semester);
  if (!Number.isFinite(semNum) || semNum < 1 || semNum > 32) {
    throw new Error("Valid semester (number) is required");
  }
  return semNum;
}

async function teacherCanManageCourseSemester(teacherDocId, courseId, semester) {
  const semNum = parseSemester(semester);
  const subs = await Subject.find({ course: courseId, semester: semNum })
    .select("_id")
    .lean();
  const sidSet = new Set(subs.map((s) => String(s._id)));
  if (!sidSet.size) return false;
  const teacher = await Teacher.findById(teacherDocId).lean();
  if (!teacher?.subjects?.length) return false;
  return teacher.subjects.some((s) =>
    sidSet.has(String(typeof s === "object" ? s._id ?? s : s))
  );
}

export async function createHolidayForCourse({
  courseId,
  semester,
  date,
  userId,
  userRole,
  note = ""
}) {
  if (!mongoose.isValidObjectId(String(courseId))) {
    throw new Error("Invalid course id");
  }
  const semNum = parseSemester(semester);
  const day = normalizeDayLocal(date);
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  let teacherDoc = null;
  if (!isAdmin) {
    teacherDoc = await Teacher.findOne({ user: userId });
    if (!teacherDoc) throw new Error("Teacher profile not found");
    const can = await teacherCanManageCourseSemester(
      teacherDoc._id,
      courseId,
      semNum
    );
    if (!can) {
      throw new Error(
        "You are not assigned to teach this branch for the selected semester"
      );
    }
  }

  await Holiday.findOneAndUpdate(
    { course: courseId, date: day, semester: semNum },
    {
      $set: {
        course: courseId,
        date: day,
        semester: semNum,
        createdBy: userId,
        note: String(note || "").trim()
      }
    },
    { upsert: true, new: true }
  );

  const course = await Course.findById(courseId).select("code name").lean();
  const labels = [course?.code, course?.name]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter(Boolean);
  const labelRegexes = labels.map((l) => {
    const escaped = l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^\\s*${escaped}\\s*$`, "i");
  });
  const branchQuery = { $in: [...labels, ...labelRegexes] };

  const subjects = await Subject.find({
    course: courseId,
    semester: semNum,
    isActive: { $ne: false }
  }).lean();

  const students = await Student.find({
    branch: branchQuery,
    semester: semNum
  })
    .select("_id")
    .lean();

  const teacherIdForRow =
    teacherDoc && mongoose.isValidObjectId(String(teacherDoc._id))
      ? teacherDoc._id
      : undefined;

  const ops = [];
  for (const sub of subjects) {
    for (const st of students) {
      const setDoc = {
        student: st._id,
        subject: sub._id,
        date: day,
        status: "holiday",
        remarks: "Holiday"
      };
      if (teacherIdForRow) setDoc.teacher = teacherIdForRow;

      ops.push({
        updateOne: {
          filter: { student: st._id, subject: sub._id, date: day },
          update: { $set: setDoc },
          upsert: true
        }
      });
    }
  }

  if (ops.length) {
    await Attendance.bulkWrite(ops, { ordered: false });
  }

  return {
    message:
      "Holiday saved; attendance marked H for this branch, semester, and date",
    attendanceRowsUpserted: ops.length
  };
}

export async function listHolidays({ courseId, semester, userId, userRole }) {
  if (!courseId || !mongoose.isValidObjectId(String(courseId))) {
    throw new Error("courseId is required");
  }
  const semNum = parseSemester(semester);
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  if (!isAdmin) {
    const teacherDoc = await Teacher.findOne({ user: userId });
    if (!teacherDoc) throw new Error("Teacher profile not found");
    const can = await teacherCanManageCourseSemester(
      teacherDoc._id,
      courseId,
      semNum
    );
    if (!can) {
      throw new Error(
        "You are not assigned to teach this branch for the selected semester"
      );
    }
  }
  return Holiday.find({ course: courseId, semester: semNum })
    .sort({ date: -1 })
    .populate("course", "code name")
    .lean();
}

export async function removeHolidayForCourse({
  courseId,
  semester,
  date,
  userId,
  userRole
}) {
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const semNum = parseSemester(semester);
  if (!isAdmin) {
    const teacherDoc = await Teacher.findOne({ user: userId });
    if (!teacherDoc) throw new Error("Teacher profile not found");
    const can = await teacherCanManageCourseSemester(
      teacherDoc._id,
      courseId,
      semNum
    );
    if (!can) {
      throw new Error(
        "You are not assigned to teach this branch for the selected semester"
      );
    }
  }

  const day = normalizeDayLocal(date);
  await Holiday.deleteOne({ course: courseId, date: day, semester: semNum });
  const subjects = await Subject.find({
    course: courseId,
    semester: semNum
  })
    .select("_id")
    .lean();
  const subIds = subjects.map((s) => s._id);
  if (!subIds.length) {
    return { message: "Holiday removed" };
  }
  await Attendance.updateMany(
    { subject: { $in: subIds }, date: day, status: "holiday" },
    { $set: { status: "absent", remarks: "" } }
  );
  return { message: "Holiday removed; attendance reset to absent" };
}
