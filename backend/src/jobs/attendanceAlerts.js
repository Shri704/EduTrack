import Marks from "../modules/performance/marks.model.js";
import Notification from "../modules/notifications/notification.model.js";
import Student from "../modules/students/student.model.js";
import User from "../modules/users/user.model.js";
import { getProgramAttendanceSummaryForStudent } from "../modules/attendance/attendance.service.js";

const ATTENDANCE_THRESHOLD = 75;
/** Raw marks obtained (1st / 2nd IA) at or below this count as "low" for alerts. */
const IA_LOW_MARK_THRESHOLD = 11;
const DEDUPE_HOURS = 48;

/**
 * Send in-app notification when BOTH:
 * - Program-subject attendance % is below ATTENDANCE_THRESHOLD, and
 * - Student has at least one IA1 or IA2 record with marksObtained <= IA_LOW_MARK_THRESHOLD.
 */
export async function notifyStudentAttendanceIaRisk(studentId) {
  if (!studentId) return false;

  const { total, percentage } = await getProgramAttendanceSummaryForStudent(
    studentId
  );
  if (!total || total <= 0) return false;
  if (percentage >= ATTENDANCE_THRESHOLD) return false;

  const lowIa = await Marks.findOne({
    student: studentId,
    examType: { $in: ["ia1", "ia2"] },
    marksObtained: { $lte: IA_LOW_MARK_THRESHOLD }
  })
    .select("_id")
    .lean();
  if (!lowIa) return false;

  const student = await Student.findById(studentId)
    .select("email name")
    .lean();
  if (!student?.email) return false;

  const user = await User.findOne({
    email: String(student.email).toLowerCase().trim()
  }).select("_id");
  if (!user) return false;

  const dedupeSince = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000);
  const recent = await Notification.findOne({
    recipient: user._id,
    type: "attendance_ia_alert",
    createdAt: { $gte: dedupeSince }
  })
    .select("_id")
    .lean();
  if (recent) return false;

  const pctStr = Number(percentage).toFixed(1);
  await Notification.create({
    recipient: user._id,
    title: "Attendance and IA performance alert",
    message: `Your attendance is ${pctStr}% (below ${ATTENDANCE_THRESHOLD}%), and at least one 1st or 2nd IA score is ${IA_LOW_MARK_THRESHOLD} or below. Please contact your teacher or advisor.`,
    type: "attendance_ia_alert",
    link: "/student/attendance"
  });

  return true;
}

/**
 * Daily job: evaluate all students for combined low attendance + low IA marks.
 */
export async function checkLowAttendance() {
  try {
    const students = await Student.find().select("_id").lean();
    let notified = 0;
    for (const { _id } of students) {
      try {
        if (await notifyStudentAttendanceIaRisk(_id)) notified += 1;
      } catch (e) {
        console.error("Attendance/IA alert failed for student", _id, e?.message);
      }
    }
    console.log(
      `Attendance + IA risk alerts checked; ${notified} notification(s) created.`
    );
  } catch (error) {
    console.error(error);
  }
}
