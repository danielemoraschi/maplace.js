import { RENAMED_FIELDS } from "./builder-fields.ts";
import { PasteRefused, type Report, shortened } from "./builder-report.ts";

type CsvRecord = Record<string, unknown>;

/** The fields a column can fill, under their own name or a location's other names for them. */
const READ_COLUMNS: ReadonlySet<string> = new Set([
  "lat",
  "lng",
  "id",
  "title",
  "html",
  "icon",
  "zoom",
  "group",
  "tags",
]);

const NUMBER_COLUMNS: ReadonlySet<string> = new Set(["lat", "lng", "zoom"]);

const BOM = String.fromCodePoint(0xfeff);

/** What can part a header's cells, the first winning a tie: a spreadsheet's paste has tabs. */
const DELIMITERS = ["\t", ";", ","] as const;

/** The records of the CSV `text`, whose header row names its columns. */
export function recordsFromCsv(text: string, report: Report): CsvRecord[] {
  const cleaned = (text.startsWith(BOM) ? text.slice(1) : text).replaceAll("\r\n", "\n");
  const firstLine = cleaned.trimStart().split("\n", 1)[0] ?? "";
  const [headerRow, ...rows] = rowsOf(cleaned, delimiterOf(firstLine));
  const header = (headerRow ?? []).map((column) => column.trim().toLowerCase());
  const fields = fieldsOfHeader(header, report);
  if (!fields.includes("lat") || !fields.includes("lng")) {
    throw new PasteRefused(
      `A CSV needs a header row naming lat and lng; this one starts with ${shortened(firstLine)}`,
    );
  }
  for (const column of header) {
    if (fieldOfColumn(column) === undefined && column !== "") {
      report.note(column, "isn't a column this page reads");
    }
  }
  if (rows.length === 0) throw new PasteRefused("This CSV has a header row and no rows under it");
  return rows.map((row, index) => recordOfRow(fields, row, index + 2));
}

/** The field of each column; a second column for one field is reported and fills none. */
function fieldsOfHeader(header: readonly string[], report: Report): (string | undefined)[] {
  const used = new Set<string>();
  return header.map((column) => {
    const field = fieldOfColumn(column);
    if (field === undefined) return undefined;
    if (used.has(field)) {
      report.note(column, `fills ${field}, as a column before it does, so it was left out`);
      return undefined;
    }
    used.add(field);
    return field;
  });
}

/** The field `column` fills, if it is one this page reads. */
function fieldOfColumn(column: string): string | undefined {
  const field = Object.hasOwn(RENAMED_FIELDS, column) ? RENAMED_FIELDS[column] : column;
  return field !== undefined && READ_COLUMNS.has(field) ? field : undefined;
}

/** The delimiter `headerLine` has most of. */
function delimiterOf(headerLine: string): string {
  const countOf = (delimiter: string) => headerLine.split(delimiter).length;
  return DELIMITERS.reduce((best, delimiter) =>
    countOf(delimiter) > countOf(best) ? delimiter : best,
  );
}

/** `text`'s rows of cells, without blank lines; a quoted cell may hold anything. */
function rowsOf(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let index = 0;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((written) => written.trim() !== "")) rows.push(row);
    row = [];
  };
  while (index < text.length) {
    const character = text.charAt(index);
    if (character === '"' && cell.trim() === "") {
      const closed = quotedCellAt(text, index);
      cell = closed.value;
      index = closed.next;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
      index += 1;
    } else if (character === "\n") {
      endRow();
      index += 1;
    } else {
      cell += character;
      index += 1;
    }
  }
  endRow();
  return rows;
}

/** The quoted cell opening at `start`: its text, and where reading goes on. */
function quotedCellAt(text: string, start: number): { value: string; next: number } {
  let value = "";
  let index = start + 1;
  while (index < text.length) {
    const character = text.charAt(index);
    if (character !== '"') {
      value += character;
      index += 1;
    } else if (text.charAt(index + 1) === '"') {
      value += '"';
      index += 2;
    } else {
      return { value, next: index + 1 };
    }
  }
  const line = text.slice(0, start).split("\n").length;
  throw new PasteRefused(`A quote opened on line ${line} of this CSV never closes`);
}

function recordOfRow(
  fields: readonly (string | undefined)[],
  row: readonly string[],
  rowNumber: number,
): CsvRecord {
  if (row.slice(fields.length).some((cell) => cell.trim() !== "")) {
    throw new PasteRefused(
      `Row ${rowNumber} of this CSV has ${row.length} cells, and its header ${fields.length}`,
    );
  }
  const record: CsvRecord = {};
  row.forEach((cell, index) => {
    const field = fields[index];
    const written = cell.trim();
    if (field !== undefined && written !== "") record[field] = cellValue(field, written);
  });
  return record;
}

/** A cell as its field holds it. One that isn't a number stays as written, for the store to name. */
function cellValue(field: string, cell: string): unknown {
  if (field === "tags") return cell.split(/[;\s]+/).filter(Boolean);
  if (!NUMBER_COLUMNS.has(field)) return cell;
  const number = Number(cell);
  return Number.isNaN(number) ? cell : number;
}
