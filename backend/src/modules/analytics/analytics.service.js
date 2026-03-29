import mongoose from "mongoose";
import Attendance from "../attendance/attendance.model.js";
import Marks from "../performance/marks.model.js";
import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";
import Subject from "../subjects/subject.model.js";
import { resolveProgramSubjectIdsByStudentId } from "../reports/report.service.js";

// NOTE: Older analytics functions existed but were based on different model field names.
// The functions below power the current frontend dashboards/charts.

const toObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
  return new mongoose.Types.ObjectId(String(id));
};

export const getAdminOverview = async () => {
  const [totalStudents, totalTeachers] = await Promise.all([
    Student.countDocuments({}),
    Teacher.countDocuments({ isActive: true })
  ]);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const attendanceAgg = await Attendance.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: null,
        held: {
          $sum: { $cond: [{ $ne: ["$status", "holiday"] }, 1, 0] }
        },
        present: {
          $sum: {
            $cond: [{ $eq: ["$status", "present"] }, 1, 0]
          }
        }
      }
    }
  ]);

  const avgAttendance =
    attendanceAgg[0]?.held
      ? (attendanceAgg[0].present / attendanceAgg[0].held) * 100
      : 0;

  const marksAgg = await Marks.aggregate([
    { $match: { examDate: { $gte: since } } },
    {
      $project: {
        percentage: {
          $multiply: [
            { $divide: ["$marksObtained", "$totalMarks"] },
            100
          ]
        }
      }
    },
    { $group: { _id: null, avg: { $avg: "$percentage" } } }
  ]);

  const avgPerformance = Number(marksAgg[0]?.avg || 0);

  return {
    totalStudents,
    totalTeachers,
    avgAttendance,
    avgPerformance
  };
};

