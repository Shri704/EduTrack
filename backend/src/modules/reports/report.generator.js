import {
  attendanceRowsForPercentage,
  countPresentForStats
} from "../../utils/attendanceStats.js";

export const generateStudentReport = (
  student,
  marks,
  attendance,
  programSubjects = []
) => {
  const totalObtained = marks.reduce(
    (sum, m) => sum + (m.marksObtained ?? m.score ?? 0),
    0
  );
  const totalMax = marks.reduce((sum, m) => sum + (m.totalMarks ?? 100), 0);
  const averageMarks = marks.length ? totalObtained / marks.length : 0;
  const averagePercent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

  const totalClasses = attendanceRowsForPercentage(attendance).length;
  const presentClasses = countPresentForStats(attendance);
  const attendancePercent = totalClasses
    ? (presentClasses / totalClasses) * 100
    : 0;

  return {
    student,
    averageMarks: Number(averageMarks.toFixed(2)),
    averagePercent: Number(averagePercent.toFixed(2)),
    /** Alias for clients that expect `averageScore` as a percentage */
    averageScore: Number(averagePercent.toFixed(2)),
    attendancePercent: Number(attendancePercent.toFixed(2)),
    classesTaken: totalClasses,
    classesAttended: presentClasses,
    marks,
    attendance,
    /** Subjects in the student's program (course + semester) for export gaps */
    programSubjects: Array.isArray(programSubjects) ? programSubjects : []
  };
};