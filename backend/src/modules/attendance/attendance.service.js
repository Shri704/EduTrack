import Attendance from "./attendance.model.js";
import Student from "../students/student.model.js";
import { resolveProgramSubjectIds } from "../reports/report.service.js";
import Holiday from "../holidays/holiday.model.js";
import Subject from "../subjects/subject.model.js";
import { normalizeDayLocal } from "../holidays/holiday.service.js";
import {
  attendanceRowsForPercentage,
  countPresentForStats
} from "../../utils/attendanceStats.js";

/**
 * Semester-to-date attendance totals. If `subjectId` is set, only that subject
 * (so filtered views match the selected subject). Otherwise all program subjects.
 */
async function computeSemesterAttendanceSummary(studentId, subjectId = null) {
  const student = await Student.findById(studentId).select("branch semester").lean();
  if (!student) {
    return { total: 0, present: 0, absent: 0, percentage: 0 };
  }
  const q = { student: studentId };
  if (subjectId) {
    q.subject = subjectId;
  } else {
    const programIds = await resolveProgramSubjectIds(student);
    if (programIds.length) q.subject = { $in: programIds };
  }
  const rows = await Attendance.find(q).select("status").lean();
  const forStats = attendanceRowsForPercentage(rows);
  const total = forStats.length;
  const present = countPresentForStats(rows);
  const percentage =
    total > 0 ? +((present / total) * 100).toFixed(2) : 0;
  return { total, present, absent: total - present, percentage };
}

/** Semester program-subject attendance totals (used by analytics / risk alerts). */
export async function getProgramAttendanceSummaryForStudent(studentId) {
  return computeSemesterAttendanceSummary(studentId, null);
}

export const markAttendance = async (records) => {
  // records = [{ student, subject, date, status, teacher, remarks }]
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalized = (Array.isArray(records) ? records : []).map((r) => {
    const d = new Date(r.date);
    if (!Number.isFinite(d.getTime())) {
      throw new Error("Invalid attendance date");
    }
    d.setHours(0, 0, 0, 0);
    if (d > today) {
      throw new Error("Cannot mark attendance for future dates");
    }
    return { ...r, date: d };
  });

  for (const r of normalized) {
    if (String(r.status || "").toLowerCase() === "holiday") {
      throw new Error(
        "Use the Holidays screen to mark branch holidays; status cannot be holiday here"
      );
    }
  }

  // If a subject/day is a holiday, don't allow attendance marking to overwrite it.
  // Otherwise it would start counting toward "classes taken".
  const uniquePairs = Array.from(
    new Map(
      normalized
        .filter((r) => r?.subject && r?.date)
        .map((r) => [`${String(r.subject)}|${r.date.toISOString()}`, { subject: r.subject, date: r.date }])
    ).values()
  );

  if (uniquePairs.length) {
    // Block if any existing attendance row is already holiday.
    const existingHoliday = await Attendance.findOne({
      $or: uniquePairs.map((p) => ({
        subject: p.subject,
        date: p.date,
        status: "holiday"
      }))
    })
      .select("_id")
      .lean();
    if (existingHoliday) {
      throw new Error("This date is marked as a holiday for the selected subject.");
    }

    // Block if holiday is recorded (subject-specific or course-level).
    const subjectIds = uniquePairs.map((p) => String(p.subject));
    const subjects = await Subject.find({ _id: { $in: subjectIds } })
      .select("_id course semester")
      .lean();
    const byId = new Map(subjects.map((s) => [String(s._id), s]));

    for (const p of uniquePairs) {
      const s = byId.get(String(p.subject));
      if (!s) continue;
      const day = normalizeDayLocal(p.date);
      const hol = await Holiday.exists({
        course: s.course,
        semester: Number(s.semester),
        date: day,
        $or: [{ subject: s._id }, { subject: null }]
      });
      if (hol) {
        throw new Error("This date is marked as a holiday for the selected subject.");
      }
    }
  }

  const ops = normalized.map((r) => ({
    updateOne: {
      filter: { student: r.student, subject: r.subject, date: r.date },
      update: { $set: r },
      upsert: true,
    },
  }));
  return Attendance.bulkWrite(ops);
};

export const getStudentAttendance = async (
  studentId,
  filters = {}
) => {
  const summaryOnly =
    String(filters.summaryOnly) === "1" ||
    filters.summaryOnly === true ||
    String(filters.summaryOnly).toLowerCase() === "true";

  const semesterSummary = await computeSemesterAttendanceSummary(
    studentId,
    filters.subject || null
  );

  if (summaryOnly) {
    return {
      records: [],
      summary: { total: 0, present: 0, absent: 0, percentage: 0 },
      semesterSummary
    };
  }

  const query = { student: studentId };
  if (filters.subject) query.subject = filters.subject;
  const startRaw = filters.startDate;
  const endRaw = filters.endDate;
  if (startRaw && endRaw) {
    const a = new Date(startRaw);
    a.setHours(0, 0, 0, 0);
    const b = new Date(endRaw);
    b.setHours(0, 0, 0, 0);
    const lo = a <= b ? a : b;
    const hi = a <= b ? b : a;
    const hiEnd = new Date(hi);
    hiEnd.setHours(23, 59, 59, 999);
    query.date = { $gte: lo, $lte: hiEnd };
  } else if (startRaw) {
    const start = new Date(startRaw);
    start.setHours(0, 0, 0, 0);
    query.date = { $gte: start };
  } else if (endRaw) {
    const end = new Date(endRaw);
    end.setHours(23, 59, 59, 999);
    query.date = { $lte: end };
  }
  const records = await Attendance.find(query).populate('subject', 'name code').sort({ date: -1 });
  const total = attendanceRowsForPercentage(records).length;
  const present = countPresentForStats(records);
  const percentage = total > 0 ? (present / total) * 100 : 0;
  return {
    records,
    summary: {
      total,
      present,
      absent: total - present,
      percentage: +percentage.toFixed(2)
    },
    semesterSummary
  };
};

export const getClassAttendance = async (subjectId, date) => {
  const query = { subject: subjectId };
  if (date) query.date = new Date(date);
  return Attendance.find(query).populate("student", "name rollNumber email branch semester").sort({ date: -1 });
};

export const getAttendanceBySubject = async (
  subjectId,
  filters = {}
) => {
  const query = { subject: subjectId };
  if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) query.date = { ...query.date, $lte: new Date(filters.endDate) };
  return Attendance.find(query).populate("student", "name rollNumber email branch semester").sort({ date: -1 });
};

export const getLowAttendanceStudents = async (threshold = 75) => {
  const students = await Student.find({});
  const result = [];
  for (const student of students) {
    const records = await Attendance.find({ student: student._id });
    if (records.length === 0) continue;
    const denom = attendanceRowsForPercentage(records).length;
    if (denom === 0) continue;
    const present = countPresentForStats(records);
    const percentage = (present / denom) * 100;
    if (percentage < threshold) result.push({ student, percentage: +percentage.toFixed(2) });
  }
  return result;
};

