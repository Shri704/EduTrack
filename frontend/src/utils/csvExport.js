/**
 * Normalize API/JSON dates to YYYY-MM-DD (UTC calendar day).
 * Handles ISO strings, Date, and rare { $date: "..." } shapes.
 */
export function formatDateYMD(value) {
  if (value == null || value === "") return "";
  let v = value;
  if (typeof v === "object" && v !== null && "$date" in v) {
    v = v.$date;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Excel often auto-formats YYYY-MM-DD as a date; narrow columns show #####.
 * Emits a formula so the cell displays that exact text (not a serial number).
 */
export function ymdForExcelCsvCell(ymd) {
  if (ymd == null || ymd === "") return "";
  const s = String(ymd).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return `="${s.replace(/"/g, '""')}"`;
}

/** Force literal text in Excel (avoids stray columns / bad parsing for names with commas, etc.). */
export function excelTextCsvCell(text) {
  if (text == null) return "";
  const s = String(text);
  if (s === "") return "";
  return `="${s.replace(/"/g, '""')}"`;
}

/** Escape one CSV cell */
function cell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headerRow, dataRows) {
  const lines = [
    headerRow.map(cell).join(","),
    ...dataRows.map((row) => row.map(cell).join(",")),
  ];
  return lines.join("\r\n");
}

export function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
