/** CSV helpers. Cells are quoted and guarded against spreadsheet formula injection. */

function cell(value) {
  if (value === null || value === undefined) return '';
  let text = Array.isArray(value) ? value.join('; ') : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns, rows) {
  const header = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => cell(c.value(row))).join(',')).join('\r\n');
  // BOM so Excel opens UTF-8 names correctly.
  return `﻿${header}\r\n${body}\r\n`;
}
