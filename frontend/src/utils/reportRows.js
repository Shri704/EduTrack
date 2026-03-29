import {
  excelTextCsvCell,
  formatDateYMD,
  ymdForExcelCsvCell,
} from "./csvExport.js";
import { attendanceRowsForPercentage } from "./attendanceStats.js";

export function subjectLabel(row) {
  const s = row?.subject;
  if (s && typeof s === "object") {
    const name = s.name || "";
    const code = s.code || "";
    if (name && code) return `${name} (${code})`;
    return name || code || "—";
  }
  if (typeof s === "string") return s;
  return "—";
}

export function subjectCode(row) {
  const s = row?.subject;
  if (s && typeof s === "object" && s.code) return String(s.code);
  return "";
}

/** Subject name only (first Subject column in marks CSV). */
export function subjectNameOnly(row) {
  const s = row?.subject;
  if (s && typeof s === "object") {
    const n = String(s.name ?? "").trim();
    if (n) return n;
  }
  const lab = subjectLabel(row);
  if (lab && lab !== "—") {
    const m = lab.match(/^(.+?)\s*\([^)]+\)\s*$/);
    if (m) return m[1].trim();
    return lab;
  }
  return "";
}

function getMarksRecordTime(m) {
  const u = m?.updatedAt ?? m?.updated_at;
  if (u) {
    const t = new Date(u).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const ex = m?.examDate;
  if (ex) {
    const t = new Date(ex).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function pickLatestIaMark(current, next) {
  if (!next) return current;
  if (!current) return next;
  const ta = new Date(current.examDate || current.updatedAt || 0).getTime();
  const tb = new Date(next.examDate || next.updatedAt || 0).getTime();
  return tb >= ta ? next : current;
}

function iaScoreDisplayString(m) {
  if (!m) return "";
  const ob = Number(m.marksObtained);
  const tot = Number(m.totalMarks);
  if (Number.isFinite(ob) && Number.isFinite(tot)) return `${ob}/${tot}`;
  return "";
}

/** Latest IA1 / IA2 per subject group (same student × subject). */
function iaCellsFromMarkGroup(grp) {
  let ia1 = null;
  let ia2 = null;
  for (const m of grp) {
    const t = m.examType;
    if (t === "ia1") ia1 = pickLatestIaMark(ia1, m);
    else if (t === "ia2") ia2 = pickLatestIaMark(ia2, m);
  }
  return [iaScoreDisplayString(ia1), iaScoreDisplayString(ia2)];
}

/** Cells after Sl no (and after Roll/Name/Email when `includeStudent`). */
function buildMarksWideTail(grp, excelCsv = false) {
  let sumOb = 0;
  let sumTot = 0;
  let maxT = 0;
  for (const m of grp) {
    const ob = Number(m.marksObtained);
    const tot = Number(m.totalMarks);
    if (Number.isFinite(ob)) sumOb += ob;
    if (Number.isFinite(tot)) sumTot += tot;
    maxT = Math.max(maxT, getMarksRecordTime(m));
  }

  const first = grp[0];
  const label = subjectLabel(first);
  const subjCell = excelCsv ? excelTextCsvCell(label) : label;
  const lastUpYmd = maxT > 0 ? formatDateYMD(new Date(maxT)) : "";
  const lastUp =
    !lastUpYmd ? "" : excelCsv ? ymdForExcelCsvCell(lastUpYmd) : lastUpYmd;
  const [ia1, ia2] = iaCellsFromMarkGroup(grp);

  return [subjCell, ia1, ia2, sumOb, sumTot, lastUp];
}

export const MARKS_CSV_HEAD_STUDENT = [
  "Sl no",
  "Subject",
  "IA1",
  "IA2",
  "Obtained marks",
  "Total marks",
  "Last updated date",
];

export const MARKS_CSV_HEAD_ADMIN = [
  "Sl no",
  "Roll no",
  "Name",
  "Email",
  "Subject",
  "IA1",
  "IA2",
  "Obtained marks",
  "Total marks",
  "Last updated date",
];

/** One row per subject: IA1/IA2 from latest ia1/ia2 records; obtained/total sums all exam rows. */
export function buildStudentMarksWideRows(marks, options = {}) {
  const excelCsv = options.excelCsv === true;
  const map = new Map();
  for (const m of marks || []) {
    const subj = String(m.subject?._id ?? m.subject ?? subjectLabel(m));
    if (!map.has(subj)) map.set(subj, []);
    map.get(subj).push(m);
  }
  const groups = [...map.values()].sort((ga, gb) =>
    subjectLabel(ga[0]).localeCompare(subjectLabel(gb[0]))
  );
  return groups.map((grp, i) => [
    i + 1,
    ...buildMarksWideTail(grp, excelCsv),
  ]);
}

function compareStudentThenSubject(a, b) {
  const ra = String(a.student?.rollNumber ?? "");
  const rb = String(b.student?.rollNumber ?? "");
  if (ra !== rb) return ra.localeCompare(rb, undefined, { numeric: true });
  return subjectLabel(a).localeCompare(subjectLabel(b));
}

/** One row per student × subject for class exports. */
export function buildAdminMarksWideRows(flat, options = {}) {
  const excelCsv = options.excelCsv === true;
  const map = new Map();
  for (const m of flat || []) {
    const sid = String(m.student?._id ?? m.student ?? "");
    const subj = String(m.subject?._id ?? m.subject ?? subjectLabel(m));
    const key = `${sid}\t${subj}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  const groups = [...map.values()].sort((ga, gb) =>
    compareStudentThenSubject(ga[0], gb[0])
  );
  return groups.map((grp, i) => {
    const st = grp[0].student ?? {};
    return [
      i + 1,
      st.rollNumber ?? "",
      st.name ?? "",
      st.email ?? "",
      ...buildMarksWideTail(grp, excelCsv),
    ];
  });
}

function buildMarksExportSubjectMetas(flat) {
  const byId = new Map();
  for (const m of flat || []) {
    const id = m.subject?._id != null ? String(m.subject._id) : "";
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      id,
      label: subjectLabel(m),
      code: subjectCode(m),
    });
  }
  return [...byId.values()].sort((x, y) => x.label.localeCompare(y.label));
}

function formatMarksSubjectCell(grp, excelCsv) {
  if (!grp?.length) return "—";
  const tail = buildMarksWideTail(grp, excelCsv);
  const [, ia1, ia2, sumOb, sumTot, lastUp] = tail;
  const ob = Number(sumOb);
  const tot = Number(sumTot);
  const pct =
    Number.isFinite(ob) && Number.isFinite(tot) && tot > 0
      ? ((ob / tot) * 100).toFixed(1)
      : "—";
  if (excelCsv) {
    return `IA1:${ia1 || "—"} | IA2:${ia2 || "—"} | ${sumOb}/${sumTot} (${pct}%) | ${lastUp}`;
  }
  return `IA1: ${ia1 || "—"}\nIA2: ${ia2 || "—"}\nTotal: ${sumOb}/${sumTot}\n${pct}%\nUpd: ${lastUp}`;
}

function studentsFromFlatMarksOnly(flat) {
  const byId = new Map();
  for (const m of flat || []) {
    const st = m.student;
    const sid = st?._id != null ? String(st._id) : "";
    if (!sid || byId.has(sid)) continue;
    byId.set(sid, st);
  }
  return [...byId.values()].sort((a, b) => compareRoll(a, b));
}

/**
 * Admin marks export: one row per student, one column per subject.
 * @param {object} [options]
 * @param {Array} [options.cohortStudents] Full class from report API (includes students with no marks).
 * @param {boolean} [options.excelCsv] Single-line cells for CSV.
 */
export function buildAdminMarksMatrix(flat, options = {}) {
  const cohortStudents = options.cohortStudents;
  const excelCsv = options.excelCsv === true;
  const subjects = buildMarksExportSubjectMetas(flat || []);

  const byStudent = new Map();
  for (const m of flat || []) {
    const sid = String(m.student?._id ?? "");
    const subjId = String(m.subject?._id ?? "");
    if (!sid || !subjId) continue;
    if (!byStudent.has(sid)) byStudent.set(sid, new Map());
    const subMap = byStudent.get(sid);
    if (!subMap.has(subjId)) subMap.set(subjId, []);
    subMap.get(subjId).push(m);
  }

  let students;
  if (Array.isArray(cohortStudents) && cohortStudents.length > 0) {
    students = [...cohortStudents].sort((a, b) => compareRoll(a, b));
  } else {
    students = studentsFromFlatMarksOnly(flat);
  }

  const headRow = [
    "Sl.",
    "Roll no",
    "Name",
    "Email",
    ...subjects.map((s) =>
      excelCsv
        ? String(s.label || "").trim() || subjectHeaderShort(s)
        : subjectHeaderShort(s)
    ),
  ];

  const bodyRows = students.map((st, i) => {
    const sid = String(st._id ?? "");
    const subMap = byStudent.get(sid);
    const cells = subjects.map((sub) => {
      const grp = subMap?.get(sub.id);
      return formatMarksSubjectCell(grp, excelCsv);
    });
    return [
      i + 1,
      st.rollNumber ?? "",
      st.name ?? "",
      st.email ?? "",
      ...cells,
    ];
  });

  return { headRow, bodyRows, subjects };
}

function displaySubjectEntry(sub) {
  const name = String(sub?.name ?? "").trim();
  const code = String(sub?.code ?? "").trim();
  if (name && code) return `${name} (${code})`;
  return name || code || "Subject";
}

/** Ordered subjects: program list first, then any extra IDs from attendance. */
function buildAttendanceExportSubjectMetas(attendance, programSubjects = []) {
  const byId = new Map();
  const prog = Array.isArray(programSubjects) ? programSubjects : [];
  for (const sub of prog) {
    const id = sub._id != null ? String(sub._id) : "";
    if (!id) continue;
    byId.set(id, { id, label: displaySubjectEntry(sub) });
  }
  for (const a of attendance || []) {
    const id = a.subject?._id != null ? String(a.subject._id) : "";
    if (!id || byId.has(id)) continue;
    byId.set(id, { id, label: subjectLabel(a) });
  }
  return [...byId.values()].sort((x, y) => x.label.localeCompare(y.label));
}

/** Calendar days from earliest to latest attendance date (inclusive). */
function buildAttendanceDateRangeRows(attendance) {
  const keys = new Set();
  for (const a of attendance || []) {
    const k = formatDateYMD(a.date);
    if (k) keys.add(k);
  }
  if (keys.size === 0) return [];
  const sorted = [...keys].sort();
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const out = [];
  const cur = new Date(`${min}T12:00:00`);
  const end = new Date(`${max}T12:00:00`);
  while (cur <= end) {
    out.push(formatDateYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Overall % for one subject from all rows in `attendance` (present / total sessions). */
function subjectAttendancePercentString(attendance, subjectId) {
  const rows = attendanceRowsForPercentage(
    (attendance || []).filter(
      (a) => String(a.subject?._id ?? "") === subjectId
    )
  );
  if (!rows.length) return "";
  const tot = rows.length;
  const pres = rows.filter((r) => r.status === "present").length;
  return tot > 0 ? `${((pres / tot) * 100).toFixed(2)}%` : "";
}

function statusForCsv(status) {
  const s = String(status ?? "").toLowerCase().trim();
  if (!s) return "";
  if (s === "holiday") return "H";
  if (s === "present") return "present";
  if (s === "absent") return "absent";
  if (s === "late") return "late";
  return s;
}

/**
 * Student attendance CSV: one row per day; for each subject — name, that day’s status,
 * overall attendance % for that subject (full export window / all loaded records).
 */
export function buildStudentAttendanceWideExport(
  attendance,
  programSubjects = [],
  options = {}
) {
  const excelCsv = options.excelCsv === true;
  const subjects = buildAttendanceExportSubjectMetas(attendance, programSubjects);
  const dateRows = buildAttendanceDateRangeRows(attendance);
  const statusByDateSubject = new Map();
  for (const a of attendance || []) {
    const d = formatDateYMD(a.date);
    const sid = a.subject?._id != null ? String(a.subject._id) : "";
    if (!d || !sid) continue;
    statusByDateSubject.set(`${d}\t${sid}`, a.status ?? "");
  }

  const head = ["Sl no", "Date (YYYY-MM-DD)"];
  subjects.forEach((s, idx) => {
    const n = idx + 1;
    head.push(`Subject ${n}`, `Subject ${n} status (that day)`, `Subject ${n} attendance % (subject total)`);
  });

  const pctBySubject = new Map(
    subjects.map((s) => [s.id, subjectAttendancePercentString(attendance, s.id)])
  );

  let body = dateRows.map((d, i) => {
    const dateCell = excelCsv ? ymdForExcelCsvCell(d) : d;
    const row = [i + 1, dateCell];
    for (const s of subjects) {
      const daySt = statusByDateSubject.get(`${d}\t${s.id}`);
      const nameCell = excelCsv ? excelTextCsvCell(s.label) : s.label;
      row.push(nameCell, statusForCsv(daySt), pctBySubject.get(s.id) ?? "");
    }
    return row;
  });

  if (body.length === 0 && subjects.length > 0) {
    body = [
      [
        1,
        "—",
        ...subjects.flatMap((s) => [
          s.label,
          "no attendance recorded",
          pctBySubject.get(s.id) ?? ""
        ])
      ]
    ];
  }

  return { head, body };
}


export function pctMarks(m) {
  const ob = Number(m.marksObtained);
  const tot = Number(m.totalMarks);
  if (!Number.isFinite(ob) || !Number.isFinite(tot) || tot <= 0) return "—";
  return `${((ob / tot) * 100).toFixed(1)}%`;
}

export function formatDayForUi(d) {
  const ymd = formatDateYMD(d);
  if (!ymd) return "—";
  const [y, mo, day] = ymd.split("-");
  const dt = new Date(Number(y), Number(mo) - 1, Number(day), 12, 0, 0);
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ─── Admin class report exports ─── */

export const ADMIN_SUMMARY_HEAD = [
  "Sl. No.",
  "Roll no",
  "Name",
  "Email",
  "Branch",
  "Semester",
  "Classes taken",
  "Attended",
  "Attendance %",
  "Avg score %",
];

export function buildAdminStudentSummaryRows(results) {
  return (results || []).map((r, i) => [
    i + 1,
    r.student?.rollNumber ?? "",
    r.student?.name ?? "",
    r.student?.email ?? "",
    r.student?.branch ?? "",
    String(r.student?.semester ?? ""),
    r.classesTaken ?? "",
    r.classesAttended ?? "",
    r.attendancePercent != null
      ? Number(r.attendancePercent).toFixed(2)
      : "",
    r.averagePercent != null ? Number(r.averagePercent).toFixed(2) : "",
  ]);
}

export const ADMIN_ATT_FLAT_HEAD = [
  "Sl. No.",
  "Date (YYYY-MM-DD)",
  "Roll no",
  "Name",
  "Email",
  "Subject",
  "Subject code",
  "Status",
  "Remarks",
];

export function buildAdminFlatAttendanceRows(flat, options = {}) {
  const excelCsv = options.excelCsv === true;
  return (flat || []).map((a, i) => {
    const ymd = formatDateYMD(a.date);
    const dateCell = excelCsv && ymd ? ymdForExcelCsvCell(ymd) : ymd;
    const subj = subjectLabel(a);
    const subjCell = excelCsv ? excelTextCsvCell(subj) : subj;
    return [
      i + 1,
      dateCell,
      a.student?.rollNumber ?? "",
      a.student?.name ?? "",
      a.student?.email ?? "",
      subjCell,
      subjectCode(a),
      String(a.status ?? "").toLowerCase() === "holiday" ? "H" : (a.status ?? ""),
      String(a.remarks ?? "").replace(/\r?\n/g, " ").trim(),
    ];
  });
}

function compareRoll(a, b) {
  const ar = String(a?.rollNumber ?? "").trim();
  const br = String(b?.rollNumber ?? "").trim();
  const an = Number.parseInt(ar, 10);
  const bn = Number.parseInt(br, 10);
  const aNum = Number.isFinite(an) && String(an) === ar;
  const bNum = Number.isFinite(bn) && String(bn) === br;
  if (aNum && bNum) return an - bn;
  return ar.localeCompare(br, undefined, { numeric: true, sensitivity: "base" });
}

function subjectHeaderShort(meta) {
  const c = String(meta.code ?? "").trim();
  if (c) return c.length > 14 ? `${c.slice(0, 12)}…` : c;
  const lab = String(meta.label ?? "").trim();
  return lab.length > 16 ? `${lab.slice(0, 14)}…` : lab;
}

function countStatus(status) {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "holiday") return { p: 0, a: 0, l: 0, h: 1 };
  if (s === "present") return { p: 1, a: 0, l: 0, h: 0 };
  if (s === "absent") return { p: 0, a: 1, l: 0, h: 0 };
  if (s === "late") return { p: 0, a: 0, l: 1, h: 0 };
  return { p: 0, a: 0, l: 0, h: 0 };
}

/**
 * Admin attendance PDF/CSV matrix: one row per student, one column per subject.
 * Each cell: Present / Absent / Late counts, classes held, classes attended, %.
 * Trailing columns: total held, total attended, overall % (across subjects in export).
 *
 * @param {object} [options]
 * @param {Array<{_id?: unknown, rollNumber?: string, name?: string, email?: string}>} [options.cohortStudents]
 *   When set (e.g. full class from report API), every student appears even with zero attendance rows in `flat`.
 * @param {boolean} [options.excelCsv] If true, subject cells use one line (pipe-separated) for CSV exports.
 */
export function buildAdminAttendanceMatrix(flat, options = {}) {
  const cohortStudents = options.cohortStudents;
  const excelCsv = options.excelCsv === true;
  const subjects = buildAttendanceExportSubjectMetas(flat || [], []);
  const byStudent = new Map();
  for (const rec of flat || []) {
    const st = rec.student;
    const sid = st?._id != null ? String(st._id) : "";
    if (!sid) continue;
    if (!byStudent.has(sid)) {
      byStudent.set(sid, {
        student: st,
        bySubject: new Map(),
      });
    }
    const subjId = rec.subject?._id != null ? String(rec.subject._id) : "";
    if (!subjId) continue;
    const bucket = byStudent.get(sid);
    if (!bucket.bySubject.has(subjId)) {
      bucket.bySubject.set(subjId, {
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
        total: 0
      });
    }
    const cell = bucket.bySubject.get(subjId);
    const { p, a: absentN, l, h } = countStatus(rec.status);
    if (h) {
      cell.holiday += h;
    } else {
      cell.present += p;
      cell.absent += absentN;
      cell.late += l;
      cell.total += 1;
    }
  }

  let students;
  if (Array.isArray(cohortStudents) && cohortStudents.length > 0) {
    students = [...cohortStudents]
      .sort((a, b) => compareRoll(a, b))
      .map((st) => {
        const sid = st?._id != null ? String(st._id) : "";
        if (!sid) return null;
        const fromFlat = byStudent.get(sid);
        if (fromFlat) return fromFlat;
        return { student: st, bySubject: new Map() };
      })
      .filter(Boolean);
  } else {
    students = [...byStudent.values()].sort((x, y) =>
      compareRoll(x.student, y.student)
    );
  }

  const headRow = [
    "Sl.",
    "Roll no",
    "Name",
    "Email",
    ...subjects.map((s) =>
      excelCsv ? String(s.label || "").trim() || subjectHeaderShort(s) : subjectHeaderShort(s)
    ),
    "Total classes (held)",
    "Total attended",
    "Overall att %",
  ];

  const bodyRows = students.map((row, i) => {
    const sid = String(row.student?._id ?? "");
    const cells = [];
    let sumHeld = 0;
    let sumAtt = 0;
    for (const sub of subjects) {
      const agg = row.bySubject.get(sub.id);
      if (!agg) {
        cells.push("—");
        continue;
      }
      if (agg.total === 0 && !(agg.holiday > 0)) {
        cells.push("—");
        continue;
      }
      if (agg.total === 0 && agg.holiday > 0) {
        const hol = agg.holiday;
        cells.push(
          excelCsv
            ? `H:${hol} (holiday — not counted in %)`
            : `H:${hol}\nHoliday only\n(not in %)`
        );
        continue;
      }
      const attended = agg.present + agg.late;
      const pct =
        agg.total > 0 ? ((attended / agg.total) * 100).toFixed(1) : "0.0";
      const hol = agg.holiday || 0;
      sumHeld += agg.total;
      sumAtt += attended;
      cells.push(
        excelCsv
          ? `P:${agg.present} A:${agg.absent} L:${agg.late} H:${hol} | Held:${agg.total} | Att:${attended} | ${pct}%`
          : `P:${agg.present} A:${agg.absent} L:${agg.late} H:${hol}\nHeld:${agg.total} Att:${attended}\n${pct}%`
      );
    }
    const overallPct =
      sumHeld > 0 ? ((sumAtt / sumHeld) * 100).toFixed(1) : "—";
    return [
      i + 1,
      row.student?.rollNumber ?? "",
      row.student?.name ?? "",
      row.student?.email ?? "",
      ...cells,
      String(sumHeld),
      String(sumAtt),
      overallPct === "—" ? "—" : `${overallPct}%`,
    ];
  });

  return { headRow, bodyRows, subjects };
}

