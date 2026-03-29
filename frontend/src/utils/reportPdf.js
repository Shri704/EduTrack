import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const HEAD_COLOR = [12, 30, 61];

function tableBlock(doc, title, headRow, bodyRows, startY) {
  if (title) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, startY);
    startY += 5;
  }
  doc.setFont("helvetica", "normal");
  const emptyRow =
    bodyRows.length > 0
      ? bodyRows
      : [headRow.map((_, i) => (i === 0 ? "No records" : "—"))];
  autoTable(doc, {
    startY: startY + 2,
    head: [headRow],
    body: emptyRow,
    styles: { fontSize: 7, cellPadding: 1.2, overflow: "linebreak" },
    headStyles: { fillColor: HEAD_COLOR, textColor: 255 },
    margin: { left: 14, right: 14 },
    showHead: "everyPage",
  });
  return doc.lastAutoTable.finalY + 8;
}

/**
 * Student: attendance + marks (detail tables).
 */
export function downloadStudentReportPdf({
  stamp,
  student,
  attendancePct,
  avgScore,
  attendanceHead,
  attendanceBody,
  marksHead,
  marksBody,
}) {
  const attCols = attendanceHead?.length || 0;
  const marksCols = marksHead?.length || 0;
  const useLandscape = attCols > 8 || marksCols > 6;
  const doc = new jsPDF(useLandscape ? { orientation: "landscape" } : {});
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("EduTrack — Student report", 14, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${stamp}`, 14, 22);
  const line = `Student: ${student?.name ?? "—"}  |  Roll: ${student?.rollNumber ?? "—"}  |  Email: ${student?.email ?? "—"}`;
  doc.text(line, 14, 28);
  doc.text(
    `Branch: ${student?.branch ?? "—"}  |  Semester: ${student?.semester ?? "—"}`,
    14,
    33
  );
  doc.text(
    `Attendance: ${Number(attendancePct || 0).toFixed(1)}%  |  Avg score: ${Number(avgScore || 0).toFixed(1)}%`,
    14,
    38
  );
  let y = tableBlock(
    doc,
    "Attendance",
    attendanceHead,
    attendanceBody,
    44
  );
  tableBlock(doc, "Marks", marksHead, marksBody, y);
  doc.save(`edutrack-student-report-${stamp}.pdf`);
}

/** Admin: summary table of all students */
export function downloadAdminSummaryPdf({
  stamp,
  metaLines,
  headRow,
  bodyRows,
  filenamePrefix = "edutrack-admin-summary",
}) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("EduTrack — Class report (summary)", 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let y = 20;
  for (const line of metaLines) {
    doc.text(line, 14, y);
    y += 5;
  }
  autoTable(doc, {
    startY: y + 2,
    head: [headRow],
    body:
      bodyRows.length > 0
        ? bodyRows
        : [headRow.map((_, i) => (i === 0 ? "No students" : "—"))],
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: HEAD_COLOR, textColor: 255 },
    margin: { left: 14, right: 14 },
    showHead: "everyPage",
  });
  doc.save(`${filenamePrefix}-${stamp}.pdf`);
}

/** Attendance matrix (by subject) or other wide admin attendance tables */
export function downloadAdminAttendanceDetailPdf({
  stamp,
  metaLines,
  headRow,
  bodyRows,
  title = "EduTrack — Attendance by subject (class)",
}) {
  const colCount = headRow?.length || 0;
  const tableFontSize =
    colCount > 16 ? 4.5 : colCount > 12 ? 5 : colCount > 8 ? 5.5 : 6.5;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let y = 18;
  for (const line of metaLines) {
    doc.text(line, 14, y);
    y += 4.5;
  }
  autoTable(doc, {
    startY: y + 2,
    head: [headRow],
    body:
      bodyRows.length > 0
        ? bodyRows
        : [headRow.map((_, i) => (i === 0 ? "No rows" : "—"))],
    styles: { fontSize: tableFontSize, cellPadding: 0.9, overflow: "linebreak" },
    headStyles: { fillColor: HEAD_COLOR, textColor: 255, fontSize: tableFontSize },
    margin: { left: 10, right: 10 },
    showHead: "everyPage",
  });
  doc.save(`edutrack-admin-attendance-by-subject-${stamp}.pdf`);
}

export function downloadAdminMarksDetailPdf({
  stamp,
  metaLines,
  headRow,
  bodyRows,
  title = "EduTrack — Marks by subject (class)",
}) {
  const colCount = headRow?.length || 0;
  const tableFontSize =
    colCount > 16 ? 4.5 : colCount > 12 ? 5 : colCount > 8 ? 5.5 : 6.5;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let y = 18;
  for (const line of metaLines) {
    doc.text(line, 14, y);
    y += 4.5;
  }
  autoTable(doc, {
    startY: y + 2,
    head: [headRow],
    body:
      bodyRows.length > 0
        ? bodyRows
        : [headRow.map((_, i) => (i === 0 ? "No rows" : "—"))],
    styles: {
      fontSize: tableFontSize,
      cellPadding: 0.9,
      overflow: "linebreak",
    },
    headStyles: { fillColor: HEAD_COLOR, textColor: 255, fontSize: tableFontSize },
    margin: { left: 10, right: 10 },
    showHead: "everyPage",
  });
  doc.save(`edutrack-admin-marks-by-subject-${stamp}.pdf`);
}
