import {
  attendanceRowsForPercentage,
  countPresentForStats
} from "../../utils/attendanceStats.js";

export const calculateAttendanceRate = (attendanceRecords) => {
  const rows = attendanceRowsForPercentage(attendanceRecords || []);
  const total = rows.length;
  const present = countPresentForStats(attendanceRecords || []);

  return {
    totalClasses: total,
    present,
    percentage: total ? (present / total) * 100 : 0
  };
};

export const calculateAverageMarks = (marks) => {
  if (!marks.length) return 0;

  const total = marks.reduce((sum, m) => sum + m.score, 0);

  return total / marks.length;
};

export const detectRiskStudent = (attendancePercent, avgMarks) => {
  if (attendancePercent < 75 || avgMarks < 40) {
    return true;
  }

  return false;
};