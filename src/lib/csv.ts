/**
 * CSV serialisation for admin exports (the product requirements).
 *
 * RFC 4180 quoting, CRLF line endings and a UTF-8 BOM so Excel opens Arabic text correctly. The
 * caller supplies already-flattened cells; this module never reads the database.
 */

export type CsvCell = string | number | null | undefined;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
