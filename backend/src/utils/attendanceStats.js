/** Rows that count toward held classes (holiday excluded from %). */
export function attendanceRowsForPercentage(rows) {
  return (rows || []).filter((r) => r?.status !== "holiday");
}

export function countPresentForStats(rows) {
  return attendanceRowsForPercentage(rows).filter((r) => r?.status === "present")
    .length;
}

export function countAttendedForStats(rows) {
  const base = attendanceRowsForPercentage(rows);
  return base.filter(
    (r) => r?.status === "present" || r?.status === "late"
  ).length;
}