export const getAttendanceDaily = async ({ studentId } = {}) => {
  const days = 5;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const sid = toObjectId(studentId);
  const pipeline = [];

  if (sid) {
    const programIds = await resolveProgramSubjectIdsByStudentId(studentId);
    const m = { student: sid };
    if (programIds.length) m.subject = { $in: programIds };
    pipeline.push({ $match: m });
  }

  pipeline.push({
    $addFields: {
      parsedDate: {
        $convert: {
          input: "$date",
          to: "date",
          onError: null,
          onNull: null
        }
      }
    }
  });
  pipeline.push({ $match: { parsedDate: { $ne: null, $gte: start } } });
  pipeline.push({
    $project: {
      dayKey: {
        $dateToString: { format: "%Y-%m-%d", date: "$parsedDate" }
      },
      isPresent: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
    }
  });
  pipeline.push({
    $group: {
      _id: "$dayKey",
      total: { $sum: 1 },
      present: { $sum: "$isPresent" }
    }
  });
  pipeline.push({
    $project: {
      _id: 0,
      dayKey: "$_id",
      value: {
        $cond: [
          { $gt: ["$total", 0] },
          { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
          0
        ]
      }
    }
  });

  const agg = await Attendance.aggregate(pipeline);

  const valueByDayKey = new Map(agg.map((r) => [r.dayKey, r.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const result = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayKey = d.toISOString().slice(0, 10);
    result.push({
      day: weekday[d.getDay()],
      value: Number(valueByDayKey.get(dayKey) || 0)
    });
  }

  return result;
};

/** Same shape as getAttendanceDaily when there are no matching records (labels for last 5 local days). */
export const getEmptyAttendanceDailySeries = () => {
  const days = 5;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push({
      day: weekday[d.getDay()],
      value: 0
    });
  }
  return result;
};

export const getPerformanceOverview = async ({ studentId } = {}) => {
  const sid = toObjectId(studentId);
  const match = sid ? { student: sid } : {};
  if (sid) {
    const programIds = await resolveProgramSubjectIdsByStudentId(studentId);
    if (programIds.length) match.subject = { $in: programIds };
  }

  const agg = await Marks.aggregate([
    { $match: match },
    {
      $project: {
        subject: 1,
        percentage: {
          $multiply: [
            { $divide: ["$marksObtained", "$totalMarks"] },
            100
          ]
        }
      }
    },
    {
      $group: {
        _id: "$subject",
        avg: { $avg: "$percentage" },
        total: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [{ $gte: ["$percentage", 40] }, 1, 0]
          }
        }
      }
    }
  ]);

  const subjectIds = agg.map((a) => a._id).filter(Boolean);
  const subjects = await Subject.find({ _id: { $in: subjectIds } })
    .select("name")
    .lean();
  const nameById = new Map(subjects.map((s) => [String(s._id), s.name]));

  return agg
    .map((row) => {
      const subjectName =
        nameById.get(String(row._id)) || "Subject";
      const pass =
        row.total > 0 ? (row.passed / row.total) * 100 : 0;
      return {
        subject: subjectName,
        avg: Number(Number(row.avg || 0).toFixed(1)),
        pass: Number(Number(pass || 0).toFixed(1)),
        exams: Number(row.total || 0)
      };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
};

/**
 * Per subject: attendance % (from attendance records), avg exam score %, class and exam counts.
 * Admin: aggregated across all students. Student: scoped to that student.
 */
export const getSubjectWiseBreakdown = async ({ studentId } = {}) => {
  const sid = toObjectId(studentId);
  const programIds =
    sid && studentId ? await resolveProgramSubjectIdsByStudentId(studentId) : [];
  const attMatch = sid ? { student: sid } : {};
  const marksMatch = sid ? { student: sid } : {};
  if (sid && programIds.length) {
    attMatch.subject = { $in: programIds };
    marksMatch.subject = { $in: programIds };
  }

  const [attAgg, marksAgg] = await Promise.all([
    Attendance.aggregate([
      { $match: attMatch },
      {
        $group: {
          _id: "$subject",
          classesRecorded: {
            $sum: { $cond: [{ $ne: ["$status", "holiday"] }, 1, 0] }
          },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          classesRecorded: 1,
          attendancePercent: {
            $cond: [
              { $gt: ["$classesRecorded", 0] },
              {
                $multiply: [
                  { $divide: ["$present", "$classesRecorded"] },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ]),
    Marks.aggregate([
      { $match: marksMatch },
      {
        $project: {
          subject: 1,
          pct: {
            $multiply: [
              { $divide: ["$marksObtained", "$totalMarks"] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: "$subject",
          examCount: { $sum: 1 },
          avgScorePercent: { $avg: "$pct" }
        }
      },
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          examCount: 1,
          avgScorePercent: 1
        }
      }
    ])
  ]);

  const map = new Map();
  for (const r of attAgg) {
    if (!r.subjectId) continue;
    const k = String(r.subjectId);
    map.set(k, {
      subjectId: r.subjectId,
      classesRecorded: r.classesRecorded || 0,
      attendancePercent: Number(Number(r.attendancePercent).toFixed(1)),
      examCount: 0,
      avgScorePercent: null
    });
  }
  for (const r of marksAgg) {
    if (!r.subjectId) continue;
    const k = String(r.subjectId);
    const prev = map.get(k) || {
      subjectId: r.subjectId,
      classesRecorded: 0,
      attendancePercent: null,
      examCount: 0,
      avgScorePercent: null
    };
    prev.examCount = r.examCount || 0;
    prev.avgScorePercent = Number(Number(r.avgScorePercent).toFixed(1));
    map.set(k, prev);
  }

  const ids = [...map.values()].map((v) => v.subjectId).filter(Boolean);
  const subjects = await Subject.find({ _id: { $in: ids } })
    .select("name code")
    .lean();
  const nameById = new Map(
    subjects.map((s) => [
      String(s._id),
      (s.name && String(s.name).trim()) || s.code || "Subject"
    ])
  );

  return [...map.values()]
    .map((row) => ({
      subject: nameById.get(String(row.subjectId)) || "Subject",
      attendancePercent:
        row.classesRecorded > 0 ? row.attendancePercent : null,
      avgScorePercent:
        row.examCount > 0 ? row.avgScorePercent : null,
      classesRecorded: row.classesRecorded || 0,
      examCount: row.examCount || 0
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
};

export const getTeacherOverview = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).select("_id");
  if (!teacher) throw new Error("Teacher not found");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const todayAgg = await Attendance.aggregate([
    {
      $match: {
        teacher: teacher._id,
        date: { $gte: start, $lt: end }
      }
    },
    { $group: { _id: "$subject" } },
    { $count: "count" }
  ]);

  const todayClasses = todayAgg[0]?.count || 0;

  return {
    todayClasses: Number(todayClasses || 0),
    pendingAttendance: 0,
    pendingMarks: 0
  };
};

export const getStudentOverview = async (studentId) => {
  const sid = toObjectId(studentId);
  if (!sid) {
    throw new Error("Invalid student id");
  }

  const programIds = await resolveProgramSubjectIdsByStudentId(studentId);
  const attMatch = { student: sid };
  if (programIds.length) attMatch.subject = { $in: programIds };

  const att = await Attendance.aggregate([
    { $match: attMatch },
    {
      $group: {
        _id: null,
        total: {
          $sum: { $cond: [{ $ne: ["$status", "holiday"] }, 1, 0] }
        },
        present: {
          $sum: {
            $cond: [{ $eq: ["$status", "present"] }, 1, 0]
          }
        }
      }
    }
  ]);

  const sessionsTotal = Number(att[0]?.total || 0);
  const sessionsPresent = Number(att[0]?.present || 0);
  const attendancePercent =
    sessionsTotal > 0 ? (sessionsPresent / sessionsTotal) * 100 : 0;

  const marksMatch = { student: sid };
  if (programIds.length) marksMatch.subject = { $in: programIds };

  const marks = await Marks.aggregate([
    { $match: marksMatch },
    {
      $project: {
        percentage: {
          $multiply: [
            { $divide: ["$marksObtained", "$totalMarks"] },
            100
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$percentage" },
        examCount: { $sum: 1 }
      }
    }
  ]);

  const avgScore = Number(marks[0]?.avg || 0);
  const examCount = Number(marks[0]?.examCount || 0);

  return {
    attendancePercent,
    avgScore,
    sessionsTotal,
    sessionsPresent,
    examCount
  };
};

// Keep older exports for compatibility (if used elsewhere)
export const getStudentAnalytics = async (studentId) => {
  return getStudentOverview(studentId);
};

export const getClassAnalytics = async () => {
  return {
    totalStudents: 0,
    totalAttendanceRecords: 0,
    totalMarksRecords: 0
  };
};
