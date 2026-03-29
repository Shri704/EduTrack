import mongoose from "mongoose";
import Marks from "./marks.model.js";

const toOid = (id) =>
  id && mongoose.Types.ObjectId.isValid(String(id))
    ? new mongoose.Types.ObjectId(String(id))
    : id;

/**
 * Additional IA is allowed only if the student does not have both 1st and 2nd IA
 * (from this request and/or already stored for this subject).
 */
async function assertAdditionalIaAllowed(studentId, subjectOid, row) {
  const stud = toOid(studentId);
  let has1 = Number.isFinite(row.ia1);
  let has2 = Number.isFinite(row.ia2);
  if (!has1 || !has2) {
    const existing = await Marks.find({
      student: stud,
      subject: subjectOid,
      examType: { $in: ["ia1", "ia2"] }
    })
      .select("examType")
      .lean();
    if (!has1) has1 = existing.some((e) => e.examType === "ia1");
    if (!has2) has2 = existing.some((e) => e.examType === "ia2");
  }
  if (has1 && has2) {
    throw new Error(
      "Additional IA is only allowed when the student has not completed both 1st IA and 2nd IA."
    );
  }
}

const gradeForPercentage = (pct) => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

/**
 * Upsert one marks row per (student, subject, examType) so teachers can
 * upload IA1, IA2, or Additional IA separately without duplicating earlier IAs.
 */
export const createMarksBulk = async ({
  subjectId,
  teacherId,
  examType,
  totalMarks,
  rows,
  examDate
}) => {
  const subjectOid = toOid(subjectId);
  const teacherOid = teacherId ? toOid(teacherId) : undefined;
  const total = Number(totalMarks);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("totalMarks must be a positive number");
  }

  const ed = examDate ? new Date(examDate) : new Date();

  const upsertOne = (studentId, typeKey, obtained) => {
    if (!Number.isFinite(obtained)) return;
    if (obtained < 0 || obtained > total) {
      throw new Error(
        `Marks must be between 0 and ${total} (got ${obtained} for ${typeKey})`
      );
    }
    const stud = toOid(studentId);
    const filter = {
      student: stud,
      subject: subjectOid,
      examType: typeKey
    };
    const pct = (obtained / total) * 100;
    const setDoc = {
      student: stud,
      subject: subjectOid,
      examType: typeKey,
      marksObtained: obtained,
      totalMarks: total,
      grade: gradeForPercentage(pct),
      examDate: ed
    };
    if (teacherOid) setDoc.teacher = teacherOid;

    return {
      updateOne: {
        filter,
        update: { $set: setDoc },
        upsert: true
      }
    };
  };

  const ops = [];

  for (const r of rows) {
    const sid = r.studentId || r.student;
    if (!sid) throw new Error("Each row must include studentId");

    const hasAnyIa =
      Number.isFinite(r.ia1) ||
      Number.isFinite(r.ia2) ||
      Number.isFinite(r.additionalIA);

    if (hasAnyIa) {
      const o1 = upsertOne(sid, "ia1", r.ia1);
      const o2 = upsertOne(sid, "ia2", r.ia2);
      if (Number.isFinite(r.additionalIA)) {
        await assertAdditionalIaAllowed(sid, subjectOid, r);
      }
      const o3 = upsertOne(sid, "additionalIA", r.additionalIA);
      if (o1) ops.push(o1);
      if (o2) ops.push(o2);
      if (o3) ops.push(o3);
      continue;
    }

    if (!examType) throw new Error("examType is required");
    const obt = r.marksObtained;
    if (!Number.isFinite(obt)) {
      throw new Error("marksObtained is required for non-IA uploads");
    }
    const op = upsertOne(sid, examType, obt);
    if (op) ops.push(op);
  }

  if (ops.length === 0) {
    throw new Error("No marks provided — enter at least one IA score or marks value");
  }

  const result = await Marks.bulkWrite(ops, { ordered: true });

  const studentIds = new Set();
  for (const r of rows) {
    const sid = r.studentId || r.student;
    if (sid) studentIds.add(String(sid));
  }
  const { notifyStudentAttendanceIaRisk } = await import(
    "../../jobs/attendanceAlerts.js"
  );
  for (const id of studentIds) {
    notifyStudentAttendanceIaRisk(id).catch((err) =>
      console.error("notifyStudentAttendanceIaRisk:", err?.message)
    );
  }

  return result;
};

export const getStudentMarks = async (studentId, { subjectId } = {}) => {
  const query = { student: studentId };
  if (subjectId) query.subject = subjectId;
  return Marks.find(query)
    .populate("subject", "name code")
    .populate({
      path: "teacher",
      populate: { path: "user", select: "firstName lastName email" }
    })
    .sort({ examDate: -1, createdAt: -1 });
};

export const getClassMarks = async (subjectId, { examType } = {}) => {
  const query = { subject: subjectId };
  if (examType) query.examType = examType;
  return Marks.find(query)
    .populate("student", "name rollNumber email branch semester")
    .populate("subject", "name code")
    .sort({ examDate: -1, createdAt: -1 });
};
