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
  subjectId = null,
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
  }

  let subjects;
  if (subjectId) {
    if (!mongoose.isValidObjectId(String(subjectId))) {
      throw new Error("Invalid subject id");
    }
    const s = await Subject.findById(subjectId)
      .select("_id course semester")
      .lean();
    if (
      !s ||
      String(s.course) !== String(courseId) ||
      Number(s.semester) !== semNum
    ) {
      throw new Error("Subject not found for given branch and semester");
    }
    subjects = [s];
  } else {
    subjects = await Subject.find({
      course: courseId,
      semester: semNum,
      isActive: { $ne: false }
    }).lean();
  }

  await Holiday.findOneAndUpdate(
    { course: courseId, date: day, semester: semNum, subject: subjectId ?? null },
    {
      $set: {
        course: courseId,
        date: day,
        semester: semNum,
        subject: subjectId ?? null,
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

  // Note: `subjects` is computed above (either single subject or all subjects).

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
      subjectId
        ? "Holiday saved; attendance marked H for selected subject, semester, and date"
        : "Holiday saved; attendance marked H for this branch, semester, and date",
    attendanceRowsUpserted: ops.length
  };
}

export async function listHolidays({
  courseId,
  semester,
  subjectId = null,
  userId,
  userRole
}) {
  if (!courseId || !mongoose.isValidObjectId(String(courseId))) {
    throw new Error("courseId is required");
  }
  const semNum = parseSemester(semester);
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  if (!isAdmin) {
    const teacherDoc = await Teacher.findOne({ user: userId }).select("_id").lean();
    if (!teacherDoc) throw new Error("Teacher profile not found");
  }
  const q = { course: courseId, semester: semNum };
  const query = subjectId
    ? { ...q, $or: [{ subject: subjectId }, { subject: null }] }
    : q;
  return Holiday.find(query)
    .sort({ date: -1 })
    .populate("course", "code name")
    .lean();
}

export async function removeHolidayForCourse({
  courseId,
  semester,
  date,
  subjectId = null,
  userId,
  userRole
}) {
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const semNum = parseSemester(semester);
  if (!isAdmin) {
    const teacherDoc = await Teacher.findOne({ user: userId }).select("_id").lean();
    if (!teacherDoc) throw new Error("Teacher profile not found");
  }

  const day = normalizeDayLocal(date);

  if (subjectId) {
    const courseLevelExists = await Holiday.exists({
      course: courseId,
      date: day,
      semester: semNum,
      $or: [{ subject: null }, { subject: { $exists: false } }]
    });

    if (courseLevelExists) {
      await Holiday.deleteMany({ course: courseId, date: day, semester: semNum });

      const subjects = await Subject.find({
        course: courseId,
        semester: semNum
      })
        .select("_id")
        .lean();
      const subIds = subjects.map((s) => s._id);

      if (subIds.length) {
        await Attendance.deleteMany({
          subject: { $in: subIds },
          date: day,
          status: "holiday"
        });
      }
    } else {
      await Holiday.deleteOne({
        course: courseId,
        date: day,
        semester: semNum,
        subject: subjectId
      });

      await Attendance.deleteMany({ subject: subjectId, date: day, status: "holiday" });
    }
  } else {
    await Holiday.deleteMany({ course: courseId, date: day, semester: semNum });
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
    await Attendance.deleteMany({
      subject: { $in: subIds },
      date: day,
      status: "holiday"
    });
  }
  return { message: "Holiday removed; holiday rows cleared" };
}
