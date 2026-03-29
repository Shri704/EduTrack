/** Single-letter code for grids and compact UIs (holiday → H). */
export function attendanceStatusLetter(status) {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "present") return "P";
  if (s === "late") return "L";
  if (s === "absent") return "A";
  if (s === "holiday") return "H";
  return "—";
}

export function attendanceStatusTitle(status) {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "present") return "Present";
  if (s === "late") return "Late";
  if (s === "absent") return "Absent";
  if (s === "holiday") return "Holiday";
  return "Unknown";
}
